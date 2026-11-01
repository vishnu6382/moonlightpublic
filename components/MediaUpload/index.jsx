'use client';

import React, { useState, useRef } from 'react';
import styles from './MediaUpload.module.css';
import {
  validateMediaFile,
  getImageDimensions,
  validatePano360AspectRatio,
  compressImage,
} from '@/lib/imageCompressor';
import { STORAGE_LIMITS } from '@/lib/storageLimits';

export default function MediaUpload({
  mediaType = 'image', // 'image' | 'video' | 'pano360' | 'all'
  multiple = false,
  onSuccess,
  roomId = null,
  categoryId = null,
  showOnHomeDefault = false,
  showInGalleryDefault = false,
}) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const acceptMap = {
    image: 'image/jpeg,image/png,image/webp,image/avif,image/gif,.jpg,.jpeg,.png,.webp,.avif,.gif',
    video: 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov',
    pano360: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
    all: 'image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm,video/quicktime,.jpg,.jpeg,.png,.webp,.avif,.gif,.mp4,.webm,.mov',
  };

  const handleFileSelection = async (fileList) => {
    setError('');
    setSuccessMsg('');
    const files = Array.from(fileList);
    const preparedQueue = [];
    const warnings = [];

    for (const file of files) {
      // Determine file category
      let detectedType = mediaType;
      if (mediaType === 'all') {
        detectedType = file.type && file.type.startsWith('video/') ? 'video' : 'image';
      }

      // 1. Basic validation
      const validation = validateMediaFile(file, detectedType);
      if (!validation.valid) {
        warnings.push(`${file.name}: ${validation.error}`);
        continue;
      }

      // 2. Specific 360° aspect ratio check or detection
      let panoCheck = null;
      let isCandidate360 = false;
      if (detectedType === 'pano360') {
        try {
          const dims = await getImageDimensions(file);
          panoCheck = validatePano360AspectRatio(dims.width, dims.height);
          if (!panoCheck.valid) {
            warnings.push(`${file.name}: ${panoCheck.error}`);
            continue;
          }
        } catch (e) {
          warnings.push(`${file.name}: Failed to inspect 360° image dimensions.`);
          continue;
        }
      } else if (detectedType === 'image') {
        try {
          const dims = await getImageDimensions(file);
          if (dims.width && dims.height) {
            const ar = dims.width / dims.height;
            if (ar >= 1.9 && ar <= 2.1) {
              isCandidate360 = true;
            }
          }
        } catch (_) {}
      }

      preparedQueue.push({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        originalFile: file,
        mediaType: isCandidate360 ? 'pano360' : detectedType,
        is360: isCandidate360,
        isCandidate360,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: 'queued', // 'queued' | 'compressing' | 'uploading' | 'registering' | 'done' | 'failed'
        compressionInfo: isCandidate360 ? 'Detected 2:1 ratio (Marked as 360°)' : null,
      });
    }

    if (warnings.length > 0 && preparedQueue.length === 0) {
      setError(warnings.join(' | '));
      return;
    } else if (warnings.length > 0) {
      setError(`Some files were skipped: ${warnings.join(' | ')}`);
    }

    if (multiple) {
      setSelectedFiles((prev) => [...prev, ...preparedQueue]);
    } else {
      setSelectedFiles(preparedQueue.slice(0, 1));
    }
  };

  const removeFile = (id) => {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const executeUpload = async () => {
    if (selectedFiles.length === 0 || uploading) return;
    setError('');
    setSuccessMsg('');
    setUploading(true);

    let completedCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const item = selectedFiles[i];

      try {
        let fileToUpload = item.originalFile;

        // Step A: Client-side compression for images to handle large files (up to 40 MB)
        if (item.mediaType === 'image' || item.mediaType === 'pano360') {
          item.status = 'compressing';
          setSelectedFiles([...selectedFiles]);

          try {
            const compressionResult = await compressImage(
              item.originalFile,
              item.mediaType === 'pano360'
            );
            if (compressionResult && compressionResult.file) {
              fileToUpload = compressionResult.file;
              if (compressionResult.isCompressed) {
                const origMb = (compressionResult.originalSize / (1024 * 1024)).toFixed(1);
                const compMb = (compressionResult.compressedSize / (1024 * 1024)).toFixed(1);
                item.compressionInfo = `${origMb}MB → ${compMb}MB (optimized)`;
              } else {
                const mb = (item.originalFile.size / (1024 * 1024)).toFixed(1);
                item.compressionInfo = `${mb}MB (Original Full Quality)`;
              }
            }
          } catch (compErr) {
            console.warn('[Upload Compression Warning]:', compErr.message);
            // Fall back to original file if compression threw non-fatal error
          }
        }

        // Step B: Request signed upload configuration from server
        item.status = 'uploading';
        setSelectedFiles([...selectedFiles]);

        const configRes = await fetch('/api/admin/media/upload-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mediaType: item.mediaType }),
        });

        if (!configRes.ok) {
          const cfgErr = await configRes.json().catch(() => ({}));
          throw new Error(cfgErr.error || 'Failed to authenticate upload with server.');
        }

        const configData = await configRes.json();

        // Step C: Upload directly to Cloudinary (with chunked upload support for large videos up to 1.5 GB)
        const totalSize = fileToUpload.size;
        const CHUNK_SIZE = 20 * 1024 * 1024; // 20 MB chunks
        let cloudinaryData;

        if (totalSize > CHUNK_SIZE && item.mediaType === 'video') {
          // Chunked upload for large video files
          const uniqueUploadId = 'cld_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
          let start = 0;

          while (start < totalSize) {
            const end = Math.min(start + CHUNK_SIZE, totalSize);
            const chunk = fileToUpload.slice(start, end);
            const contentRange = `bytes ${start}-${end - 1}/${totalSize}`;

            const chunkFormData = new FormData();
            chunkFormData.append('file', chunk);
            chunkFormData.append('api_key', configData.apiKey);
            chunkFormData.append('timestamp', configData.timestamp);
            chunkFormData.append('signature', configData.signature);
            chunkFormData.append('folder', configData.folder);

            const chunkRes = await new Promise((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              xhr.open('POST', configData.uploadUrl);
              xhr.setRequestHeader('X-Unique-Upload-Id', uniqueUploadId);
              xhr.setRequestHeader('Content-Range', contentRange);

              xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                  const bytesUploadedSoFar = start + e.loaded;
                  const pct = Math.min(99, Math.round((bytesUploadedSoFar / totalSize) * 100));
                  item.progress = pct;
                  setSelectedFiles([...selectedFiles]);
                }
              };

              xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                  try {
                    resolve(JSON.parse(xhr.responseText));
                  } catch (e) {
                    reject(new Error('Invalid response from Cloudinary chunk upload.'));
                  }
                } else {
                  try {
                    const errResp = JSON.parse(xhr.responseText);
                    const msg = errResp.error?.message || `Chunk upload failed (${xhr.status})`;
                    if (
                      msg.toLowerCase().includes('file size too large') ||
                      msg.toLowerCase().includes('maximum is 104857600')
                    ) {
                      reject(
                        new Error(
                          `Cloudinary account limit: Your Cloudinary plan has a 100 MB max video limit. Cloudinary rejected this ${((totalSize)/(1024*1024)).toFixed(0)} MB file. Please compress with HandBrake or upgrade your Cloudinary plan to allow up to 1.5 GB.`
                        )
                      );
                    } else {
                      reject(new Error(msg));
                    }
                  } catch {
                    reject(new Error(`Chunk upload failed with status code ${xhr.status}.`));
                  }
                }
              };

              xhr.onerror = () =>
                reject(new Error('Network error during video chunk upload to Cloudinary.'));
              xhr.send(chunkFormData);
            });

            if (chunkRes && (chunkRes.secure_url || chunkRes.public_id)) {
              cloudinaryData = chunkRes;
            }
            start = end;
          }

          item.progress = 100;
          setSelectedFiles([...selectedFiles]);
        } else {
          // Standard single-part direct upload
          const formData = new FormData();
          formData.append('file', fileToUpload);
          formData.append('api_key', configData.apiKey);
          formData.append('timestamp', configData.timestamp);
          formData.append('signature', configData.signature);
          formData.append('folder', configData.folder);

          cloudinaryData = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', configData.uploadUrl);

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                item.progress = pct;
                setSelectedFiles([...selectedFiles]);
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                try {
                  resolve(JSON.parse(xhr.responseText));
                } catch (e) {
                  reject(new Error('Invalid response from Cloudinary.'));
                }
              } else {
                try {
                  const errResp = JSON.parse(xhr.responseText);
                  const msg = errResp.error?.message || 'Cloudinary upload failed.';
                  if (
                    msg.toLowerCase().includes('file size too large') ||
                    msg.toLowerCase().includes('maximum is 104857600')
                  ) {
                    reject(
                      new Error(
                        `Cloudinary account limit: Your Cloudinary plan has a 100 MB max video limit. Cloudinary rejected this ${((totalSize)/(1024*1024)).toFixed(0)} MB file. Please compress with HandBrake or upgrade your Cloudinary plan to allow up to 1.5 GB.`
                      )
                    );
                  } else {
                    reject(new Error(msg));
                  }
                } catch {
                  reject(new Error(`Upload failed with status code ${xhr.status}.`));
                }
              }
            };

            xhr.onerror = () => reject(new Error('Network error during upload to Cloudinary.'));
            xhr.send(formData);
          });
        }

        // Step D: Register uploaded asset in MongoDB
        item.status = 'registering';
        setSelectedFiles([...selectedFiles]);

        const registerRes = await fetch('/api/admin/media/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cloudinaryPublicId: cloudinaryData.public_id,
            secureUrl: cloudinaryData.secure_url,
            resourceType: cloudinaryData.resource_type || (item.mediaType === 'video' ? 'video' : 'image'),
            mediaType: item.mediaType,
            is360: Boolean(item.is360 || item.mediaType === 'pano360'),
            format: cloudinaryData.format,
            sizeBytes: cloudinaryData.bytes,
            width: cloudinaryData.width,
            height: cloudinaryData.height,
            durationSec: cloudinaryData.duration,
            title: item.name.replace(/\.[^/.]+$/, ''),
            roomId,
            categoryId,
            showOnHome: showOnHomeDefault,
            showInGallery: showInGalleryDefault,
          }),
        });

        if (!registerRes.ok) {
          const regErr = await registerRes.json().catch(() => ({}));
          throw new Error(
            regErr.error ||
              'Upload succeeded in Cloudinary, but registering into MongoDB failed. Please contact support.'
          );
        }

        const registeredData = await registerRes.json();
        item.status = 'done';
        completedCount++;
        const mediaObj = registeredData.media || {};
        const resolvedUrl = mediaObj.secureUrl || mediaObj.url || '';
        const payload = {
          ...mediaObj,
          url: resolvedUrl,
          secureUrl: resolvedUrl,
        };
        if (onSuccess) onSuccess(payload);
      } catch (err) {
        item.status = 'failed';
        setError(err.message || 'Upload failed.');
        break;
      }
    }

    setUploading(false);
    if (completedCount === selectedFiles.length && completedCount > 0) {
      setSuccessMsg(`Successfully uploaded ${completedCount} file${completedCount > 1 ? 's' : ''}.`);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={styles.uploadContainer}>
      <div
        className={`${styles.dropzone} ${dragOver ? styles.dropzoneActive : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files) handleFileSelection(e.dataTransfer.files);
        }}
        onClick={() => {
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className={styles.hiddenInput}
          accept={acceptMap[mediaType] || acceptMap.all}
          multiple={multiple}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            if (e.target.files) handleFileSelection(e.target.files);
          }}
          disabled={uploading}
        />
        <p className={styles.dropzoneTitle}>
          Click or drag & drop files here to upload
        </p>
        <p className={styles.dropzoneSub}>
          {mediaType === 'video'
            ? `MP4, WebM, MOV up to ${STORAGE_LIMITS.video.maxSizeLabel} (current plan)`
            : mediaType === 'pano360'
            ? `360° Equirectangular JPEG/WebP (2:1 aspect ratio, up to ${STORAGE_LIMITS.pano360.maxSizeLabel})`
            : `JPEG, PNG, WebP up to ${STORAGE_LIMITS.image.maxSizeLabel} (auto-optimized on delivery)`}
        </p>

        <div className={styles.typeChips}>
          {mediaType === 'all' && (
            <>
              <span className={styles.typeChip}>Photos (max {STORAGE_LIMITS.image.maxSizeLabel})</span>
              <span className={styles.typeChip}>Videos (max {STORAGE_LIMITS.video.maxSizeLabel})</span>
              <span className={styles.typeChip}>360° Panoramas (2:1, max {STORAGE_LIMITS.pano360.maxSizeLabel})</span>
            </>
          )}
          {mediaType === 'image' && <span className={styles.typeChip}>Photos up to {STORAGE_LIMITS.image.maxSizeLabel}</span>}
          {mediaType === 'video' && <span className={styles.typeChip}>MP4/WebM up to {STORAGE_LIMITS.video.maxSizeLabel}</span>}
          {mediaType === 'pano360' && <span className={styles.typeChip}>2:1 Aspect ratio (max {STORAGE_LIMITS.pano360.maxSizeLabel})</span>}
        </div>
      </div>

      {error && <div className={styles.errorBox} role="alert">{error}</div>}
      {successMsg && <div className={styles.successBox} role="status">{successMsg}</div>}

      {selectedFiles.length > 0 && (
        <div className={styles.queueList}>
          {selectedFiles.map((item) => (
            <div key={item.id} className={styles.queueItem}>
              <div className={styles.fileInfo}>
                <div className={styles.fileName}>
                  {item.name}
                  {item.compressionInfo && (
                    <span className={styles.compressionBadge}>{item.compressionInfo}</span>
                  )}
                </div>
                <div className={styles.fileMeta}>
                  {(item.size / (1024 * 1024)).toFixed(2)} MB • {item.mediaType} • Status: {item.status}
                </div>
                {item.status === 'uploading' && (
                  <div className={styles.progressBarContainer}>
                    <div className={styles.progressBar} style={{ width: `${item.progress}%` }} />
                  </div>
                )}
              </div>

              {!uploading && (
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeFile(item.id)}
                >
                  Remove
                </button>
              )}
            </div>
          ))}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.uploadButton}
              onClick={executeUpload}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
