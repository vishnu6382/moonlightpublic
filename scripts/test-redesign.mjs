async function testRedesign() {
  console.log('--- Testing Redesigned Home Page (Production Server) ---');
  
  // 1. Test Home page
  const res = await fetch('http://localhost:3000');
  console.log('1. Home Page HTTP Status:', res.status);
  const html = await res.text();

  console.log('2. Section checks:');
  console.log('   - Stay Section (id="stay"):', html.includes('id="stay"'));
  console.log('   - "Together Time in Nedungulam":', html.includes('Together Time in Nedungulam'));
  console.log('   - "Villa rooms & dorms":', html.includes('Villa rooms &amp; dorms') || html.includes('Villa rooms & dorms'));
  console.log('   - "10 rooms":', html.includes('10 rooms'));
  console.log('   - Facilities Section (id="facilities"):', html.includes('id="facilities"'));
  console.log('   - Facility Groups (Comfort, Food, Space & Stay, Extras):', 
    html.includes('Comfort') && html.includes('Food') && html.includes('Space &amp; Stay') || html.includes('Space & Stay'));
  console.log('   - Showcase Section (id="showcase"):', html.includes('id="showcase"'));
  console.log('   - Portal ring text ("MOON LIGHT RESORT"):', html.includes('MOON LIGHT RESORT'));
  console.log('   - View Gallery button:', html.includes('View Gallery'));
  console.log('   - Rooms Section (id="rooms"):', html.includes('id="rooms"'));
  console.log('   - Room "Moon 1":', html.includes('Moon 1'));
  console.log('   - Room links use /rooms/moon-1:', html.includes('/rooms/moon-1'));
  console.log('   - View All Rooms button:', html.includes('View All Rooms'));
  console.log('   - Reviews hidden when empty:', !html.includes('id="reviews"'));
  console.log('   - Contact Section (id="contact"):', html.includes('id="contact"'));
  console.log('   - Contact Title "Contact us":', html.includes('Contact us'));
  console.log('   - Phone 98420 44300:', html.includes('98420 44300'));
  console.log('   - Phone 98944 86300:', html.includes('98944 86300'));
  console.log('   - Address present:', html.includes('Thambagoundanoor to Idappadi main Road, Koneripatti'));
  console.log('   - Mobile Call button in Nav:', html.includes('mobileCallPill') || html.includes('Call'));
  console.log('   - About link NOT in Nav/Footer:', !html.includes('href="/about"'));

  // 2. Test /about returns 404
  const aboutRes = await fetch('http://localhost:3000/about');
  console.log('3. /about Route returns 404:', aboutRes.status === 404);

  // 3. Test Enquiries API
  console.log('4. Testing /api/enquiries:');
  const apiEmptyRes = await fetch('http://localhost:3000/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  console.log('   - Empty POST rejected (400):', apiEmptyRes.status === 400);

  const apiValidRes = await fetch('http://localhost:3000/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Ramesh',
      email: 'ramesh@example.com',
      phone: '9842044300',
      message: 'Need 2 villa rooms for weekend.',
    }),
  });
  const apiValidData = await apiValidRes.json();
  console.log('   - Valid POST accepted (200):', apiValidRes.status === 200, apiValidData.success);

  // 4. Test Honeypot
  const apiBotRes = await fetch('http://localhost:3000/api/enquiries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Bot',
      email: 'bot@spam.com',
      phone: '1234567890',
      message: 'Spam',
      botField: 'I am a bot',
    }),
  });
  console.log('   - Bot Honeypot handled silently (200):', apiBotRes.status === 200);

  // 5. Test Rooms Page
  const roomsRes = await fetch('http://localhost:3000/rooms');
  console.log('5. /rooms Page HTTP Status:', roomsRes.status);
}

testRedesign().catch(console.error);
