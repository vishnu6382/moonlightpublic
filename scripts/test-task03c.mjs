async function testStay() {
  console.log('--- Testing TASK 03c HomeStay Redesign ---');

  const res = await fetch('http://localhost:3000');
  console.log('Server HTTP Status:', res.status);
  const html = await res.text();

  console.log('\n1. Big rounded card & Grid structure:');
  console.log('   - id="stay" present:', html.includes('id="stay"'));
  console.log('   - cardContainer present:', html.includes('cardContainer'));
  console.log('   - mainGrid present:', html.includes('mainGrid'));

  console.log('\n2. Row 1 Columns:');
  console.log('   - Stat panel present:', html.includes('statPanel'));
  console.log('   - "Villa rooms & dorms":', html.includes('Villa rooms &amp; dorms') || html.includes('Villa rooms & dorms'));
  console.log('   - "10 rooms":', html.includes('10 rooms'));
  console.log('   - Arrow button on 10 rooms:', html.includes('roundArrowBtn') || html.includes('View Resort scale'));
  console.log('   - Info tile present (Check-in & Check-out):', html.includes('infoTile') || html.includes('Check-in &amp; Check-out') || html.includes('Check-in & Check-out'));
  console.log('   - Info tile timing badge:', html.includes('Timings'));

  console.log('\n3. Right Tall Photo & Glass Card:');
  console.log('   - Tall photo present:', html.includes('tallPhotoCol'));
  console.log('   - Frosted glass card present:', html.includes('frostedGlassCard'));
  console.log('   - "Book your stay":', html.includes('Book your stay'));
  console.log('   - Glass card action button:', html.includes('glassActionBtn'));

  console.log('\n4. Heading Block (Row 2, Left Side):');
  console.log('   - Heading present:', html.includes('A simple, comfortable base for families and groups.'));
  console.log('   - Inline View Rooms button:', html.includes('inlineButton') && html.includes('View Rooms'));
  console.log('   - Avatar photo circles:', html.includes('avatarCircle'));

  console.log('\n5. Full-width Pills Row:');
  console.log('   - Pills row present:', html.includes('pillsRow'));
  console.log('   - "Villa rooms" pill:', html.includes('Villa rooms'));
  console.log('   - "Clean pool" pill:', html.includes('Clean pool'));
  console.log('   - Address pill (with pin icon):', html.includes('Thambagoundanoor to Idappadi main Road, Koneripatti'));
}

testStay().catch(console.error);
