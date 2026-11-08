# Duoverse Injector (`core/injector`)

High-performance C++ / Rust module responsible for:
1. **Binary PE Inspection & Architecture Detection (x86 / x64)**
2. **Automated Anti-Cheat Detection & Abort Failsafe**
3. **In-Memory Hooking (MinHook / Detours)**
4. **Virtual File System (VFS) Redirection Layer**

---

## Architectural Principles Enforced

- **Non-Destructive Modding:** Never write or patch binary files on disk. Target processes are launched in a suspended state (`CREATE_SUSPENDED`), hooks are injected into memory, and the main thread is resumed.
- **VFS Redirection:** Any game data overrides or mod assets are served via intercepted filesystem APIs (`CreateFileW`, `NtCreateFile`, `NtOpenFile`). The original game installation remains bit-for-bit pristine.
- **Safety First:** If known anti-cheat modules (Easy Anti-Cheat, BattlEye, Vanguard, Ricochet, etc.) are detected in the PE headers, imports, or process tree, the injector aborts immediately with a safety code.

---

## Directory Structure

```
core/injector/
├── CMakeLists.txt              # CMake build configuration
├── include/
│   └── duoverse/
│       ├── anti_cheat.hpp      # Anti-cheat signature definitions and scanner API
│       ├── hook_engine.hpp     # Memory hooking abstractions (MinHook/Detours)
│       ├── pe_analyzer.hpp     # PE header, import, and section scanner
│       └── vfs_redirector.hpp  # Virtual File System redirection layer
└── src/
    ├── anti_cheat.cpp          # EAC / BattlEye / Vanguard detection implementation
    ├── hook_engine.cpp         # Process suspension and DLL injection
    ├── pe_analyzer.cpp         # Executable parser
    └── vfs_redirector.cpp      # File handle redirection hooks
```

---

## API Summary

```cpp
#include "duoverse/pe_analyzer.hpp"
#include "duoverse/anti_cheat.hpp"
#include "duoverse/hook_engine.hpp"

// 1. Analyze binary before launch
auto pe_info = duoverse::pe::AnalyzeExecutable("game.exe");
if (pe_info.architecture == duoverse::pe::Arch::Unsupported) {
    return false;
}

// 2. Anti-cheat check
if (duoverse::anticheat::DetectKernelAntiCheat(pe_info)) {
    duoverse::log::Error("Kernel anti-cheat detected! Aborting injection for safety.");
    return false;
}

// 3. Launch suspended & inject VFS / engine hooks non-destructively
duoverse::hook::LaunchAndInject("game.exe", "duoverse_unity_hook.dll");
```
