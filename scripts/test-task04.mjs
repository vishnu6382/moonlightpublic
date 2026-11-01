import http from 'http';

function fetchPage(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${urlPath}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('--- TASK 04 Verification ---');

  // 1. Home Page Verification
  const home = await fetchPage('/');
  console.log('Home status:', home.status);
  const homeContactCount = (home.data.match(/id="contact"/g) || []).length;
  const homeFooterCount = (home.data.match(/class="[^"]*footerSection[^"]*"/g) || []).length;
  console.log('Home Contact count (must be 1):', homeContactCount);
  console.log('Home Footer count (must be 1):', homeFooterCount);

  // Check section order on Home
  const orderTags = ['#stay', '#facilities', '#showcase', '#rooms', '#reviews', '#nearby', '#events', '#faq', '#contact'];
  const positions = orderTags.map(tag => ({
    tag,
    pos: home.data.indexOf(`id="${tag.replace('#', '')}"`)
  }));
  const isOrdered = positions.every((p, i) => i === 0 || p.pos > positions[i - 1].pos);
  console.log('Home section order correct:', isOrdered);

  // 2. /rooms Page Verification
  const rooms = await fetchPage('/rooms');
  console.log('/rooms status:', rooms.status);
  console.log('/rooms has "Our Rooms":', rooms.data.includes('Our Rooms'));
  console.log('/rooms has Moon 1 hero:', rooms.data.includes('Moon 1'));
  console.log('/rooms has Moon 2:', rooms.data.includes('Moon 2'));
  console.log('/rooms has Moon 11:', rooms.data.includes('Moon 11'));
  console.log('/rooms has Contact:', rooms.data.includes('id="contact"'));
  console.log('/rooms has Footer:', (rooms.data.match(/class="[^"]*footerSection[^"]*"/g) || []).length === 1);

  // 3. /rooms/moon-1 Page Verification
  const moon1 = await fetchPage('/rooms/moon-1');
  console.log('/rooms/moon-1 status:', moon1.status);
  console.log('Moon 1 has Twin Bed chip:', moon1.data.includes('Twin Bed'));
  console.log('Moon 1 has Max occupancy 3 chip:', moon1.data.includes('Max occupancy: 3'));
  console.log('Moon 1 has 1 room chip:', moon1.data.includes('1 room'));
  console.log('Moon 1 has 6 facilities:', 
    moon1.data.includes('Air-Conditioning') &&
    moon1.data.includes('Attached Bathroom') &&
    moon1.data.includes('Complimentary Toiletries') &&
    moon1.data.includes('Extra long bed') &&
    moon1.data.includes('Fully fenced property') &&
    moon1.data.includes('Well-ventilated stay')
  );
  console.log('Moon 1 has Room Facilities section:', moon1.data.includes('Room Facilities'));
  console.log('Moon 1 has Contact + Footer:', moon1.data.includes('id="contact"') && moon1.data.includes('footerSection'));

  // 4. /rooms/moon-2 Page Verification (Empty fields hidden cleanly)
  const moon2 = await fetchPage('/rooms/moon-2');
  console.log('/rooms/moon-2 status:', moon2.status);
  console.log('Moon 2 hides Room Facilities (empty):', !moon2.data.includes('Room Facilities'));
  console.log('Moon 2 hides bed details (empty):', !moon2.data.includes('Bed Details'));
  console.log('Moon 2 has Contact + Footer:', moon2.data.includes('id="contact"') && moon2.data.includes('footerSection'));

  // 5. Unknown slug 404 test
  const unknown = await fetchPage('/rooms/non-existent-room-slug');
  console.log('Unknown slug status (must be 404):', unknown.status);

  // 6. Other pages have shared Contact + Footer
  const gallery = await fetchPage('/gallery');
  console.log('/gallery has Contact:', gallery.data.includes('id="contact"'));
  console.log('/gallery has Footer:', gallery.data.includes('footerSection'));

  const nearby = await fetchPage('/nearby-areas');
  console.log('/nearby-areas has Contact:', nearby.data.includes('id="contact"'));
  console.log('/nearby-areas has Footer:', nearby.data.includes('footerSection'));

  const contact = await fetchPage('/contact');
  console.log('/contact has Contact:', contact.data.includes('id="contact"'));
  console.log('/contact has Footer:', contact.data.includes('footerSection'));

  console.log('--- ALL AUTOMATED CHECKS COMPLETED ---');
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
