import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const url = process.argv[2] || 'http://localhost:5555';
const outputPath = process.argv[3] || 'screenshot.png';
const waitMs = parseInt(process.argv[4] || '6000', 10);

console.log(`[CDP Capture] Opening ${url}...`);
console.log(`[CDP Capture] Target: ${outputPath}`);
console.log(`[CDP Capture] Settle delay: ${waitMs}ms`);

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const fs = await import('node:fs');
const browserExe = fs.existsSync(edgePath) ? edgePath : chromePath;

const port = 9222 + Math.floor(Math.random() * 500);
const userDataDir = `${process.env.TEMP}\\cdp_${Date.now()}`;

const browserProc = spawn(browserExe, [
  '--headless=new',
  '--disable-gpu',
  '--no-sandbox',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${userDataDir}`,
  '--window-size=1440,900',
  'about:blank'
], { stdio: 'ignore' });

// Wait for CDP to be ready
let versionData = null;
for (let i = 0; i < 20; i++) {
  await new Promise(r => setTimeout(r, 250));
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`);
    if (res.ok) {
      versionData = await res.json();
      break;
    }
  } catch (e) {}
}

if (!versionData) {
  browserProc.kill();
  console.error('[CDP Capture] Failed to connect to browser CDP port');
  process.exit(1);
}

// Create new target tab
const newTabRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
const tabData = await newTabRes.json();
const wsUrl = tabData.webSocketDebuggerUrl;

const ws = new WebSocket(wsUrl);

await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let idCounter = 1;
function sendCommand(method, params = {}) {
  return new Promise((resolve) => {
    const id = idCounter++;
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

await sendCommand('Page.enable');
await sendCommand('Runtime.enable');

console.log(`[CDP Capture] Waiting ${waitMs}ms for React hydration and network data...`);
await new Promise(r => setTimeout(r, waitMs));

const evalCode = process.argv[5];
if (evalCode) {
  console.log(`[CDP Capture] Executing evaluation script...`);
  await sendCommand('Runtime.evaluate', { expression: `(async () => { ${evalCode} })()`, awaitPromise: true });
  await new Promise(r => setTimeout(r, 3000));
}

console.log('[CDP Capture] Capturing full screenshot...');
const shotResult = await sendCommand('Page.captureScreenshot', { format: 'png', quality: 100 });

if (shotResult && shotResult.data) {
  const buffer = Buffer.from(shotResult.data, 'base64');
  writeFileSync(outputPath, buffer);
  console.log(`[CDP Capture] Successfully saved ${buffer.length} bytes to ${outputPath}`);
} else {
  console.error('[CDP Capture] Screenshot failed, no data returned');
}

ws.close();
browserProc.kill();
process.exit(0);
