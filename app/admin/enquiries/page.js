'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './enquiries.module.css';

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/enquiries?status=${statusFilter}`);
      if (!res.ok) throw new Error('Failed to load enquiries');
      const data = await res.json();
      setEnquiries(data.enquiries || []);
      setUnreadCount(data.unreadCount || 0);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      setError(err.message || 'Error fetching enquiries');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  const handleUpdateStatus = async (id, nextStatus) => {
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setSuccessMsg('Status updated');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadEnquiries();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete the enquiry from "${name}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/enquiries/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete enquiry');
      setSuccessMsg('Enquiry deleted');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadEnquiries();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.screenIntro}>
        <h1 className={styles.screenTitle}>Guest Enquiries Inbox</h1>
        <p className={styles.screenHelp}>
          What this screen does: View and manage customer inquiries received through the public contact form. Reply on WhatsApp or call with one click.
        </p>
      </div>

      {successMsg && (
        <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <div className={styles.topBar}>
        <div className={styles.filtersGroup}>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === 'all' ? styles.filterBtnActive : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === 'unread' ? styles.filterBtnActive : ''}`}
            onClick={() => setStatusFilter('unread')}
          >
            Unread ({unreadCount})
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === 'contacted' ? styles.filterBtnActive : ''}`}
            onClick={() => setStatusFilter('contacted')}
          >
            Contacted
          </button>
          <button
            type="button"
            className={`${styles.filterBtn} ${statusFilter === 'archived' ? styles.filterBtnActive : ''}`}
            onClick={() => setStatusFilter('archived')}
          >
            Archived
          </button>
        </div>

        <a
          href="/contact"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#A9793E', textDecoration: 'none', fontSize: '0.82rem', fontWeight: 600 }}
        >
          View live contact form ↗
        </a>
      </div>

      <div className={styles.tableWrapper}>
        {loading ? (
          <div style={{ padding: '36px', textAlign: 'center', color: '#6B7280' }}>Loading enquiries...</div>
        ) : enquiries.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>No enquiries found</h3>
            <p>New inquiries submitted from the website contact page will appear here automatically.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Contact</th>
                <th>Message</th>
                <th>Received</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {enquiries.map((e) => {
                const cleanPhone = (e.phone || '').replace(/[^0-9]/g, '');
                const waUrl = `https://wa.me/${cleanPhone.startsWith('91') ? cleanPhone : '91' + cleanPhone}?text=${encodeURIComponent(`Hi ${e.name}, thank you for contacting Moon Light Resort regarding your enquiry: "${e.message.substring(0, 60)}..."`)}`;
                return (
                  <tr key={e._id} className={e.status === 'unread' ? styles.unreadRow : ''}>
                    <td>
                      <strong>{e.name}</strong>
                    </td>
                    <td>
                      <div>{e.phone}</div>
                      <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>{e.email}</div>
                    </td>
                    <td style={{ maxWidth: '320px', lineHeight: 1.4 }}>
                      {e.message}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                      {new Date(e.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <select
                        value={e.status}
                        onChange={(ev) => handleUpdateStatus(e._id, ev.target.value)}
                        className={styles.statusSelect}
                      >
                        <option value="unread">Unread</option>
                        <option value="read">Read</option>
                        <option value="contacted">Contacted</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    <td>
                      <div className={styles.actionsGroup}>
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${styles.actionBtn} ${styles.whatsappBtn}`}
                          title="Reply to guest on WhatsApp"
                          onClick={() => {
                            if (e.status === 'unread') handleUpdateStatus(e._id, 'contacted');
                          }}
                        >
                          WhatsApp
                        </a>
                        <a
                          href={`tel:${e.phone}`}
                          className={`${styles.actionBtn} ${styles.callBtn}`}
                          title="Call guest"
                        >
                          Call
                        </a>
                        <button
                          type="button"
                          onClick={() => handleDelete(e._id, e.name)}
                          className={`${styles.actionBtn} ${styles.deleteBtn}`}
                          title="Delete enquiry"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
