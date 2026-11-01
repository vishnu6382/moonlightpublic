import fs from 'fs';
import path from 'path';

const FORBIDDEN_PATTERNS = [
  { name: 'DEMO badge [DEMO]', regex: /\[DEMO\]/g },
  { name: 'DEMO label', regex: /\bDEMO\b/g, ignoreComments: true },
  { name: 'Temp photo path /photos/temp', regex: /\/photos\/temp/g },
  { name: 'demo.js reference', regex: /demo\.js/g },
  { name: 'SHOW_DEMO flag', regex: /\bSHOW_DEMO\b/g },
];

const SCAN_DIRS = ['app', 'components', 'lib', 'content'];
const ALLOWED_EXTS = ['.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css'];

let violations = [];

function scanFile(filePath) {
  // Ignore self or check scripts or git/backups
  if (filePath.includes('check-no-demo') || filePath.includes('reset-content') || filePath.includes('.git') || filePath.includes('node_modules')) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Ignore lines that are comments explaining the absence of demo
    if (line.includes('//') && line.includes('zero demo') || line.includes('no SHOW_DEMO') || line.includes('scripts/check-no-demo.mjs')) {
      return;
    }

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.regex.test(line)) {
        violations.push({
          file: filePath,
          line: index + 1,
          pattern: pattern.name,
          snippet: line.trim(),
        });
      }
    }
  });
}

function walkDir(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        walkDir(fullPath);
      }
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (ALLOWED_EXTS.includes(ext)) {
        scanFile(fullPath);
      }
    }
  }
}

console.log('🔍 Checking source files for demo data & fallback paths...');
SCAN_DIRS.forEach((d) => walkDir(path.resolve(process.cwd(), d)));

// Also scan .next build output if present
const nextOutputDir = path.resolve(process.cwd(), '.next/server');
if (fs.existsSync(nextOutputDir)) {
  console.log('🔍 Checking .next build output for leftover demo text...');
  walkDir(nextOutputDir);
}

if (violations.length > 0) {
  console.error('\n❌ BUILD FAILED: Found leftover demo artifacts or fallback photo paths:');
  violations.forEach((v) => {
    console.error(`  - ${v.file}:${v.line} [${v.pattern}] -> ${v.snippet}`);
  });
  process.exit(1);
} else {
  console.log('✅ ZERO DEMO CHECK PASSED: Clean production codebase. No demo data, no temp photos, no fallback artifacts.');
  process.exit(0);
}

