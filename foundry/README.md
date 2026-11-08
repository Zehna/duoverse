# Duoverse Foundry (`foundry/`)

The compatibility catalog and automated testing engine for Duoverse game profiles.

---

## Directory Overview

- **`profiles/`**: Declarative game profiles in JSON format adhering to `profile.schema.json`. Each profile specifies:
  - Game identity and executable naming patterns
  - Game engine type (`unity-mono`, `unity-il2cpp`, `unreal-4`, `custom`)
  - Hook injection payload DLLs
  - Virtual File System (VFS) redirection rules
  - Host-authority replication frequency and critical sync variables
  - Anti-cheat safety flags
- **`tests/`**: Automated verification test suites:
  - `test_profile_validation.py`: Asserts schema compliance for every profile in `profiles/`.
  - `test_desync_fuzzer.py`: Automated desync simulation harness testing packet drops, out-of-order delivery, and client-side reconciliation.

---

## Creating a New Game Profile

1. Identify the game engine using the Co-op Anything MCP tool `detect_engine`.
2. Ensure the game does not use kernel anti-cheat (`detect_engine` or `game_identity`).
3. Define the profile JSON adhering to `foundry/profiles/profile.schema.json`.
4. Validate the profile:
   ```bash
   python foundry/tests/test_profile_validation.py
   ```
