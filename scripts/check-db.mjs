import mongoose from 'mongoose';
import dns from 'dns/promises';

function log(...args) {
  console.log(...args);
}

async function main() {
  log('Node version:', process.version);
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not defined');
    process.exit(1);
  }
  // Extract host without credentials
  let hostInfo = '';
  try {
    const atIdx = uri.indexOf('@');
    if (atIdx !== -1) {
      const afterAt = uri.slice(atIdx + 1);
      hostInfo = afterAt.split('/')[0];
    } else {
      const url = new URL(uri);
      hostInfo = url.host;
    }
    log('DB host (no credentials):', hostInfo);
  } catch (e) {
    console.error('Failed to parse URI:', e.message);
    process.exit(1);
  }

  async function resolveSrv(name, label) {
    try {
      const records = await dns.resolveSrv(name);
      log(`${label} SRV records for ${name}:`, records);
    } catch (e) {
      log(`${label} SRV lookup error for ${name}:`, e.code || e.message);
    }
  }

  // System DNS
  await resolveSrv(hostInfo, 'System DNS');

  // Google DNS
  try {
    await dns.setServers(['8.8.8.8']);
    await resolveSrv(hostInfo, 'Google DNS');
  } catch (e) {
    log('Failed to set Google DNS:', e.message);
  }

  // Cloudflare DNS
  try {
    await dns.setServers(['1.1.1.1']);
    await resolveSrv(hostInfo, 'Cloudflare DNS');
  } catch (e) {
    log('Failed to set Cloudflare DNS:', e.message);
  }

  // Reset DNS to default (OS)
  try {
    await dns.setServers([]);
  } catch {}

  const opts = { serverSelectionTimeoutMS: 8000, connectTimeoutMS: 8000 };
  try {
    const conn = await mongoose.connect(uri, opts);
    log('Mongoose connected');
    const admin = conn.connection.db.admin();
    const ping = await admin.ping();
    log('Ping result:', ping);
    const collections = await conn.connection.db.listCollections().toArray();
    for (const coll of collections) {
      const count = await conn.connection.db.collection(coll.name).estimatedDocumentCount();
      log(`Collection ${coll.name}: ${count} docs`);
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error('Mongoose connection/ping error:', e.message);
    process.exit(1);
  }
}

main();
