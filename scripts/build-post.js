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

  const srcWorker = path.join(serverDir, workerFile);
  const destWorker = path.join(clientDir, '_worker.js');
  
  console.log(`Copying ${srcWorker} to ${destWorker}...`);
  fs.copyFileSync(srcWorker, destWorker);

  // 2. Copy server assets to client assets directory
  const serverAssetsDir = path.join(serverDir, 'assets');
  const clientAssetsDir = path.join(clientDir, 'assets');

  if (fs.existsSync(serverAssetsDir)) {
    console.log('Copying server assets to client assets directory...');
    const assetFiles = fs.readdirSync(serverAssetsDir);
    for (const file of assetFiles) {
      const srcAsset = path.join(serverAssetsDir, file);
      const destAsset = path.join(clientAssetsDir, file);
      fs.copyFileSync(srcAsset, destAsset);
    }
  }

  // 3. Create dummy index.html
  const indexHtml = path.join(clientDir, 'index.html');
  if (!fs.existsSync(indexHtml)) {
    console.log('Creating dummy index.html...');
    fs.writeFileSync(indexHtml, '<!DOCTYPE html><html><body>TanStack Start Worker handles this.</body></html>');
  }

  // 4. Delete auto-generated wrangler.json in client dir to avoid Cloudflare Pages validation errors
  const clientWranglerJson = path.join(clientDir, 'wrangler.json');
  if (fs.existsSync(clientWranglerJson)) {
    console.log('Deleting auto-generated wrangler.json from client directory...');
    fs.unlinkSync(clientWranglerJson);
  }

  console.log('Post-build script completed successfully.');
} catch (err) {
  console.error('Error in post-build script:', err);
  process.exit(1);
}
