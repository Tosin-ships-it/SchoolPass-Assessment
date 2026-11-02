import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import os from 'node:os';

const require = createRequire(import.meta.url);
const { hash: argon2Hash, verify: argon2Verify } = require('C:/Users/gbola/Desktop/SchoolPass/node_modules/@node-rs/argon2');

// Production SchoolPass Argon2id parameters from src/lib/auth/crypto.ts
const ARGON2_CONFIG = {
  memoryCost: 65536, // 64 MiB
  timeCost: 3,       // 3 iterations
  parallelism: 1,    // 1 thread
  outputLen: 32,     // 32-byte derived key
};

const TEST_PASSWORD = 'Correct-Horse-Battery-Staple-2026!';

function getSystemInfo() {
  const cpus = os.cpus();
  return {
    osType: os.type(),
    osPlatform: os.platform(),
    osRelease: os.release(),
    arch: os.arch(),
    cpuModel: cpus[0]?.model || 'Unknown CPU',
    cpuCores: cpus.length,
    cpuSpeedMHz: cpus[0]?.speed || 'Unknown',
    totalMemoryGB: (os.totalmem() / (1024 ** 3)).toFixed(2),
    freeMemoryGB: (os.freemem() / (1024 ** 3)).toFixed(2),
    nodeVersion: process.version,
  };
}

function calculateStats(timingsMs) {
  const sorted = [...timingsMs].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const mean = sum / sorted.length;
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  
  let median;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    median = (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    median = sorted[mid];
  }

  const variance = sorted.reduce((acc, val) => acc + (val - mean) ** 2, 0) / sorted.length;
  const stdDev = Math.sqrt(variance);

  return { sorted, sum, mean, median, min, max, stdDev };
}

async function runBenchmark() {
  const sysInfo = getSystemInfo();
  console.log('Gathering system information...');
  console.log(JSON.stringify(sysInfo, null, 2));

  // 1. Same-password, different-hash demonstration
  console.log('\n--- Demonstration: Same Password, Different Hashes ---');
  const hash1 = await argon2Hash(TEST_PASSWORD, ARGON2_CONFIG);
  const hash2 = await argon2Hash(TEST_PASSWORD, ARGON2_CONFIG);

  const isIdentical = (hash1 === hash2);
  const verify1 = await argon2Verify(hash1, TEST_PASSWORD);
  const verify2 = await argon2Verify(hash2, TEST_PASSWORD);

  // Extract PHC segments
  // Format: $argon2id$v=19$m=65536,t=3,p=1$<salt>$<hash>
  const parts1 = hash1.split('$');
  const parts2 = hash2.split('$');

  const salt1 = parts1[4] || 'unknown';
  const salt2 = parts2[4] || 'unknown';

  const rawHash1 = parts1[5] || 'unknown';
  const rawHash2 = parts2[5] || 'unknown';

  console.log(`Password: "${TEST_PASSWORD}"`);
  console.log(`Hash 1: ${hash1}`);
  console.log(`Hash 2: ${hash2}`);
  console.log(`Hashes identical? ${isIdentical}`);
  console.log(`Salt 1: ${salt1}`);
  console.log(`Salt 2: ${salt2}`);
  console.log(`Verify Hash 1: ${verify1}`);
  console.log(`Verify Hash 2: ${verify2}`);

  // 2. Argon2id Timing Benchmark
  console.log('\n--- Argon2id Timing Benchmark ---');
  const ARGON_WARMUP = 5;
  const ARGON_ITERATIONS = 20;

  console.log(`Warming up Argon2id (${ARGON_WARMUP} runs)...`);
  for (let i = 0; i < ARGON_WARMUP; i++) {
    await argon2Hash(TEST_PASSWORD, ARGON2_CONFIG);
  }

  console.log(`Executing ${ARGON_ITERATIONS} measured Argon2id runs...`);
  const argonTimings = [];
  for (let i = 0; i < ARGON_ITERATIONS; i++) {
    const start = process.hrtime.bigint();
    await argon2Hash(TEST_PASSWORD, ARGON2_CONFIG);
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    argonTimings.push(durationMs);
  }

  const argonStats = calculateStats(argonTimings);
  console.log(`Argon2id Mean: ${argonStats.mean.toFixed(3)} ms`);
  console.log(`Argon2id Median: ${argonStats.median.toFixed(3)} ms`);
  console.log(`Argon2id Min: ${argonStats.min.toFixed(3)} ms`);
  console.log(`Argon2id Max: ${argonStats.max.toFixed(3)} ms`);
  console.log(`Argon2id StdDev: ${argonStats.stdDev.toFixed(3)} ms`);

  // 3. SHA-256 Timing Benchmark (Fast hashing comparison only)
  console.log('\n--- SHA-256 Timing Benchmark (Comparison Only) ---');
  const SHA_WARMUP = 100;
  const SHA_ITERATIONS = 10000;

  console.log(`Warming up SHA-256 (${SHA_WARMUP} runs)...`);
  for (let i = 0; i < SHA_WARMUP; i++) {
    createHash('sha256').update(TEST_PASSWORD).digest('hex');
  }

  console.log(`Executing ${SHA_ITERATIONS} measured SHA-256 runs...`);
  const shaTimings = [];
  for (let i = 0; i < SHA_ITERATIONS; i++) {
    const start = process.hrtime.bigint();
    createHash('sha256').update(TEST_PASSWORD).digest('hex');
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;
    shaTimings.push(durationMs);
  }

  const shaStats = calculateStats(shaTimings);
  console.log(`SHA-256 Mean: ${(shaStats.mean * 1000).toFixed(3)} us (${shaStats.mean.toFixed(6)} ms)`);
  console.log(`SHA-256 Median: ${(shaStats.median * 1000).toFixed(3)} us (${shaStats.median.toFixed(6)} ms)`);
  console.log(`SHA-256 Min: ${(shaStats.min * 1000).toFixed(3)} us`);
  console.log(`SHA-256 Max: ${(shaStats.max * 1000).toFixed(3)} us`);

  // 4. Mathematical Calculations
  const argonGuessesPerSec = 1000 / argonStats.median;
  const shaGuessesPerSec = 1000 / shaStats.median;
  const speedupFactor = shaStats.median > 0 ? (argonStats.median / shaStats.median) : 0;

  return {
    sysInfo,
    demonstration: {
      password: TEST_PASSWORD,
      hash1,
      hash2,
      isIdentical,
      salt1,
      salt2,
      rawHash1,
      rawHash2,
      verify1,
      verify2,
    },
    argonStats,
    argonTimings,
    shaStats,
    argonGuessesPerSec,
    shaGuessesPerSec,
    speedupFactor,
  };
}

runBenchmark().then(results => {
  console.log('\nBenchmark complete.');
  console.log(`Single-core Argon2id guesses/sec: ${results.argonGuessesPerSec.toFixed(2)}`);
  console.log(`Single-core SHA-256 guesses/sec: ${results.shaGuessesPerSec.toFixed(2)}`);
  console.log(`Speedup factor (SHA-256 vs Argon2id): ${results.speedupFactor.toFixed(0)}x`);
  // Output full JSON payload for programmatic capture
  console.log('__JSON_START__');
  console.log(JSON.stringify(results));
  console.log('__JSON_END__');
}).catch(err => {
  console.error('Benchmark failed:', err);
  process.exit(1);
});
