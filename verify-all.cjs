'use strict';
const {spawnSync} = require('node:child_process');
const checks = ['verify.cjs', 'verify-server.cjs', 'verify-encryption.cjs',
  'verify-diagnostics.cjs', 'verify-webllm.cjs', 'verify-cpu.cjs',
  'verify-model-files.cjs', 'verify-pwa.cjs', 'verify-workflow.cjs', 'verify-release.cjs', 'verify-ci.cjs'];
for (const file of checks) {
  const result = spawnSync(process.execPath, [file], {cwd: __dirname, stdio: 'inherit'});
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`PASS: all ${checks.length} verification suites.`);
