const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[1;36m%s\x1b[0m', '══════════════════════════════════════════════════════════════');
console.log('\x1b[1;36m%s\x1b[0m', '  🚀 Starting JobScrap Multi-Portal Backend Service (Port 8000)');
console.log('\x1b[1;36m%s\x1b[0m', '══════════════════════════════════════════════════════════════');
console.log('  [1;33m[JobScrap:8000] Instahyre/Internshala/Shine/Freshersworld/Indeed/Naukri/LinkedIn[0m -> http://localhost:8000');
console.log('\x1b[1;36m%s\x1b[0m', '──────────────────────────────────────────────────────────────');

const child = spawn('python', ['-m', 'uvicorn', 'jobscrap.api:app', '--host', '0.0.0.0', '--port', '8000', '--reload'], {
  cwd: __dirname,
  shell: true,
  stdio: 'inherit'
});

child.on('close', code => {
  console.log(`[JobScrap] Exited with code ${code}`);
});

process.on('SIGINT', () => {
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', child.pid, '/f', '/t']);
  } else {
    child.kill('SIGTERM');
  }
  process.exit(0);
});
