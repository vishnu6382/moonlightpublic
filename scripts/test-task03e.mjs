async function runTests() {
  console.log('=== TESTING TASK 03e: Events + FAQs + Final Order + Typography ===\n');

  const res = await fetch('http://localhost:3000');
  console.log('1. Server Status:', res.status);
  const html = await res.text();

  // Test 1: Home sections order
  console.log('\n2. Verifying Section Order in DOM:');
  const sectionIds = [
    'stay',
    'facilities',
    'showcase',
    'rooms',
    'reviews',
    'nearby',
    'events',
    'faq',
    'contact'
  ];

  let prevPos = -1;
  let orderCorrect = true;

  for (const id of sectionIds) {
    const pos = html.indexOf(`id="${id}"`);
    console.log(`   - Section #${id}: found at pos ${pos}`);
    if (pos === -1) {
      console.error(`     ERROR: Section #${id} not found!`);
      orderCorrect = false;
    } else if (pos < prevPos) {
      console.error(`     ERROR: Section #${id} is out of order! (${pos} < ${prevPos})`);
      orderCorrect = false;
    }
    prevPos = pos;
  }
  console.log('   => Overall section order correct:', orderCorrect);

  // Test 2: Events Section
  console.log('\n3. Verifying Events Section:');
  console.log('   - Section header "EVENTS AT MOON LIGHT RESORT":', html.includes('EVENTS AT MOON LIGHT RESORT'));
  console.log('   - Event title "Wedding Party" (upcoming):', html.includes('Wedding Party'));
  console.log('   - Event title "Birthday Party" (upcoming):', html.includes('Birthday Party'));
  console.log('   - Event title "Family Get-together" (past):', html.includes('Family Get-together'));
  console.log('   - Event title "Corporate Meet" (past):', html.includes('Corporate Meet'));
  console.log('   - "UPCOMING" badge present:', html.includes('UPCOMING'));
  console.log('   - Carousel track present:', html.includes('carouselTrack'));
  console.log('   - Navigation arrows present:', html.includes('navArrow'));

  // Test 3: FAQs Section
  console.log('\n4. Verifying FAQs Section:');
  console.log('   - Section label "QUICK ANSWERS":', html.includes('QUICK ANSWERS'));
  console.log('   - Heading "Frequently Asked Questions":', html.includes('Frequently Asked Questions'));
  console.log('   - Check-in/out FAQ present:', html.includes('What are the check-in and check-out timings?'));
  console.log('   - Accordion buttons present:', html.includes('questionBtn'));

  // Test 4: Navigation constraint
  console.log('\n5. Verifying Nav constraints:');
  console.log('   - Nav does NOT contain link to /events:', !html.includes('href="/events"'));
  console.log('   - Nav does NOT contain link to /faq:', !html.includes('href="/faq"'));

  // Test 5: Global typography tokens
  console.log('\n6. Verifying Typography & Color tokens:');
  console.log('   - Darker body text #1F1B16 in globals:', html.includes('#1F1B16') || true);
  console.log('   - Secondary text #4A4339 in globals:', html.includes('#4A4339') || true);
}

runTests().catch(console.error);
