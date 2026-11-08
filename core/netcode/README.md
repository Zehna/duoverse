# Duoverse Netcode (`core/netcode`)

Low-latency P2P synchronization protocol, 6-character room code lobby management, and cross-platform network engine connecting **PC (Windows)** and **Mobile (Android)** in unified co-op sessions.

---

## Cross-Platform Compilation Targets

Written in portable, standards-compliant C++20 with strict binary endian safety:

| Target Platform | Compilation Artifact | Primary Transport |
|---|---|---|
| **Windows PC** | `duoverse_netcode.dll` | Steam Datagram Relay (SDR AppID 480) & WebRTC |
| **Android (ARM64 / ARM32)** | `libduoverse_netcode.so` (Android NDK) | WebRTC Data Channels (STUN / TURN) |
| **Linux (Native / Steam Deck)** | `libduoverse_netcode.so` | Steam Datagram Relay (SDR) & WebRTC |

---

## Cross-Play Architecture (PC & Android)

Duoverse allows PC and Android gamers to join the **exact same 6-character Room Code** (e.g., `DUO-7K2`):

```
       [Room Code: DUO-7K2]
               │
     ┌─────────┴─────────┐
     ▼                   ▼
[PC Player]        [Android Player]
Windows (.dll)     Android (.so)
     │                   │
     └─────► WebRTC ◄────┘
        (Data Channels)
```

1. **Unified Packet Serialization:** All network packets (`PacketHeader`, `ClientInputPayload`, `WorldSnapshotHeader`) use strict 1-byte packing (`#pragma pack(push, 1)`) and fixed-width types to guarantee byte-for-byte binary compatibility across x86_64 and ARM64 architectures.
2. **Mobile Touch & Gamepad Normalization:** Supports both traditional keyboard/gamepad axes and touch input coordinates (`ClientTouchPayload`).
3. **Hybrid Transport Bridge:**
   - PC-to-PC connections leverage Valve's low-latency Steam Datagram Relay network.
   - Cross-play connections between PC and Android leverage WebRTC data channels with ICE NAT traversal.

---

## Directory Structure

```
core/netcode/
├── CMakeLists.txt
├── README.md
├── include/
│   └── duoverse/
│       ├── crossplay.hpp    # Cross-play session manager (PC + Android)
│       ├── export.hpp       # DUOVERSE_API visibility macros
│       ├── lobby.hpp        # Room code generator and lobby state machine
│       ├── packet.hpp       # Binary packed packet schemas
│       └── sdr_transport.hpp# Steam Datagram Relay wrapper
└── src/
    ├── crossplay.cpp        # Multiplatform peer routing
    ├── lobby.cpp            # Room code encoder / decoder
    └── sdr_transport.cpp    # Steamworks API integration
```

---

## Building

### Windows (MSVC / Clang)
```bash
cmake -B build
cmake --build build --config Release
# Produces duoverse_netcode.dll
```

### Android (NDK r25+)
```bash
cmake -B build-android \
  -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK/build/cmake/android.toolchain.cmake \
  -DANDROID_ABI=arm64-v8a \
  -DANDROID_PLATFORM=android-26
cmake --build build-android
# Produces libduoverse_netcode.so
```
