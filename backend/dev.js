const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[1;36m%s\x1b[0m', '══════════════════════════════════════════════════════════════');
console.log('\x1b[1;36m%s\x1b[0m', '  🚀 Starting JobFinder JobSpy Backend Service (Port 8000)');
console.log('\x1b[1;36m%s\x1b[0m', '══════════════════════════════════════════════════════════════');
console.log('  [1;33m[JobSpy:8000] Multi-Portal Scraper (Naukri/Indeed/LinkedIn/Glassdoor)[0m -> http://localhost:8000');
console.log('\x1b[1;36m%s\x1b[0m', '──────────────────────────────────────────────────────────────');

const child = spawn('python', ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000', '--reload'], {
  cwd: path.join(__dirname, 'scraper-service-py'),
  shell: true,
  stdio: 'inherit'
});

child.on('close', code => {
  console.log(`[JobSpy] Exited with code ${code}`);
});

process.on('SIGINT', () => {
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', child.pid, '/f', '/t']);
  } else {
    child.kill('SIGTERM');
  }
  process.exit(0);
});
