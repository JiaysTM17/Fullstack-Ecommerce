import fs from 'fs';
import path from 'path';

const srcDir = 'client/src';
let issues = [];

function scanDir(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) scanDir(full);
    else if (full.endsWith('.jsx')) {
      checkFile(full);
    }
  }
}

function checkFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf-8');
  
  // Extract all imported identifiers
  const importLines = [...code.matchAll(/import\s+(?:(?:\*\s+as\s+(\w+))|(?:(\w+))|(?:\s*\{([^}]+)\}))\s+from\s+['"][^'"]+['"]/g)];
  const imported = new Set();
  
  for (const m of importLines) {
    if (m[1]) imported.add(m[1].trim()); // import * as X
    if (m[2]) imported.add(m[2].trim()); // import X
    if (m[3]) {
      // import { A, B as C }
      m[3].split(',').forEach(item => {
        const parts = item.trim().split(/\s+as\s+/);
        const name = (parts[1] || parts[0]).trim();
        if (name) imported.add(name);
      });
    }
  }

  // Find all JSX tags <TagName ...
  const jsxTagMatches = [...code.matchAll(/<([A-Z][a-zA-Z0-9]+)/g)].map(m => m[1]);
  const uniqueTags = new Set(jsxTagMatches);

  for (const tag of uniqueTags) {
    if (['Fragment', 'Suspense', 'StrictMode', 'Provider'].includes(tag)) continue;
    
    // Check if imported
    if (imported.has(tag)) continue;

    // Check if declared in file (const Tag = ..., function Tag ..., class Tag ...)
    const isDeclaredLocally = new RegExp(`\\b(const|let|var|function|class)\\s+${tag}\\b`).test(code);
    if (isDeclaredLocally) continue;

    issues.push({ file: filePath, identifier: tag });
  }
}

scanDir(srcDir);
console.log('Total missing JSX imports:', issues.length);
if (issues.length > 0) {
  console.log(JSON.stringify(issues, null, 2));
  process.exit(1);
} else {
  console.log('EXCELLENT! 100% of JSX components and icons are properly imported or locally declared across all files!');
  process.exit(0);
}
