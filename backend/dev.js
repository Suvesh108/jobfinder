const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[1;36m%s\x1b[0m', '══════════════════════════════════════════════════════════════');
console.log('\x1b[1;36m%s\x1b[0m', '  🚀 Starting JobFinder Unified Backend Services');
console.log('\x1b[1;36m%s\x1b[0m', '══════════════════════════════════════════════════════════════');
console.log('  [1;33m[1] JobSpy Portal Scraper (Naukri/Indeed/LinkedIn/Glassdoor)[0m -> http://localhost:8000');
console.log('  [1;32m[2] ATS & Generic Career Crawler (Greenhouse/Lever/Ashby)[0m     -> http://localhost:8002');
console.log('\x1b[1;36m%s\x1b[0m', '──────────────────────────────────────────────────────────────');

const services = [
  {
    name: 'JobSpy:8000',
    color: '\x1b[33m', // Yellow
    cwd: path.join(__dirname, 'scraper-service-py'),
    cmd: 'python',
    args: ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8000', '--reload']
  },
  {
    name: 'ATS-Crawler:8002',
    color: '\x1b[32m', // Green
    cwd: path.join(__dirname, 'ats-crawler-service'),
    cmd: 'python',
    args: ['-m', 'uvicorn', 'main:app', '--host', '0.0.0.0', '--port', '8002', '--reload']
  }
];

const runningProcesses = [];

services.forEach(srv => {
  const child = spawn(srv.cmd, srv.args, {
    cwd: srv.cwd,
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  runningProcesses.push(child);

  child.stdout.on('data', data => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${srv.color}[${srv.name}]\x1b[0m ${line}`);
      }
    });
  });

  child.stderr.on('data', data => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${srv.color}[${srv.name}]\x1b[0m ${line}`);
      }
    });
  });

  child.on('close', code => {
    console.log(`${srv.color}[${srv.name}]\x1b[0m Exited with code ${code}`);
  });
});

// Clean shutdown on Ctrl+C
const shutdown = () => {
  console.log('\n\x1b[1;31mShutting down all backend services...\x1b[0m');
  runningProcesses.forEach(proc => {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', proc.pid, '/f', '/t']);
      } else {
        proc.kill('SIGTERM');
      }
    } catch (e) {}
  });
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
