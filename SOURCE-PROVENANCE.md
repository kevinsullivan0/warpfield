# Source provenance

Published publicly to GitHub on 10 November 2026 from the source of the active Warpfield Site.

- Active Site: https://warp-bubble-observatory-2026.kevinsulli.chatgpt.site
- Sites version: 11.
- Original Sites source commit: `c30f3579617a6ee696a829edf705d13505755c24`.
- Runtime files in `dist/` are unchanged from that source commit.
- Tests, numerical reference and audit scripts, technical README, and recorded validation reports are retained.
- This is a source snapshot, not a mirror of the original repository history. Only the runnable source, tests, technical documentation, validation evidence are included. Deployment-specific configuration is excluded.
- This repository and the simulator are public. Related notebook material remains separately permissioned and is not included or linked here.

## Attribution and dependencies

Kevin Sullivan supplied the goals and feedback. Codex generated and revised the implementation, tests and documentation. This does not claim a new numerical method, independent human audit, or original scientific contribution by Kevin.

The application is buildless JavaScript with browser WebGPU/WebGL2 APIs and no package dependencies. The sky and surface artwork are procedural. NASA facts and the primary Alcubierre, Clark–Hiscock–Larson, and Müller–Weiskopf references remain credited in the README and simulator. No additional license or grant of rights is introduced by this snapshot.

## Verification on 10 November 2026

- `node --test *.test.mjs`: 15 test files passed, zero failures.
- The source tree and all 11 retained original commits were checked for common credential patterns and unintended private file/conversation links. None were found. This is a scoped publication check, not a complete security audit.
- Runtime files were retained without edits. This publication does not assert a new GPU or browser performance run. JSON validation and benchmark files remain the dated evidence recorded during the original implementation.
- `source-manifest.json` records SHA-256 hashes for the retained original files; README navigation additions are identified separately.

## Active application

- [Launch Warpfield](https://warp-bubble-observatory-2026.kevinsulli.chatgpt.site)
- [Browse the source](https://github.com/kevinsullivan0/warpfield)

This source includes the 10 November smooth camera update described in the README and validation reports. Public source access does not grant access to any separate private notebooks.
