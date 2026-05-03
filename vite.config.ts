import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin, type ViteDevServer } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const IMAGE_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".svg",
  ".gif",
  ".avif",
]);

function listPhotoUrls(photosDir: string): string[] {
  if (!fs.existsSync(photosDir)) return [];
  const names = fs.readdirSync(photosDir, { withFileTypes: false }) as string[];
  return names
    .filter((f) => {
      if (f === ".gitkeep" || f.startsWith(".")) return false;
      const ext = path.extname(f).toLowerCase();
      return IMAGE_EXT.has(ext);
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
    .map((f) => `/photos/${f.replace(/\\/g, "/")}`);
}

function writePhotoManifest(root: string): void {
  const photosDir = path.join(root, "public", "photos");
  const manifestPath = path.join(root, "public", "photo-manifest.json");
  fs.mkdirSync(photosDir, { recursive: true });
  const photos = listPhotoUrls(photosDir);
  fs.writeFileSync(manifestPath, JSON.stringify({ photos }, null, 0), "utf8");
}

function photosManifestPlugin(): Plugin {
  const root = path.resolve(__dirname);
  const photosDir = path.join(root, "public", "photos");
  let serverRef: ViteDevServer | undefined;
  let debounce: ReturnType<typeof setTimeout> | undefined;

  const regen = () => {
    writePhotoManifest(root);
    serverRef?.ws.send({ type: "full-reload", path: "*" });
  };

  return {
    name: "photos-manifest",
    buildStart() {
      writePhotoManifest(root);
    },
    configureServer(server) {
      serverRef = server;
      writePhotoManifest(root);
      try {
        fs.watch(photosDir, { persistent: true }, () => {
          clearTimeout(debounce);
          debounce = setTimeout(regen, 150);
        });
      } catch {
        /* ignore */
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), photosManifestPlugin()],
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
