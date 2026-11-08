# Duoverse v0.2.0 — Major Strategic Pillars Release

Duoverse v0.2.0 delivers 4 major architectural pillars transforming single-player games into seamless, non-destructive multiplayer co-op experiences across Windows PC and Android.

---

## 🚀 Key Strategic Feature Pillars

### 1. In-Game Tactical HUD Overlay (`core/overlay`)
- **Universal Graphics Hook Abstraction**: Integrated DirectX 11 (`IDXGISwapChain::Present`), DirectX 12, and OpenGL fallback rendering hook via `kiero_bridge.hpp`.
- **Minimalist Tactical Dark HUD**: Rendered using Dear ImGui with ultra-low draw-call overhead.
- **Instant Hotkey / Controller Trigger**: Easily toggled mid-game via `Shift + Tab` or the `Xbox Guide` controller button.
- **Telemetry & Quick Chat**: Displays active 6-digit Room Code with 1-click clipboard copy, real-time peer ping (ms) and jitter telemetry, plus a quick in-game tactical chat stream.

### 2. Save Game & Quest Progress Sync (`core/save-sync`)
- **Ludusavi Manifest Integration**: Auto-detects game save locations by parsing standard tokens (`<home>`, `<appdata>`, `<localappdata>`, `<winSavedGames>`, `<winDocuments>`).
- **Pre-Session Zero-Risk Backup**: Automatically snapshots original save files into `.duo_backup` before co-op play begins.
- **Post-Session Delta Packaging**: Compares active saves against the pre-session snapshot and compiles delta modifications into compressed, CRC32-verified packets (`DuoversePacket::SaveSync` / 0x40) sent to the Client so Player 2 never loses campaign progression.

### 3. Advanced User-Space Virtual File System (USVFS) (`core/vfs`)
- **Zero-Disk Modification Guarantee**: Intercepts Windows I/O APIs (`CreateFileW`, `GetFileAttributesW`, `FindFirstFileW`) in user space.
- **In-Memory RAM Staging**: Virtualizes modded payloads and netcode configurations directly from memory buffers or isolated staging caches. Original game binaries on physical storage remain 100% pristine and unaltered (SHA-256 integrity preserved).

### 4. Couch Co-Op & Split-Screen Multi-Instance (`core/couch-coop`)
- **Multi-Instance Process Spawner**: Launches two game instances simultaneously on 1 PC with isolated environment variables (`DUOVERSE_INSTANCE_ID=1` and `2`) and mutex evasion.
- **XInput Controller Isolation**: Eliminates gamepad crosstalk by mapping Gamepad 0 directly to Game 1 and routing Gamepad 1 as virtual Gamepad 0 to Game 2.
- **Dynamic Window Tiling Engine**: Mathematically tiles game viewports without pixel loss:
  - **Horizontal Split**: 1920×540 each on 1080p, 2560×720 on 1440p, 3840×1080 on 4K.
  - **Vertical Split**: 960×1080 each on 1080p, 1280×1440 on 1440p, 1920×2160 on 4K.

### 5. Desktop UI Modernization (`apps/desktop-ui`)
- **Session Configuration Switches**: Added toggles for In-Game Tactical HUD, Save Game Sync, and Couch Split-Screen directly inside `ActivateCoopModal`.
- **Dedicated "Couch Co-op" Tab**: Interactive monitor layout visualizer, resolution preset selector (1080p / 1440p / 4K), and live XInput controller isolation status indicators.

---

## 🧪 Automated Verification Test Suite

All automated tests passed with 100% success rate:
- `foundry/tests/test_vfs_redirection.py`: 3/3 tests PASSED (Zero-disk modification & in-memory staging verified).
- `foundry/tests/test_save_sync.py`: 2/2 tests PASSED (Ludusavi token expansion & delta packet round-trip verified).
- `foundry/tests/test_splitscreen_layout.py`: 5/5 tests PASSED (1080p, 1440p, 4K resolution tiling & controller isolation verified).
- Rust Native Engine (`src-tauri`): 8/8 tests PASSED.
- Desktop UI (`npm run build`): TypeScript and Vite production bundle PASSED.

---

## 📦 Release Packages & SHA-256 Checksums

| Platform | File Name | Size | SHA-256 Checksum |
| :--- | :--- | :--- | :--- |
| **Windows x64** | `Duoverse_0.2.0_x64-setup.exe` | 2.71 MiB | `0B6F6C5F7D8B03347AAC34B3B17A6E9E7B624C1C647EBE0D57AB266A6DD760BB` |
| **Android ARM64** | `Duoverse_0.2.0_arm64-release.apk` | 16.22 MiB | `24127C819B276CC145FD1D3B5B75EB0AE4BAA705B96BA7514EBB8DF693AFB23F` |

---

## 🛠️ Installation Instructions

### Windows (PC)
1. Download `Duoverse_0.2.0_x64-setup.exe`.
2. Run the NSIS installer to install Duoverse Launcher.
3. Launch Duoverse: your Steam and Epic Games libraries will be scanned automatically.
4. Press `Shift + Tab` in-game to toggle the tactical overlay!

### Android
1. Download `Duoverse_0.2.0_arm64-release.apk`.
2. Install the APK on any ARM64 Android device (Android 8.0+).
3. Connect seamlessly to PC host lobbies using 6-digit room codes.
