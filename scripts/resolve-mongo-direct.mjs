import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Resolving MongoDB Atlas direct replica set hosts via Secure DNS (DoH)...');
  const srvHost = 'cluster0.ts3rrnx.mongodb.net';

  try {
    const srvRes = await fetch(`https://dns.google/resolve?name=_mongodb._tcp.${srvHost}&type=SRV`).then(r => r.json());
    if (!srvRes.Answer || srvRes.Answer.length === 0) {
      throw new Error('Could not resolve SRV records from Google DNS.');
    }

    const hosts = srvRes.Answer.map(a => {
      const parts = a.data.trim().split(/\s+/);
      const host = parts[3].replace(/\.$/, '');
      const port = parts[2];
      return `${host}:${port}`;
    }).join(',');

    const txtRes = await fetch(`https://dns.google/resolve?name=${srvHost}&type=TXT`).then(r => r.json());
    let params = 'authSource=admin&retryWrites=true&w=majority';
    if (txtRes.Answer && txtRes.Answer.length > 0) {
      const rawTxt = txtRes.Answer[0].data.replace(/^"+|"+$/g, '');
      params = `${rawTxt}&authSource=admin&retryWrites=true&w=majority`;
    }

    const rawUri = process.env.MONGODB_URI;
    if (!rawUri) {
      throw new Error('Please set MONGODB_URI in environment.');
    }
    const urlObj = new URL(rawUri.replace('mongodb+srv://', 'http://'));
    const username = decodeURIComponent(urlObj.username);
    const password = decodeURIComponent(urlObj.password);
    const dbName = urlObj.pathname.replace(/^\//, '') || 'moonlight';

    const directUri = `mongodb://${username}:${encodeURIComponent(password)}@${hosts}/${dbName}?ssl=true&${params}`;

    console.log('\n✅ Successfully resolved direct connection string:');
    console.log(directUri);

    // Update .env file automatically
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      envContent = envContent.replace(
        /MONGODB_URI="[^"]*"/,
        `MONGODB_URI="${directUri}"`
      );
      fs.writeFileSync(envPath, envContent, 'utf8');
      console.log('\n✅ Updated .env file with direct connection string successfully!');
      console.log('Now you can run "npm run build" and "npm start" without any SRV ECONNREFUSED error!');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();

