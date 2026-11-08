# Duoverse Architecture & Autonomous Agent Guidelines

> **Status:** Mandatory Repository Policy  
> **Target Scope:** All Agents (Antigravity, Copilot, Subagents) and Human Contributors  
> **Location:** `.antigravity/rules.md`

---

## 1. Executive Summary & Mission

**Duoverse** is a modern desktop launcher and runtime injection platform that enables gamers to play installed single-player PC games cooperatively or in multiplayer mode with friends—instantly, seamlessly, and safely without damaging game files or triggering anti-cheat bans.

To maintain code quality, user safety, and architectural integrity across human and automated contributions, all agents working in this repository must strictly adhere to the four inviolable principles detailed below.

---

## 2. The Four Inviolable Architectural Principles

### 2.1 Principle 1: Non-Destructive Modding (CRITICAL)
> **Never overwrite, modify, delete, or permanently alter original game files on disk.**

* **The Problem:** Modding platforms that directly patch game files (`Assembly-CSharp.dll`, game `.exe`, data archives) frequently corrupt game installations, invalidate Steam/GOG/Epic file verification, and break updates or uninstalls.
* **The Mandate:**
  1. All binary patching must occur **in-memory** after the game process is spawned in suspended mode, utilizing memory hooking libraries (e.g., MinHook, Microsoft Detours, or native trampoline patching).
  2. Any file substitution, asset injection, or configuration overriding must use a **Virtual File System (VFS)** layer (hooking `CreateFileW`, `NtOpenFile`, `NtCreateFile`, `fopen`, etc.) that redirects file read requests to memory buffers or Duoverse mod caches transparently.
  3. Closing Duoverse or terminating the game process must leave the user's original game directory in a 100% pristine, unmodified state.

### 2.2 Principle 2: Host-Authority Network Topology
> **The Host (Player 1) owns world state simulation; Clients stream local inputs and transform state.**

* **The Problem:** Single-player game engines are fundamentally designed without client-server replication models. Running decentralized or peer-symmetric state machines on single-player logic causes catastrophic desyncs in physics, quest progression, and enemy AI.
* **The Mandate:**
  1. **Player 1 (Host)** acts as the authoritative simulation master:
     - Owns enemy AI decision trees, spawning, and pathfinding.
     - Owns world physics, interactive object destruction, and trigger volumes.
     - Owns global quest progress, NPC dialogue state, and inventory drops.
  2. **Player 2+ (Clients)** act as remote avatar inputs:
     - Stream local avatar position, rotation, animation states, and controller inputs to the Host.
     - Receive interpolated world snapshot states and authoritative corrections from the Host.
  3. When injecting into single-player code, disable local world updates on Client instances and mirror state received from the Host.

### 2.3 Principle 3: Automated Anti-Cheat Detection & Failsafe Abort
> **Automatically abort injection and notify the user if kernel-level anti-cheat or competitive integrity systems are detected.**

* **The Problem:** Injecting hooks or memory trampolines into games protected by kernel-level anti-cheat drivers can trigger hardware bans or permanent account sanctions.
* **The Mandate:**
  1. **Pre-Injection Inspection:** Before spawning or attaching to any target executable, the injector must analyze the binary and its dependencies:
     - Scan PE import tables (`IMAGE_IMPORT_DESCRIPTOR`), exported symbols, and embedded strings.
     - Check for known anti-cheat drivers, services, and modules, including:
       - **Easy Anti-Cheat (EAC)** (`EasyAntiCheat*.dll`, `eac_server.dll`)
       - **BattlEye** (`BEService.exe`, `BattlEye*.dll`)
       - **Riot Vanguard** (`vgk.sys`, `vgc.exe`)
       - **Call of Duty Ricochet**
       - **Denuvo Anti-Cheat** (Kernel driver variant)
       - **Valve Anti-Cheat (VAC)** protected multiplayer modules
  2. **Immediate Failsafe:** If any kernel or competitive anti-cheat signature is discovered, the injector **must immediately abort** process suspension/hooking, log the exact signature detected, and surface a high-visibility safety alert via the desktop UI.

### 2.4 Principle 4: Zero-Port Forwarding Connectivity
> **Lobbies must be instant and zero-configuration, prioritizing 6-character Room Codes via Steam Datagram Relay or WebRTC NAT traversal.**

* **The Problem:** Casual gamers cannot and should not be expected to configure router NAT settings, forward UDP/TCP ports, or set up virtual LAN software like Hamachi.
* **The Mandate:**
  1. **Primary Transport - Steam Datagram Relay (SDR):**
     - Utilize Steam's global relay network via the standard Spacewar AppID (`480`) pattern for peer discovery and low-latency packet routing through Valve relays.
     - Generate human-readable 6-character alphanumeric Room Codes (e.g., `DUO-7K2`) mapped to Steam Lobby IDs.
  2. **Secondary / Non-Steam Transport - WebRTC ICE/STUN/TURN:**
     - For DRM-free or non-Steam game profiles, use WebRTC data channels with public STUN servers (and TURN fallback) to punch through symmetric NATs without requiring open inbound ports.

---

## 3. Monorepo Component Boundaries

Every file and module in the repository has a dedicated place and boundary:

| Directory | Core Tech Stack | Architectural Responsibility |
|---|---|---|
| `apps/desktop-ui/` | Tauri + React + Tailwind CSS | User-facing launcher, game library discovery, room lobby UI, profile selector, real-time injector status monitor. |
| `core/injector/` | C++ / Rust | Process creation in suspended state, PE binary inspection, anti-cheat detection, memory injection (MinHook/Detours), and VFS redirection layer. |
| `core/engine-hooks/` | C#, C++, Rust | Engine-specific hook templates. Initial focus: Unity (BepInEx / Mono / IL2CPP), followed by Unreal and custom proprietary engines. |
| `core/netcode/` | C++ / Rust | P2P state synchronization protocol, 6-digit room code lobby management, SDR (Spacewar AppID 480) wrapper, and WebRTC fallback. |
| `foundry/` | JSON, YAML, Python | Game profile catalog (`profile.schema.json`), automated desync testing scripts, regression test harnesses, and compatibility matrices. |
| `tools/coop-anything/` | Python, Markdown | Cloned official reference repository from CraneBeaker; contains reverse-engineering playbooks, pattern catalogs, and the MCP server. |

---

## 4. Safety & Contribution Protocol for Agents

When generating code or proposing changes in Duoverse:
1. **Never write code that touches game files on disk.** Always route file mutations through memory or VFS abstractions.
2. **Always include validation checks.** Every injector or hook entry point must check the target binary's architecture (x86 vs x64), checksum, and anti-cheat signatures.
3. **Keep modules decoupled.** The UI (`apps/desktop-ui`) must communicate with the core engine solely through well-defined IPC boundaries (Tauri commands / events or IPC channels).
4. **Preserve documentation.** Update corresponding README files and test scripts whenever adding new hooks, protocols, or game profiles.
