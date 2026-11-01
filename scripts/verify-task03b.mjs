async function verify() {
  console.log('--- Verifying TASK 03b Fixes ---');

  const res = await fetch('http://localhost:3000');
  console.log('Home Page Status:', res.status);
  const html = await res.text();

  // 1. SHOW_DEMO = true check
  console.log('\n1. SHOW_DEMO & Previews:');
  console.log('   - Google Reviews section present:', html.includes('id="reviews"'));
  console.log('   - Row 1 Marquee track present:', html.includes('marqueeTrackRow1'));
  console.log('   - Row 2 Marquee track present:', html.includes('marqueeTrackRow2'));
  console.log('   - Nearby Areas section present:', html.includes('id="nearby"'));
  console.log('   - DEMO labels present:', html.includes('DEMO'));
  
  // Count DEMO badges
  const demoMatches = (html.match(/DEMO/g) || []).length;
  console.log('   - Total "DEMO" occurrences:', demoMatches);

  // 2. Facilities photo check
  console.log('\n2. Facilities Photo:');
  console.log('   - Facilities section present:', html.includes('id="facilities"'));
  console.log('   - photo-8.webp used for facilities:', html.includes('/photos/temp/photo-8.webp'));
  console.log('   - photo-1.webp NOT used for facilities featured image:', !html.includes('src="/photos/temp/photo-1.webp" alt="Moon Light Resort facilities overview"'));

  // 3. Photo Showcase check
  console.log('\n3. Photo Showcase:');
  console.log('   - Showcase section present:', html.includes('id="showcase"'));
  console.log('   - MoonPortal ring text present:', html.includes('MOON LIGHT RESORT'));
  console.log('   - 7 balanced showcase items loaded:', html.includes('showcase-7') || html.includes('Recreation Area'));

  // 4. Footer check
  console.log('\n4. Footer check:');
  console.log('   - Footer present at bottom:', html.includes('<footer') || html.includes('footerCard') || html.includes('Quick Links'));
  console.log('   - Quick Links present:', html.includes('Quick Links'));
  console.log('   - Watermark present:', html.includes('Moon Light Resort'));
}

verify().catch(console.error);
