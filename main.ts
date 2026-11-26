// Caldera Wind — make.fun entry packaging script (Node 22, standard library only).
// Copies the offline static WebGL flight game in game/ and the 4 browser renders in screenshots/
// into /output (or MAKEFUN_OUTPUT_DIR) and emits the canonical makefun/dossier/v1 manifest.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const ROOT_DIR = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

mkdirSync(OUTPUT_DIR, { recursive: true });
cpSync(join(ROOT_DIR, 'game'), join(OUTPUT_DIR, 'game'), { recursive: true });
mkdirSync(join(OUTPUT_DIR, 'screenshots'), { recursive: true });

if (existsSync(join(ROOT_DIR, 'screenshots'))) {
  cpSync(join(ROOT_DIR, 'screenshots'), join(OUTPUT_DIR, 'screenshots'), { recursive: true });
}

const dossierBytes = buildDossier(OUTPUT_DIR, DOSSIER_LIMITS);
writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossierBytes);
