const fs = require('fs');
const path = require('path');
const rootDir = path.resolve(__dirname, '..');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') results = results.concat(walk(full));
    } else if (file.endsWith('.html')) results.push(full);
  });
  return results;
}

const htmlFiles = walk(rootDir);
console.log(`Checking ${htmlFiles.length} HTML files for potential mobile overflow issues...`);

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relFile = path.relative(rootDir, file);

  const inlineRegex = /style=["']([^"']*(?:min-width|width|grid-template-columns)[^"']*)["']/gi;
  let match;
  let matches = [];
  while ((match = inlineRegex.exec(content)) !== null) {
    const str = match[1];
    const pxMatch = /(?:min-width|(?<!max-)width):\s*([0-9]+)px/gi.exec(str);
    if (pxMatch && parseInt(pxMatch[1], 10) > 340) {
      // Check if max-width is also set (e.g. width: 100%; max-width: 500px is safe!)
      const hasSafeMaxWidth = /max-width:\s*(?:[0-9]+(?:px|%|vw)|100%|none)/i.test(str);
      const isPureFixed = !str.includes('max-width') && !str.includes('width: 100%') && !str.includes('width:100%');
      if (isPureFixed) {
        matches.push({ width: parseInt(pxMatch[1], 10), style: str.trim() });
      }
    }
  }
  if (matches.length > 0) {
    console.log(`\n[${relFile}] found fixed width elements without max-width:`);
    matches.forEach(m => console.log(`   ${m.width}px: ${m.style}`));
  }
});
