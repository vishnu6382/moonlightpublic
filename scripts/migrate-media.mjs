import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import fs from 'fs';
import path from 'path';
import connectDB from '../lib/db.js';
import Room from '../models/Room.js';
import HomeContent from '../models/HomeContent.js';
import Event from '../models/Event.js';
import Place from '../models/Place.js';
import MediaItem from '../models/MediaItem.js';

const isDryRun = process.argv.includes('--dry-run');

/**
 * Extracts Cloudinary public_id from a URL if possible.
 */
function extractCloudinaryPublicId(url) {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
  if (match && match[1]) {
    // remove transformation parameters if any
    const segments = match[1].split('/');
    if (segments[0].includes(',') || segments[0].startsWith('q_') || segments[0].startsWith('w_') || segments[0].startsWith('c_')) {
      segments.shift();
    }
    return segments.join('/');
  }
  return null;
}

async function run() {
  console.log(`\n========================================================`);
  console.log(`  MOON LIGHT RESORT: UNIFIED MEDIA MIGRATION SCRIPT     `);
  console.log(`  Mode: ${isDryRun ? 'DRY RUN (No database modifications)' : 'REAL MIGRATION (Modifying DB)'}`);
  console.log(`========================================================\n`);

  await connectDB();

  // 1. Fetch all documents from all collections
  const [rooms, home, events, places, existingMedia] = await Promise.all([
    Room.find({}).lean(),
    HomeContent.findOne({}).lean(),
    Event.find({}).lean(),
    Place.find({}).lean(),
    MediaItem.find({}).lean(),
  ]);

  console.log(`Loaded:`);
  console.log(`- ${rooms.length} Rooms`);
  console.log(`- ${home ? 1 : 0} Home Content Document`);
  console.log(`- ${events.length} Events`);
  console.log(`- ${places.length} Nearby Places`);
  console.log(`- ${existingMedia.length} Existing MediaItem records in library\n`);

  const mediaPool = new Map(); // publicId or URL -> normalized asset record
  const existingByUrl = new Map();
  const existingByPublicId = new Map();

  existingMedia.forEach((m) => {
    if (m.secureUrl) existingByUrl.set(m.secureUrl, m);
    if (m.cloudinaryPublicId) existingByPublicId.set(m.cloudinaryPublicId, m);
  });

  function registerAsset({ url, mediaType = 'image', title = '', alt = '', caption = '', roomId = null, width = null, height = null, source = '' }) {
    if (!url || typeof url !== 'string' || !url.startsWith('http')) return;
    const pubId = extractCloudinaryPublicId(url) || url;

    if (!mediaPool.has(pubId)) {
      const existing = existingByPublicId.get(pubId) || existingByUrl.get(url);
      mediaPool.set(pubId, {
        existingId: existing?._id?.toString() || null,
        publicId: pubId,
        secureUrl: url,
        mediaType: mediaType || 'image',
        resourceType: mediaType === 'video' ? 'video' : 'image',
        width: width || existing?.width || null,
        height: height || existing?.height || null,
        title: title || existing?.title || '',
        altText: alt || existing?.altText || '',
        caption: caption || existing?.caption || '',
        roomId: roomId || existing?.roomId || null,
        usages: [source],
      });
    } else {
      const rec = mediaPool.get(pubId);
      rec.usages.push(source);
      if (!rec.width && width) rec.width = width;
      if (!rec.height && height) rec.height = height;
    }
  }

  // 2. Scan Rooms
  for (const r of rooms) {
    if (r.mainImage) {
      registerAsset({
        url: r.mainImage,
        mediaType: 'image',
        title: `${r.name} Cover`,
        alt: `${r.name} Main View`,
        roomId: r._id,
        source: `Room: ${r.name} (Cover)`,
      });
    }

    (r.photos || []).forEach((p, idx) => {
      registerAsset({
        url: p.src,
        mediaType: 'image',
        title: p.caption || `${r.name} Photo ${idx + 1}`,
        alt: p.alt || `${r.name}`,
        caption: p.caption || '',
        width: p.width,
        height: p.height,
        roomId: r._id,
        source: `Room: ${r.name} (Photo #${idx + 1})`,
      });
    });

    (r.videos || []).forEach((v, idx) => {
      registerAsset({
        url: v.src,
        mediaType: 'video',
        title: v.title || `${r.name} Video ${idx + 1}`,
        caption: v.caption || '',
        width: v.width,
        height: v.height,
        roomId: r._id,
        source: `Room: ${r.name} (Video #${idx + 1})`,
      });
    });

    if (r.pano360) {
      const pSrc = typeof r.pano360 === 'string' ? r.pano360 : r.pano360.src;
      if (pSrc) {
        registerAsset({
          url: pSrc,
          mediaType: 'pano360',
          title: `${r.name} 360° Panorama`,
          alt: `${r.name} 360`,
          roomId: r._id,
          source: `Room: ${r.name} (360° Panorama)`,
        });
      }
    }
  }

  // 3. Scan Home Content
  if (home) {
    if (home.hero?.image) {
      registerAsset({
        url: home.hero.image,
        mediaType: 'image',
        title: 'Home Hero Image',
        source: 'Home (Hero)',
      });
    }
    if (home.stay?.image) {
      registerAsset({
        url: home.stay.image,
        mediaType: 'image',
        title: 'Home Stay Feature',
        source: 'Home (Stay)',
      });
    }
    (home.facilities?.items || []).forEach((f, idx) => {
      if (f.image) {
        registerAsset({
          url: f.image,
          mediaType: 'image',
          title: f.title || `Facility ${idx + 1}`,
          source: `Home (Facility: ${f.title || idx + 1})`,
        });
      }
    });
    (home.photoShowcase?.items || []).forEach((it, idx) => {
      const u = typeof it === 'string' ? it : it.src;
      if (u) {
        registerAsset({
          url: u,
          mediaType: 'image',
          title: `Home Showcase #${idx + 1}`,
          source: `Home (Photo Showcase #${idx + 1})`,
        });
      }
    });
  }

  // 4. Scan Events
  for (const ev of events) {
    if (ev.image) {
      registerAsset({
        url: ev.image,
        mediaType: 'image',
        title: ev.title || 'Event',
        source: `Event: ${ev.title}`,
      });
    }
  }

  // 5. Scan Places
  for (const pl of places) {
    if (pl.image) {
      registerAsset({
        url: pl.image,
        mediaType: 'image',
        title: pl.name || 'Nearby Place',
        source: `Nearby Place: ${pl.name}`,
      });
    }
  }

  // 6. Summary of Assets Found
  const allUnique = Array.from(mediaPool.values());
  const toCreate = allUnique.filter((a) => !a.existingId);
  const alreadyInLibrary = allUnique.filter((a) => a.existingId);

  console.log(`--------------------------------------------------------`);
  console.log(`MIGRATION AUDIT SUMMARY:`);
  console.log(`- Total unique media files across website: ${allUnique.length}`);
  console.log(`- Already registered in MediaItem collection: ${alreadyInLibrary.length}`);
  console.log(`- New MediaItem records to be created: ${toCreate.length}`);
  console.log(`--------------------------------------------------------\n`);

  console.log(`Sample assets to be linked into unified library:`);
  allUnique.slice(0, 10).forEach((a, idx) => {
    console.log(
      `  ${idx + 1}. [${a.mediaType.toUpperCase()}] ${a.title || a.publicId} (Used in ${a.usages.length} places)`
    );
  });
  if (allUnique.length > 10) {
    console.log(`  ... and ${allUnique.length - 10} more items.`);
  }

  // 7. If Dry Run, exit safely without touching database
  if (isDryRun) {
    console.log(`\n========================================================`);
    console.log(`[DRY RUN COMPLETE] Zero database writes performed.`);
    console.log(`To execute real migration, run: node scripts/migrate-media.mjs`);
    console.log(`========================================================\n`);
    process.exit(0);
  }

  // 8. REAL MIGRATION: Create backup first!
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupFile = path.join(backupDir, `backup-before-migration-${Date.now()}.json`);
  fs.writeFileSync(
    backupFile,
    JSON.stringify({ rooms, home, events, places, media: existingMedia }, null, 2),
    'utf-8'
  );
  console.log(`\nSaved backup file to: ${backupFile}`);

  // Create new MediaItem records
  console.log(`Inserting ${toCreate.length} new records into MediaItem collection...`);
  for (const item of toCreate) {
    const created = await MediaItem.create({
      provider: 'cloudinary',
      cloudinaryPublicId: item.publicId,
      secureUrl: item.secureUrl,
      mediaType: item.mediaType,
      resourceType: item.resourceType,
      title: item.title,
      altText: item.altText,
      caption: item.caption,
      width: item.width,
      height: item.height,
      roomId: item.roomId,
      showInGallery: true,
      isActive: true,
    });
    item.existingId = created._id.toString();
  }

  // Link mediaId references back to Rooms
  console.log(`Updating Room documents with mediaId references...`);
  for (const r of rooms) {
    let modified = false;

    // Photos
    const updatedPhotos = (r.photos || []).map((p) => {
      const pubId = extractCloudinaryPublicId(p.src) || p.src;
      const match = mediaPool.get(pubId);
      if (match?.existingId && (!p.mediaId || p.mediaId !== match.existingId)) {
        modified = true;
        return { ...p, mediaId: match.existingId };
      }
      return p;
    });

    // Videos
    const updatedVideos = (r.videos || []).map((v) => {
      const pubId = extractCloudinaryPublicId(v.src) || v.src;
      const match = mediaPool.get(pubId);
      if (match?.existingId && (!v.mediaId || v.mediaId !== match.existingId)) {
        modified = true;
        return { ...v, mediaId: match.existingId };
      }
      return v;
    });

    // Pano360
    let updatedPano = r.pano360;
    if (r.pano360) {
      const pSrc = typeof r.pano360 === 'string' ? r.pano360 : r.pano360.src;
      const pubId = extractCloudinaryPublicId(pSrc) || pSrc;
      const match = mediaPool.get(pubId);
      if (match?.existingId) {
        if (typeof r.pano360 === 'string') {
          updatedPano = { src: r.pano360, mediaId: match.existingId };
          modified = true;
        } else if (!r.pano360.mediaId) {
          updatedPano = { ...r.pano360, mediaId: match.existingId };
          modified = true;
        }
      }
    }

    if (modified) {
      await Room.findByIdAndUpdate(r._id, {
        $set: {
          photos: updatedPhotos,
          videos: updatedVideos,
          pano360: updatedPano,
        },
      });
      console.log(`  ✓ Updated references for Room: ${r.name}`);
    }
  }

  console.log(`\n========================================================`);
  console.log(`[MIGRATION COMPLETE] All media unified in MediaItem collection!`);
  console.log(`========================================================\n`);
  process.exit(0);
}

run().catch((err) => {
  console.error('[Migration Error]:', err);
  process.exit(1);
});

