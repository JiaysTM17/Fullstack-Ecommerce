// Script to extract FALLBACK_PRODUCTS from productService.js and save as JSON
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { createContext } from 'vm';
import vm from 'vm';

const content = readFileSync('d:/Personal-portfolio/Website-Thuong-Mai-Dien-Tu-Mini-Plan/client/src/services/productService.js', 'utf8');

const startMarker = 'export const FALLBACK_PRODUCTS = [';
const startIdx = content.indexOf(startMarker);
if (startIdx === -1) { console.error('FALLBACK_PRODUCTS not found'); process.exit(1); }

let bracketCount = 0;
let inString = false;
let stringChar = '';
let endIdx = startIdx + startMarker.length - 1;

for (let i = endIdx; i < content.length; i++) {
  const ch = content[i];
  if (inString) {
    if (ch === '\\') { i++; continue; }
    if (ch === stringChar) inString = false;
    continue;
  }
  if (ch === '"' || ch === "'" || ch === '`') { inString = true; stringChar = ch; continue; }
  if (ch === '[') bracketCount++;
  if (ch === ']') { bracketCount--; if (bracketCount === 0) { endIdx = i; break; } }
}

const arrayStr = content.substring(startIdx + startMarker.length - 1, endIdx + 1);
const sandbox = {};
vm.runInNewContext(`result = ${arrayStr}`, sandbox);

console.log(`Extracted ${sandbox.result.length} products`);

mkdirSync('d:/Personal-portfolio/Website-Thuong-Mai-Dien-Tu-Mini-Plan/server/src/seed', { recursive: true });
writeFileSync('d:/Personal-portfolio/Website-Thuong-Mai-Dien-Tu-Mini-Plan/server/src/seed/allProducts.json', 
  JSON.stringify(sandbox.result, null, 2), 'utf8');

console.log('Saved to server/src/seed/allProducts.json');

const categories = {};
sandbox.result.forEach(p => { categories[p.category] = (categories[p.category] || 0) + 1; });
console.log('Categories:', JSON.stringify(categories, null, 2));

const shops = {};
sandbox.result.forEach(p => { const key = p.shopId; shops[key] = (shops[key] || 0) + 1; });
console.log('Shops:', JSON.stringify(shops, null, 2));
