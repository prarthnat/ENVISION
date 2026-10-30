const { spawn } = require('node:child_process');

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const commands = [
  ['backend', ['run', 'dev:server']],
  ['frontend', ['run', 'dev:client']],
];

let stopping = false;
const children = commands.map(([name, args]) => {
  console.log(`Starting ${name}...`);
  const child = spawn(npm, args, {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  child.once('error', (error) => {
    console.error(`Could not start ${name}:`, error.message);
    stop('SIGTERM');
    process.exitCode = 1;
  });

  child.once('exit', (code) => {
    if (!stopping) {
      console.error(`${name} stopped${code ? ` with exit code ${code}` : ''}. Stopping the other dev process.`);
      process.exitCode = code || 1;
      stop('SIGTERM');
    }
  });

  return child;
});

function stop(signal) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (!child.killed) child.kill(signal);
  }
}

process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));
