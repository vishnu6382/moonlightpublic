import http from 'http';

function check() {
  http.get('http://localhost:3000', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('--- SHOW_DEMO=false Test ---');
      console.log('Has Events section:', data.includes('id="events"'));
      console.log('Has FAQ section:', data.includes('id="faq"'));
      console.log('Has Reviews section:', data.includes('id="reviews"'));
      console.log('Has Nearby section:', data.includes('id="nearby"'));
      
      const sections = ['#stay', '#facilities', '#showcase', '#rooms', '#contact'];
      const present = sections.map(s => ({
        section: s,
        found: data.includes(`id="${s.replace('#', '')}"`),
        pos: data.indexOf(`id="${s.replace('#', '')}"`)
      }));
      console.log('Standard sections status:', JSON.stringify(present, null, 2));

      const isOrdered = present.every((item, i) => i === 0 || item.pos > present[i - 1].pos);
      console.log('Order maintained:', isOrdered);
      process.exit(0);
    });
  }).on('error', err => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

check();
