import fs from 'node:fs';
import path from 'node:path';

const serverDir = 'dist/server';
const clientDir = 'dist/client';

console.log('Running post-build script...');

try {
  // Find the server entry file
  const files = fs.readdirSync(serverDir);
  const workerFile = files.find(f => f.endsWith('.js') && !f.includes('assets'));
  
  if (!workerFile) {
    console.error('Could not find server entry file in', serverDir);
    process.exit(1);
  }

  const src = path.join(serverDir, workerFile);
  const dest = path.join(clientDir, '_worker.js');
  
  console.log(`Copying ${src} to ${dest}...`);
  fs.copyFileSync(src, dest);
  
  // Also create a dummy index.html if it doesn't exist, 
  // sometimes Cloudflare Pages needs it to avoid 404s on certain configurations
  const indexHtml = path.join(clientDir, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    console.log('Creating dummy index.html...');
    fs.writeFileSync(indexHtml, '<!DOCTYPE html><html><body>TanStack Start Worker handles this.</body></html>');
  }

  console.log('Post-build script completed successfully.');
} catch (err) {
  console.error('Error in post-build script:', err);
  process.exit(1);
}
