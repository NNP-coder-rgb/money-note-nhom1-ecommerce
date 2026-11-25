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
      if (file !== 'node_modules' && file !== '.git') {
        results = results.concat(walk(full));
      }
    } else if (file.endsWith('.html')) {
      results.push(full);
    }
  });
  return results;
}

const htmlFiles = walk(rootDir);
console.log(`Auditing ${htmlFiles.length} HTML files...`);

const issues = [];

htmlFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const relFile = path.relative(rootDir, file);

  // 1. Viewport check
  if (!content.includes('name="viewport"')) {
    issues.push({ file: relFile, type: 'NO_VIEWPORT', target: 'Missing viewport meta' });
  }

  // 2. Zero-FOUC theme check
  if (!content.includes('hybrid_theme')) {
    issues.push({ file: relFile, type: 'NO_THEME_SCRIPT', target: 'Missing zero-FOUC theme script' });
  }

  // 3. Remove script tags to check only static HTML markup
  const noScripts = content.replace(/<script[\s\S]*?<\/script>/gi, '');

  // 4. Script checks from content
  const scriptRegex = /<script[^>]*src=["']([^"']+)["']/gi;
  let match;
  while ((match = scriptRegex.exec(content)) !== null) {
    const src = match[1];
    if (!src.startsWith('http') && !src.startsWith('//') && !src.startsWith('data:')) {
      const cleanSrc = src.split('?')[0].split('#')[0];
      const resolved = path.resolve(path.dirname(file), cleanSrc);
      if (!fs.existsSync(resolved)) {
        issues.push({ file: relFile, type: 'BROKEN_SCRIPT', target: src });
      }
    }
  }

  // 5. CSS checks
  const cssRegex = /<link[^>]*href=["']([^"']+\.css(\?[^"']*)?)["']/gi;
  while ((match = cssRegex.exec(content)) !== null) {
    const href = match[1];
    if (!href.startsWith('http') && !href.startsWith('//')) {
      const cleanHref = href.split('?')[0].split('#')[0];
      const resolved = path.resolve(path.dirname(file), cleanHref);
      if (!fs.existsSync(resolved)) {
        issues.push({ file: relFile, type: 'BROKEN_CSS', target: href });
      }
    }
  }

  // 6. Check for NaN / undefined strings in hardcoded HTML
  if (noScripts.includes('undefined₫') || noScripts.includes('null₫') || noScripts.includes('NaN₫')) {
    issues.push({ file: relFile, type: 'NAN_CURRENCY', target: 'NaN₫/undefined₫ found in HTML' });
  }

  // 7. Check static HTML links
  const aRegex = /<a[^>]*href=["']([^"']+)["']/gi;
  while ((match = aRegex.exec(noScripts)) !== null) {
    const href = match[1];
    if (
      !href.startsWith('http') &&
      !href.startsWith('//') &&
      !href.startsWith('#') &&
      !href.startsWith('javascript:') &&
      !href.startsWith('tel:') &&
      !href.startsWith('mailto:') &&
      !href.startsWith('data:') &&
      !href.includes('${')
    ) {
      const cleanHref = href.split('?')[0].split('#')[0];
      if (cleanHref) {
        const resolved = path.resolve(path.dirname(file), cleanHref);
        if (!fs.existsSync(resolved)) {
          issues.push({ file: relFile, type: 'BROKEN_LINK', target: href });
        }
      }
    }
  }

  // 8. Check static HTML images
  const imgRegex = /<img[^>]*src=["']([^"']+)["']/gi;
  while ((match = imgRegex.exec(noScripts)) !== null) {
    const src = match[1];
    if (
      !src.startsWith('http') &&
      !src.startsWith('//') &&
      !src.startsWith('data:') &&
      !src.includes('${') &&
      src.trim() !== ''
    ) {
      const cleanSrc = src.split('?')[0].split('#')[0];
      const resolved = path.resolve(path.dirname(file), cleanSrc);
      if (!fs.existsSync(resolved)) {
        issues.push({ file: relFile, type: 'BROKEN_IMG', target: src });
      }
    }
  }
});

console.log('--- ISSUES REPORT ---');
if (issues.length === 0) {
  console.log('CONGRATULATIONS: 0 issues found across all HTML files!');
} else {
  console.log(`Found ${issues.length} potential issues:`);
  issues.forEach(i => console.log(`[${i.type}] ${i.file} -> ${i.target}`));
}
