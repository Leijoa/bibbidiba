import { execSync } from 'child_process';

console.log("Starting script with Node.js directly...");
try {
  execSync('node scripts/simulate.js', { stdio: 'inherit' });
} catch (e) {
  console.error("Simulation failed:", e);
}
