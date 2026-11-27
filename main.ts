// Gobble Break: The Great Thanksgiving Escape — submission packager (Node 22, stdlib only).
// Copies the offline static browser game under game/ and its screenshots under screenshots/
// to MAKEFUN_OUTPUT_DIR (default /output) and emits the canonical makefun/dossier/v1 JSON.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const REPO_ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
} as const;

function copyDirectoryClean(sourceDir: string, targetDir: string): void {
  rmSync(targetDir, { recursive: true, force: true });
  mkdirSync(targetDir, { recursive: true });
  if (existsSync(sourceDir)) {
    cpSync(sourceDir, targetDir, { recursive: true });
  }
}

function packageEntry(): void {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  copyDirectoryClean(join(REPO_ROOT, 'game'), join(OUTPUT_DIR, 'game'));
  copyDirectoryClean(join(REPO_ROOT, 'screenshots'), join(OUTPUT_DIR, 'screenshots'));

  const dossierBytes = buildDossier(OUTPUT_DIR, DOSSIER_CAPS);
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossierBytes);
}

packageEntry();
