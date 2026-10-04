'use strict';
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');

function releaseRequested(eventName, ref, event, changedVersion) {
  if (ref !== 'refs/heads/main') return false;
  if (eventName === 'workflow_dispatch') return event.inputs?.publish_release === true || event.inputs?.publish_release === 'true';
  if (eventName !== 'push' || event.deleted) return false;
  // Creating a branch must not accidentally publish a release.
  if (!/^[a-f0-9]{40}$/.test(event.before || '') || /^0+$/.test(event.before)) return false;
  if (!/^[a-f0-9]{40}$/.test(event.after || '')) throw Error('Invalid push commit');
  return changedVersion(event.before, event.after);
}

if (require.main === module) {
  const event = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8'));
  const publish = releaseRequested(process.env.GITHUB_EVENT_NAME, process.env.GITHUB_REF, event,
    (before, after) => execFileSync('git', ['diff', '--name-only', before, after, '--', 'VERSION'], {encoding:'utf8'}).trim() === 'VERSION');
  fs.appendFileSync(process.env.GITHUB_OUTPUT, `publish=${publish}\n`);
  console.log(publish ? 'Release requested after verification.' : 'Verification only.');
}
module.exports = {releaseRequested};
