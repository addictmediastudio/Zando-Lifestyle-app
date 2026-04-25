import fs from 'node:fs';
import path from 'node:path';

const serverDir = 'dist/server';
const clientDir = 'dist/client';

console.log('Running post-build script...');

try {
  // 1. Create _worker.js DIRECTORY (Cloudflare Pages multi-file worker format)
  //    This avoids the esbuild re-bundling that breaks ./assets/ imports
  const workerDir = path.join(clientDir, '_worker.js');
  if (fs.existsSync(workerDir)) {
    fs.rmSync(workerDir, { recursive: true });
  }
  fs.mkdirSync(workerDir, { recursive: true });

  // 2. Copy server entry as index.js inside _worker.js/
  const serverFiles = fs.readdirSync(serverDir);
  const workerFile = serverFiles.find(f => f.endsWith('.js') && !f.includes('assets'));
  
  if (!workerFile) {
    console.error('Could not find server entry file in', serverDir);
    process.exit(1);
  }

  const srcWorker = path.join(serverDir, workerFile);
  const destWorker = path.join(workerDir, 'index.js');
  
  console.log(`Copying ${srcWorker} to ${destWorker}...`);
  fs.copyFileSync(srcWorker, destWorker);

  // 3. Copy server assets into _worker.js/assets/
  const serverAssetsDir = path.join(serverDir, 'assets');
  const workerAssetsDir = path.join(workerDir, 'assets');

  if (fs.existsSync(serverAssetsDir)) {
    fs.mkdirSync(workerAssetsDir, { recursive: true });
    console.log('Copying server assets to _worker.js/assets/...');
    const assetFiles = fs.readdirSync(serverAssetsDir);
    for (const file of assetFiles) {
      fs.copyFileSync(
        path.join(serverAssetsDir, file),
        path.join(workerAssetsDir, file)
      );
    }
    console.log(`Copied ${assetFiles.length} server asset files.`);
  }

  // 4. Delete auto-generated wrangler.json from client dir
  const clientWranglerJson = path.join(clientDir, 'wrangler.json');
  if (fs.existsSync(clientWranglerJson)) {
    console.log('Deleting auto-generated wrangler.json from client directory...');
    fs.unlinkSync(clientWranglerJson);
  }

  // 4.5. Create _routes.json for Cloudflare Pages advanced routing
  const routesJsonPath = path.join(clientDir, '_routes.json');
  console.log('Creating _routes.json...');
  fs.writeFileSync(routesJsonPath, JSON.stringify({
    version: 1,
    include: ["/*"],
    exclude: ["/assets/*", "/favicon.png"]
  }, null, 2));

  // 5. Delete .assetsignore (no longer needed)
  const assetsIgnore = path.join(clientDir, '.assetsignore');
  if (fs.existsSync(assetsIgnore)) {
    fs.unlinkSync(assetsIgnore);
  }

  console.log('Post-build script completed successfully.');
  console.log('Output structure:');
  console.log('  dist/client/           <- static assets served by Cloudflare CDN');
  console.log('  dist/client/_worker.js/ <- Pages Function (multi-file worker)');
} catch (err) {
  console.error('Error in post-build script:', err);
  process.exit(1);
}
