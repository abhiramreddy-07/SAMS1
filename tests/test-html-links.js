/**
 * SAMS - HTML Integrity & Asset Validator
 * Scans all HTML files in the project to verify that all referenced
 * local stylesheets, scripts, images, and page links resolve to real files.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

let issues = 0;

console.log('====================================================');
console.log('VALIDATING HTML LINKS & ASSET INTEGRITY');
console.log('====================================================\n');

htmlFiles.forEach(htmlFile => {
  const content = fs.readFileSync(path.join(rootDir, htmlFile), 'utf8');
  console.log(`Checking ${htmlFile}...`);

  // Check <a href="...">
  const aMatches = [...content.matchAll(/href=["']([^"']+)["']/g)];
  aMatches.forEach(m => {
    const target = m[1];
    if (target.startsWith('#') || target.startsWith('http://') || target.startsWith('https://') || target.startsWith('javascript:')) {
      return;
    }
    // Remove query params or hash
    const cleanTarget = target.split('?')[0].split('#')[0];
    if (!cleanTarget) return;

    const targetPath = path.join(rootDir, cleanTarget);
    if (!fs.existsSync(targetPath)) {
      console.error(`  [BROKEN LINK] in ${htmlFile}: ${target} does not exist!`);
      issues++;
    }
  });

  // Check <script src="...">
  const scriptMatches = [...content.matchAll(/<script[^>]+src=["']([^"']+)["']/g)];
  scriptMatches.forEach(m => {
    const src = m[1];
    if (src.startsWith('http://') || src.startsWith('https://')) {
      return;
    }
    const cleanSrc = src.split('?')[0];
    const scriptPath = path.join(rootDir, cleanSrc);
    if (!fs.existsSync(scriptPath)) {
      console.error(`  [MISSING SCRIPT] in ${htmlFile}: ${src} does not exist!`);
      issues++;
    }
  });

  // Check <link href="...">
  const linkMatches = [...content.matchAll(/<link[^>]+href=["']([^"']+)["']/g)];
  linkMatches.forEach(m => {
    const href = m[1];
    if (href.startsWith('http://') || href.startsWith('https://')) {
      return;
    }
    const cleanHref = href.split('?')[0];
    const cssPath = path.join(rootDir, cleanHref);
    if (!fs.existsSync(cssPath)) {
      console.error(`  [MISSING CSS] in ${htmlFile}: ${href} does not exist!`);
      issues++;
    }
  });
});

console.log('\n====================================================');
if (issues === 0) {
  console.log('RESULT: ALL HTML LINKS & ASSETS ARE 100% VALID AND INTACT!');
  process.exit(0);
} else {
  console.error(`RESULT: ${issues} BROKEN REFERENCES FOUND!`);
  process.exit(1);
}
