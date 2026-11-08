# Duoverse Android Injector (`core/injector-android`)

High-performance ARM64 C/C++ runtime injection module targeting Unity mobile games powered by `libil2cpp.so`.

---

## Architectural Overview

On Android, single-player Unity games compile their C# gameplay code into native machine code via IL2CPP, packaged inside `libil2cpp.so` (typically under `lib/arm64-v8a/` or `lib/armeabi-v7a/`).

`core/injector-android` compiles into `libduoverse_injector_android.so` using the Android NDK. It loads into the game process memory space upon startup and executes inline function hooks targeting `libil2cpp.so` without requiring root permissions.

---

## Technical Strategy

1. **Inline Hooking Engine (Dobby / Frida Gum):**
   - Employs lightweight ARM64 inline hooking (e.g., [Dobby](https://github.com/jmpews/Dobby)) to hook native function pointers, redirect execution to Duoverse trampolines, and invoke original methods.
2. **IL2CPP Metadata Resolution:**
   - Dynamically resolves symbols from `libil2cpp.so`:
     - `il2cpp_init`
     - `il2cpp_domain_get`
     - `il2cpp_thread_attach`
     - `il2cpp_class_from_name`
     - `il2cpp_class_get_method_from_name`
3. **Player Replication & Input Diversion:**
   - Hooks player instantiation methods to spawn remote avatars for co-op partners.
   - Redirects virtual joystick / touch screen input vectors without interfering with host-authoritative game logic.
4. **JNI Environment Bridge:**
   - Exposes clean JNI bindings (`Java_com_duoverse_runtime_DuoverseBridge_*`) so the Android launcher or repacked APK can pass Room Codes, player roles (Host vs Client), and network configurations.

---

## Directory Structure

```
core/injector-android/
├── CMakeLists.txt                 # Android NDK CMake configuration
├── README.md                      # Architecture documentation
├── include/
│   └── duoverse_android/
│       ├── dobby_wrapper.hpp      # ARM64 inline hooking abstraction
│       ├── il2cpp_hook.hpp        # libil2cpp.so hook manager
│       └── jni_bridge.hpp         # JNI interface for Java/Kotlin activities
└── src/
    ├── dobby_wrapper.cpp          # Trampoline allocation and instruction patching
    ├── il2cpp_hook.cpp            # Unity method resolution & hooks
    └── jni_bridge.cpp             # JNI export implementations
```

---

## Building with Android NDK

```bash
# Example compilation with Android NDK r25+
cmake -B build-android \
  -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK/build/cmake/android.toolchain.cmake \
  -DANDROID_ABI=arm64-v8a \
  -DANDROID_PLATFORM=android-26 \
  -DCMAKE_BUILD_TYPE=Release

cmake --build build-android
```
Output: `build-android/libduoverse_injector_android.so`
