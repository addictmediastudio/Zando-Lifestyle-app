import fs from "node:fs";
import path from "node:path";

const serverDir = "dist/server";
const clientDir = "dist/client";

console.log("Running post-build script...");

try {
  // 1. Copy server entry as _worker.js in client dir
  const serverFiles = fs.readdirSync(serverDir);
  const workerFile = serverFiles.find((f) => f.endsWith(".js") && !f.includes("assets"));
  
  if (!workerFile) {
    console.error("Could not find server entry file in", serverDir);
    process.exit(1);
  }

  const srcWorker = path.join(serverDir, workerFile);
  const destWorker = path.join(clientDir, "_worker.js");
  
  console.log(`Copying ${srcWorker} to ${destWorker}...`);
  fs.copyFileSync(srcWorker, destWorker);

  // 2. Copy all server assets into client assets directory
  const serverAssetsDir = path.join(serverDir, "assets");
  const clientAssetsDir = path.join(clientDir, "assets");

  if (fs.existsSync(serverAssetsDir)) {
    if (!fs.existsSync(clientAssetsDir)) {
      fs.mkdirSync(clientAssetsDir, { recursive: true });
    }
    console.log("Merging server assets into client assets...");
    const assetFiles = fs.readdirSync(serverAssetsDir);
    for (const file of assetFiles) {
      fs.copyFileSync(path.join(serverAssetsDir, file), path.join(clientAssetsDir, file));
    }
    console.log(`Merged ${assetFiles.length} server asset files.`);
  }

  // (wrangler.json deletion removed to prevent Cloudflare Pages deployment error)
  const routesJsonPath = path.join(clientDir, "_routes.json");
  console.log("Creating _routes.json...");
  fs.writeFileSync(
    routesJsonPath,
    JSON.stringify(
      {
        version: 1,
        include: ["/*"],
        exclude: ["/assets/*", "/favicon.png"],
      },
      null,
      2,
    ),
  );

  // 5. Delete auto-generated wrangler.json and .wrangler directory to prevent configuration conflicts.
  // This forces Cloudflare Pages to use the root wrangler.toml and avoids "No such module node:async_hooks" errors.
  const clientWranglerJson = path.join(clientDir, "wrangler.json");
  if (fs.existsSync(clientWranglerJson)) {
    console.log("Deleting wrangler.json to avoid conflicts...");
    fs.unlinkSync(clientWranglerJson);
  }

  const dotWranglerDir = ".wrangler";
  if (fs.existsSync(dotWranglerDir)) {
    console.log("Deleting .wrangler directory...");
    fs.rmSync(dotWranglerDir, { recursive: true, force: true });
  }

  // 6. Create a minimal index.html to ensure Cloudflare Pages knows it's a site
  const indexHtmlPath = path.join(clientDir, "index.html");
  if (!fs.existsSync(indexHtmlPath)) {
    console.log("Creating minimal index.html...");
    fs.writeFileSync(
      indexHtmlPath,
      '<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><div id="root"></div></body></html>',
    );
  }

  // 7. Delete .assetsignore (no longer needed)
  const assetsIgnore = path.join(clientDir, ".assetsignore");
  if (fs.existsSync(assetsIgnore)) {
    fs.unlinkSync(assetsIgnore);
  }

  console.log("Post-build script completed successfully.");
  console.log("Output structure:");
  console.log("  dist/client/           <- static assets + _worker.js");
  console.log("  dist/client/assets/    <- combined client/server assets");
} catch (err) {
  console.error("Error in post-build script:", err);
  process.exit(1);
}
