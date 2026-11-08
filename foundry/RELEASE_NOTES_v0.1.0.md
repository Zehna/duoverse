# Duoverse v0.1.0 - First Multi-Platform Release (Windows & Android)

Welcome to the inaugural production release of **Duoverse** (`v0.1.0`), the native multi-platform co-op launcher and mod synchronization platform.

---

## 🌟 Key Highlights & Features

### 1. Dual-Platform Native Architecture (Tauri v2)
* **Windows (x64)**: Native desktop application built on Tauri v2 with Rust backend and Microsoft Edge WebView2, packaged into a lightweight, self-contained NSIS installer (`.exe`).
* **Android (ARM64)**: Full mobile APK target compiled for `aarch64-linux-android` (`arm64-v8a`), cryptographically signed with APK Signature Scheme v2 & v3.

### 2. Co-op Anything Catalog Database Integration (350+ Games)
* Embedded offline database with **356 verified co-op game profiles** extracted from the *Co-op Anything* registry (`foundry/catalog/coop_db.json`).
* Automated cross-referencing against local game libraries using Steam AppIDs, game titles, and directory slugs.
* Real-time UI indicator badges:
  * 🟢 **`VERIFIED CO-OP MOD`**: Highlighted in vibrant emerald green for games with confirmed co-op mod projects (e.g., *Balatro*, *Celeste*, *Elden Ring*, *Subnautica*, *Risk of Rain 2*).
  * 🔵 **`GENERIC ENGINE SYNC`**: Indicates automated engine-level synchronization fallback for uncatalogued Unity and Unreal games.

### 3. Non-Destructive Virtual File System (VFS)
* In-memory hooking and redirection ensuring **0% disk modification** to original game executables.
* Automatic payload injection mapping:
  * Unity Mono: `BepInEx-Mono`
  * Unity IL2CPP: `BepInEx-IL2CPP`
  * Unreal Engine: `UE4SS`
  * LÖVE 11 / Balatro: `Lovely-Lua`
  * Decompiled / Native: `Native-VFS`

### 4. Real OS & Hardware Scanner
* Live Windows Registry inspection (`HKCU\Software\Valve\Steam\SteamPath` and `HKLM\SOFTWARE\WOW6432Node\Valve\Steam\InstallPath`).
* Multi-drive Steam library parser (`libraryfolders.vdf` & `appmanifest_*.acf`).
* Epic Games Launcher manifest scanner (`%ProgramData%\Epic\EpicGamesLauncher\Data\Manifests`).
* Integrated Android ADB scanner and APK analyzer.

---

## 📦 Release Assets & Checksums

| Platform | Filename | Size | SHA-256 Checksum |
| :--- | :--- | :--- | :--- |
| **Windows x64** | `Duoverse_0.1.0_x64-setup.exe` | ~2.70 MiB | `5E38083AC0DB5FEA1FAC13BE65E671118669C1CF08894A54137A32D0793BD3F9` |
| **Android ARM64** | `Duoverse_0.1.0_arm64-release.apk` | ~15.4 MiB | `373BCE14CC4159A3CAB59134FACE9092510E5300B72C321EC792597745507717` |

---

## 🚀 Installation Instructions

### Windows (10 / 11)
1. Download `Duoverse_0.1.0_x64-setup.exe`.
2. Double-click the installer and follow the setup wizard.
3. Launch **Duoverse Launcher** from your Start Menu or Desktop shortcut.

### Android (ARM64 / Android 7.0+)
1. Download `Duoverse_0.1.0_arm64-release.apk` to your Android device.
2. Open the file and allow installation from unknown sources if prompted.
3. Launch **Duoverse** on your mobile device.
