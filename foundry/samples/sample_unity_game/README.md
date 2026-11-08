# Sample Unity Game PoC (`foundry/samples/sample_unity_game`)

This directory contains a simulated standalone Unity PC game structure designed for automated engine detection, VFS redirection, and non-destructive injection testing.

---

## Structure

```
foundry/samples/sample_unity_game/
├── Game.exe                           # Target game executable (x64 PE)
├── UnityPlayer.dll                    # Unity Player engine library
├── Game_Data/
│   └── Managed/
│       └── Assembly-CSharp.dll        # Mono managed game logic
└── README.md
```

## Scanner Verification

When scanned by `core/injector` or `apps/desktop-ui/src/services/gameScanner.ts`:
- **Engine Recognized:** `unity-mono` (`Unity (Mono / BepInEx)`)
- **Anti-Cheat Policy:** Verified clean (0 kernel signatures)
- **Modding Mechanism:** Non-Destructive in-memory injection & VFS
