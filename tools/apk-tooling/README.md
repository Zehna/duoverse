# Duoverse APK Tooling (`tools/apk-tooling`)

Automated Android APK inspection, native `.so` injection, and auto-repack pipeline for Duoverse.

---

## Capabilities

1. **Engine & Architecture Detection:**
   - Inspects internal APK structures without full unpacking.
   - Identifies Unity IL2CPP (`libil2cpp.so`), Unity Mono (`Assembly-CSharp.dll`), Unreal Engine (`libUE4.so`), and Godot.
   - Detects target ABIs (`arm64-v8a`, `armeabi-v7a`, `x86_64`).
   - Scans for mobile anti-cheat signatures (Tencent ACE, Denuvo Mobile, SafetyNet / Play Integrity).
2. **Duoverse Runtime Embedding:**
   - Inserts `libduoverse_injector_android.so` and `libduoverse_netcode.so` into `lib/<target-abi>/`.
   - Patches native library dependency graph (`DT_NEEDED` entry in `libunity.so` or `libmain.so`) ensuring the Duoverse runtime initializes automatically when the Android OS loads the game.
3. **Zip Alignment & Re-Signing:**
   - Re-aligns archive entries to 4-byte boundaries (analogous to `zipalign`) for Android OS memory mapping.
   - Signs the repacked APK with standard debug keys or custom keystores using `apksigner` / Android v1+v2 signature schemes.

---

## Usage

```bash
# Analyze APK structure and engine
python3 tools/apk-tooling/repack_pipeline.py --inspect game.apk

# Inject Duoverse co-op runtime and auto-repack
python3 tools/apk-tooling/repack_pipeline.py \
  --input game.apk \
  --output game_duoverse_coop.apk \
  --abi arm64-v8a

# Run automated pipeline tests
python3 tools/apk-tooling/test_pipeline.py
```
