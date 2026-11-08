# Duoverse Architecture & Autonomous Agent Guidelines

> **Status:** Mandatory Repository Policy  
> **Target Scope:** All Agents (Antigravity, Copilot, Subagents) and Human Contributors  
> **Supported Platforms:** Multi-Platform — PC (Windows x86_64 / Linux Proton) & Mobile (Android ARM64 / ARM32)  
> **Location:** `.antigravity/rules.md`

---

## 1. Executive Summary & Mission

**Duoverse** is a modern desktop & mobile runtime injection platform that enables gamers to play installed single-player PC and Android games cooperatively or in multiplayer mode with friends—instantly, seamlessly, cross-platform, and safely without damaging original game files or triggering anti-cheat bans.

To maintain code quality, user safety, and architectural integrity across human and automated contributions, all agents working in this repository must strictly adhere to the four inviolable principles detailed below across both PC and Android targets.

---

## 2. The Four Inviolable Architectural Principles (Multi-Platform)

### 2.1 Principle 1: Non-Destructive Modding (CRITICAL)
> **Never overwrite, modify, delete, or permanently alter original game installations on disk or device storage.**

* **PC (Windows):**
  1. All binary patching must occur **in-memory** after the game process is spawned in suspended mode, utilizing memory hooking libraries (e.g., MinHook, Microsoft Detours, or native trampoline patching).
  2. Any file substitution, asset injection, or configuration overriding must use a **Virtual File System (VFS)** layer (hooking `CreateFileW`, `NtOpenFile`, `NtCreateFile`, `fopen`, etc.) that redirects file read requests to memory buffers or Duoverse mod caches transparently.
* **Mobile (Android):**
  1. Modifications use the automated repack pipeline (`tools/apk-tooling/repack_pipeline.py`) or dynamic library loading via `libduoverse_injector_android.so` without touching system partitions or requiring device root.
  2. The original APK is always kept intact as an untouched reference backup; repacked co-op APKs are generated into isolated target paths.
* **Guarantee:** Terminating Duoverse or uninstalling the co-op profile leaves original game files in a 100% pristine, unmodified state.

### 2.2 Principle 2: Host-Authority Network Topology & Cross-Play
> **The Host (Player 1) owns world state simulation; Clients stream local inputs and transform state.**

* **The Problem:** Single-player game engines are fundamentally designed without client-server replication models. Running decentralized state machines causes catastrophic desyncs in physics, quest progression, and enemy AI.
* **The Mandate:**
  1. **Player 1 (Host)** acts as the authoritative simulation master:
     - Owns enemy AI decision trees, spawning, and pathfinding.
     - Owns world physics, interactive object destruction, and trigger volumes.
     - Owns global quest progress, NPC dialogue state, and inventory drops.
  2. **Player 2+ (Clients - PC or Android):**
     - Stream local avatar position, rotation, animation states, controller inputs, or touch joystick vectors (`ClientTouchPayload`) to the Host.
     - Receive interpolated world snapshot states and authoritative corrections from the Host.
  3. **Cross-Play Synchronization:**
     - Host can be either PC or Android (though PC host is recommended for compute-intensive physics).
     - Network packet schemas (`core/netcode/include/duoverse/packet.hpp`) are strictly 1-byte packed (`#pragma pack(push, 1)`) with fixed-width endian-safe primitives to guarantee byte-for-byte binary equivalence between x86_64 and ARM64.

### 2.3 Principle 3: Automated Anti-Cheat Detection & Failsafe Abort
> **Automatically abort injection and notify the user if kernel-level anti-cheat, competitive integrity systems, or tamper detection drivers are detected.**

* **The Mandate:**
  1. **PC Scan:** Before spawning or attaching to any PC executable, scan PE import tables (`IMAGE_IMPORT_DESCRIPTOR`), exported symbols, and embedded strings for:
     - **Easy Anti-Cheat (EAC)** (`EasyAntiCheat*.dll`, `eac_server.dll`)
     - **BattlEye** (`BEService.exe`, `BattlEye*.dll`)
     - **Riot Vanguard** (`vgk.sys`, `vgc.exe`)
     - **Call of Duty Ricochet**, **Denuvo Anti-Cheat**, and **VAC** modules.
  2. **Android Scan:** The APK pipeline (`tools/apk-tooling/apk_analyzer.py`) scans APK native libraries and manifests for:
     - **Tencent ACE / Protect** (`libtprt.so`, `libtermp.so`)
     - **NetEase Sec** (`libnesec.so`), **Wellbia XIGNCODE3** (`libxigncode.so`), **AhnLab** (`libanort.so`)
     - Play Integrity / SafetyNet tamper detection.
  3. **Immediate Failsafe:** If any anti-cheat signature is detected, injection/repacking **must immediately abort**, logging the exact signature discovered and displaying a clear safety alert.

### 2.4 Principle 4: Zero-Port Forwarding Connectivity & Unified Lobbies
> **Lobbies must be instant and zero-configuration, prioritizing 6-character Room Codes via Steam Datagram Relay or WebRTC NAT traversal.**

* **PC-to-PC Transport (Steam Datagram Relay - SDR):**
  - Routes traffic through Valve relays via the Spacewar AppID (`480`) pattern without opening router ports or exposing IP addresses.
* **Cross-Play & Android Transport (WebRTC Data Channels):**
  - Android devices connect directly to PC hosts (and other Android players) using WebRTC data channels with public STUN/TURN NAT traversal.
  - PC and Android endpoints share the exact same 6-character alphanumeric Room Code (e.g., `DUO-7K2`).

---

## 3. Monorepo Component Boundaries

Every file and module in the repository has a dedicated place and boundary:

| Directory | Core Tech Stack | Architectural Responsibility |
|---|---|---|
| `apps/desktop-ui/` | Tauri + React + Tailwind CSS | Desktop launcher, game discovery, room lobby UI, profile selector, real-time safety monitor. |
| `core/injector/` | C++ / Rust | Windows PC injector: PE inspection, anti-cheat scanner, memory hooking (MinHook/Detours), and VFS redirection. |
| `core/injector-android/` | C++ (Android NDK) | Android ARM64 injector: `libil2cpp.so` hooking (Dobby / inline hooks), Unity metadata resolution, JNI bridge. |
| `core/engine-hooks/` | C#, C++, Rust | Hook templates for specific engines: Unity Mono (BepInEx/Harmony), Unity IL2CPP, Unreal Engine. |
| `core/netcode/` | C++20 / Rust | Cross-platform shared netcode (`.dll` on PC, `.so` on Android), P2P sync, 6-digit room code lobby, SDR and WebRTC. |
| `foundry/` | JSON, YAML, Python | Game profile catalog (`profile.schema.json`), automated desync testing suites, regression test harnesses. |
| `tools/apk-tooling/` | Python | Android APK inspection, engine detection, `.so` injection, zip alignment, and auto-signing pipeline. |
| `tools/coop-anything/` | Python, Markdown | Cloned official reference repository from CraneBeaker; contains reverse-engineering playbooks and MCP server. |

---

## 4. Safety & Contribution Protocol for Agents

When generating code or proposing changes in Duoverse:
1. **Never write code that touches original game files on disk or device.** Always route mutations through memory hooks or VFS abstractions.
2. **Preserve Cross-Play Endian & Struct Alignment:** Any new packet or network state struct in `core/netcode` must use fixed-width types (`uint32_t`, `int16_t`, `float`) and `#pragma pack(push, 1)`.
3. **Always run automated tests:**
   - Foundry profile tests: `python3 foundry/tests/test_profile_validation.py`
   - Netcode simulation: `python3 foundry/tests/test_desync_fuzzer.py`
   - APK tooling tests: `python3 tools/apk-tooling/test_pipeline.py`
