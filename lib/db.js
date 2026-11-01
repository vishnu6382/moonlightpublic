import dns from 'node:dns';
import mongoose from 'mongoose';
import '../models/index.js';

// Force Node.js DNS resolver to prefer IPv4 over IPv6.
// Prevents ECONNRESET / timeout issues on Windows, Indian ISPs (Jio, Airtel, Vi, BSNL) and AWS Atlas endpoints.
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (_) {}

// Modern returnDocument default to silence legacy Mongoose deprecation warning
try {
  mongoose.set('returnDocument', 'after');
} catch (_) {}

/**
 * Global cache to keep a single mongoose connection across hot reloads.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Known Atlas cluster replica set seeds for cluster0.ts3rrnx.mongodb.net
// Direct seedlist bypasses DNS SRV queries entirely, ensuring 100% reliable connections
// across all Indian ISPs, Wi-Fi networks, and mobile hotspots (Jio, Airtel, Vi, BSNL).
const KNOWN_SEEDS = {
  'cluster0.ts3rrnx.mongodb.net': {
    hosts: 'ac-kxhwshe-shard-00-00.ts3rrnx.mongodb.net:27017,ac-kxhwshe-shard-00-01.ts3rrnx.mongodb.net:27017,ac-kxhwshe-shard-00-02.ts3rrnx.mongodb.net:27017',
    params: 'ssl=true&replicaSet=atlas-jfyk5u-shard-0&authSource=admin&retryWrites=true&w=majority',
  },
};

/**
 * Converts a mongodb+srv:// URI to a direct replica set seedlist URI
 * so that no SRV DNS query is needed.
 */
function toDirectUri(rawUri) {
  if (!rawUri || !rawUri.startsWith('mongodb+srv://')) return rawUri;
  try {
    const urlObj = new URL(rawUri.replace('mongodb+srv://', 'http://'));
    const host = urlObj.hostname;
    const auth = urlObj.username
      ? `${decodeURIComponent(urlObj.username)}:${decodeURIComponent(urlObj.password)}@`
      : '';
    const dbName = urlObj.pathname.replace(/^\//, '') || 'moonlight';

    if (KNOWN_SEEDS[host]) {
      const { hosts, params } = KNOWN_SEEDS[host];
      return `mongodb://${auth}${hosts}/${dbName}?${params}`;
    }
  } catch (e) {
    // ignore
  }
  return rawUri;
}

export async function connectDB() {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }
  if (mongoose.connection.readyState === 0 || mongoose.connection.readyState === 3) {
    cached.conn = null;
    cached.promise = null;
  }

  // Get primary URI from environment
  let rawUri = process.env.MONGODB_URI;
  if (typeof rawUri === 'string') {
    rawUri = rawUri.trim().replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '');
  }

  let rawFallbackUri = process.env.MONGODB_URI_FALLBACK;
  if (typeof rawFallbackUri === 'string') {
    rawFallbackUri = rawFallbackUri.trim().replace(/^"+|"+$/g, '').replace(/^'+|'+$/g, '');
  }

  if (!rawUri && !rawFallbackUri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 60000,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      family: 4, // Explicitly force IPv4 socket connections
    };

    cached.promise = (async () => {
      // Direct URI bypasses ISP/Wi-Fi DNS SRV blockage
      const directUri = toDirectUri(rawUri);

      // Attempt 1: Direct Seedlist connection (works on all Wi-Fi and mobile networks)
      if (directUri) {
        try {
          const conn = await mongoose.connect(directUri, opts);
          console.info('[MongoDB] Connected successfully (direct seedlist)');
          return conn;
        } catch (dirErr) {
          console.warn('[MongoDB] Direct seedlist connection error:', dirErr.message);
        }
      }

      // Attempt 2: Primary raw URI as provided
      if (rawUri && rawUri !== directUri) {
        try {
          const conn = await mongoose.connect(rawUri, opts);
          console.info('[MongoDB] Connected successfully via primary URI');
          return conn;
        } catch (rawErr) {
          console.warn('[MongoDB] Primary URI error:', rawErr.message);
        }
      }

      // Attempt 3: Dynamic DNS-over-HTTPS (DoH) resolution if needed
      const srvCandidate = (rawUri && rawUri.includes('mongodb+srv://'))
        ? rawUri
        : (rawFallbackUri && rawFallbackUri.includes('mongodb+srv://'))
        ? rawFallbackUri
        : null;

      if (srvCandidate) {
        try {
          const urlObj = new URL(srvCandidate.replace('mongodb+srv://', 'http://'));
          const srvHost = urlObj.hostname;
          const auth = urlObj.username ? `${decodeURIComponent(urlObj.username)}:${decodeURIComponent(urlObj.password)}@` : '';
          const dbName = urlObj.pathname.replace(/^\//, '') || 'moonlight';

          let res = await fetch(`https://dns.google/resolve?name=_mongodb._tcp.${srvHost}&type=SRV`)
            .then(r => r.json())
            .catch(() => null);

          if (!res?.Answer) {
            res = await fetch(`https://cloudflare-dns.com/dns-query?name=_mongodb._tcp.${srvHost}&type=SRV`, {
              headers: { accept: 'application/dns-json' },
            }).then(r => r.json()).catch(() => null);
          }

          if (res?.Answer && res.Answer.length > 0) {
            const hosts = res.Answer.map(a => {
              const p = a.data.trim().split(/\s+/);
              return `${p[3].replace(/\.$/, '')}:${p[2]}`;
            }).join(',');

            let txtRes = await fetch(`https://dns.google/resolve?name=${srvHost}&type=TXT`)
              .then(r => r.json())
              .catch(() => null);

            if (!txtRes?.Answer) {
              txtRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${srvHost}&type=TXT`, {
                headers: { accept: 'application/dns-json' },
              }).then(r => r.json()).catch(() => null);
            }

            let params = 'authSource=admin&retryWrites=true&w=majority';
            if (txtRes?.Answer && txtRes.Answer.length > 0) {
              const rawTxt = txtRes.Answer[0].data.replace(/^"+|"+$/g, '');
              params = `${rawTxt}&retryWrites=true&w=majority`;
            }

            const dynamicUri = `mongodb://${auth}${hosts}/${dbName}?ssl=true&${params}`;
            const dohConn = await mongoose.connect(dynamicUri, opts);
            console.info('[MongoDB] Connected successfully using DoH replica set');
            return dohConn;
          }
        } catch (dohErr) {
          console.warn('[MongoDB] DoH resolution error:', dohErr.message);
        }
      }

      // Attempt 4: Fallback URI
      if (rawFallbackUri) {
        return await mongoose.connect(rawFallbackUri, opts);
      }

      throw new Error('Unable to connect to MongoDB cluster on any network path.');
    })();
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.conn = null;
    cached.promise = null;
    throw new Error(`MongoDB connection error: ${e.message}`);
  }

  return cached.conn;
}

export default connectDB;
