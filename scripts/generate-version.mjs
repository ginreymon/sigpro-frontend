// Genera el identificador de versión del build (hash corto de git + fecha UTC):
//  - src/environments/build-info.ts  -> versión incrustada en el bundle
//  - public/version.json             -> versión publicada junto al index.html
// UpdateService compara ambas para avisar cuando hay un despliegue nuevo.
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

let commit = 'nogit';
try {
  commit = execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
} catch {
  // Sin git (p. ej. build desde un zip): la fecha basta para distinguir builds.
}

const stamp = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const version = `${commit}-${stamp}`;

writeFileSync('src/environments/build-info.ts', `export const BUILD_VERSION = '${version}';\n`);
writeFileSync('public/version.json', `${JSON.stringify({ version })}\n`);
console.log(`Versión del build: ${version}`);
