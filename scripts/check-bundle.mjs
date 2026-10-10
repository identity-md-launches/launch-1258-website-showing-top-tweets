import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const limit = 8388608;
const excludedRoots = new Set(['.git', '.github', '.imd', '.agents', '.codex', '.aws', 'test']);
const forbidden = new Set(['node_modules', '.npm', '.pnpm-store', '.yarn', '.vite', '.cache', '.playwright-mcp', 'coverage', 'playwright-report', 'test-results']);
const files = [];
async function walk(directory = '.') {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (directory === '.' && (excludedRoots.has(entry.name) || entry.name.startsWith('.env'))) continue;
    if (forbidden.has(entry.name)) continue; // Explicitly ignored at every nesting level.
    const path = join(directory, entry.name);
    assert.ok(!entry.isSymbolicLink(), `Unexpected symlink: ${path}`);
    assert.ok(!entry.name.endsWith('.tgz'), `Unnecessary dependency archive: ${path}`);
    if (entry.isDirectory()) await walk(path);
    else files.push({ path, bytes: (await stat(path)).size });
  }
}
await walk();
for (const path of ['dist/index.html', 'src/App.tsx', 'package-lock.json', 'README.md', 'DESIGN.md']) assert.ok(files.some(file => file.path === path), `Missing deliverable: ${path}`);
assert.ok((await stat('.gitignore')).size <= 512, '.gitignore exceeds its explicit 512-byte path budget');
const html = await readFile('dist/index.html', 'utf8');
assert.ok(!/(?:src|href)=["']\//.test(html), 'Root-relative runtime URL in dist/index.html');
const usedAssets = new Set([...html.matchAll(/(?:src|href)=["']\.\/assets\/([^"']+)/g)].map(match => match[1]));
for (const entry of await readdir('dist/assets')) {
  if (entry.endsWith('.js') || entry.endsWith('.css')) assert.ok(usedAssets.has(entry), `Stale build asset: ${entry}`);
}
const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
assert.ok(totalBytes < limit, `Submission ${totalBytes} exceeds ${limit}`);
const report = { method: 'Conservative uncompressed file bytes, excluding protected/input/scratch paths. No Git metadata read or modified.', totalBytes, limitBytes: limit, remainingBytes: limit - totalBytes, files: files.sort((a, b) => b.bytes - a.bytes) };
await writeFile('artifacts/bundle-budget.json', JSON.stringify(report, null, 2) + '\n');
console.log(`${files.length} deliverable files: ${totalBytes.toLocaleString()} bytes of ${limit.toLocaleString()} (${(totalBytes / limit * 100).toFixed(1)}%).`);
