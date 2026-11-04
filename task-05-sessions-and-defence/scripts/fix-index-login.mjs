import fs from 'node:fs';

const filePath = 'C:/Users/gbola/Desktop/SchoolPass/src/lib/auth/index.ts';
let content = fs.readFileSync(filePath, 'utf-8');
const isCrlf = content.includes('\r\n');
const lines = content.split(/\r?\n/);

const startIdx = lines.findIndex(l => l.includes('// Account Deletion Safeguard: Check if account is locked'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('const parent = await findParentByEmail(email);'));

console.log('startIdx:', startIdx, 'endIdx:', endIdx);

if (startIdx !== -1 && endIdx !== -1) {
  // Find where the `if (!parent) { ... }` block ends
  let parentCheckEnd = -1;
  for (let i = endIdx; i < lines.length; i++) {
    if (lines[i].includes('return { success: false, error: \'Invalid email or password.\' };')) {
      // Find the closing brace `}`
      if (lines[i+1] && lines[i+1].trim() === '}') {
        parentCheckEnd = i + 1;
        break;
      }
    }
  }

  console.log('parentCheckEnd:', parentCheckEnd);

  if (parentCheckEnd !== -1) {
    // Extract the deletion safeguard lines
    const safeguardLines = lines.slice(startIdx, endIdx);
    // Remove safeguard lines from their current position
    lines.splice(startIdx, endIdx - startIdx);
    
    // Recalculate parentCheckEnd after removal
    const shift = endIdx - startIdx;
    const newInsertIdx = parentCheckEnd - shift + 1;

    // Insert safeguardLines right after parentCheckEnd
    lines.splice(newInsertIdx, 0, '', ...safeguardLines);

    const newContent = lines.join(isCrlf ? '\r\n' : '\n');
    fs.writeFileSync(filePath, newContent, 'utf-8');
    console.log('SUCCESS: Moved safeguard block after parent lookup and validation.');
  }
}
