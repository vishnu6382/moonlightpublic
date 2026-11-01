async function test() {
  const res = await fetch('http://localhost:3000');
  console.log('HTTP Status:', res.status);
  const html = await res.text();

  console.log('1. About section present:', html.includes('id="about"'));
  console.log('   - No "Read More" button:', !html.includes('Read More'));
  console.log('2. Showcase section present:', html.includes('id="showcase"'));
  console.log('   - Portal ring text present:', html.includes('MOON LIGHT RESORT'));
  console.log('   - View Gallery button present:', html.includes('View Gallery'));
  console.log('3. Rooms section present:', html.includes('id="rooms"'));
  console.log('   - Room links use /rooms/:', html.includes('/rooms/mountain-view-cottage'));
  console.log('   - View All Rooms button present:', html.includes('View All Rooms'));
  console.log('4. Empty Reviews section hidden:', !html.includes('id="reviews"'));
  console.log('5. Contact section present:', html.includes('id="contact"'));
  console.log('   - Real phone 1 (98420 44300):', html.includes('98420 44300'));
  console.log('   - Real phone 2 (98944 86300):', html.includes('98944 86300'));
  console.log('   - WhatsApp link present:', html.includes('wa.me/919842044300'));
  console.log('6. Empty Nearby section hidden:', !html.includes('id="nearby"'));
  console.log('7. Footer present:', html.includes('footer'));
  console.log('   - Footer watermark present:', html.includes('Moon Light Resort'));
}

test().catch(console.error);
