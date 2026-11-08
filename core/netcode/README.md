# Duoverse Netcode (`core/netcode`)

Low-latency P2P synchronization protocol, 6-character room code lobby management, and multi-transport network engine for Duoverse.

---

## Transport Layers

### 1. Steam Datagram Relay (SDR)
- **Zero-Port Forwarding:** Routes traffic through Valve's worldwide relay network without requiring open router ports or exposing client IP addresses.
- **Spacewar Pattern (AppID 480):** Utilizes the standard development AppID for Steam matchmaking lobbies, enabling any Steam user to connect with friends instantly.
- **Room Code Mapping:** Encodes 64-bit Steam Lobby IDs into human-friendly 6-character room codes (e.g., `DUO-9B4`).

### 2. WebRTC Data Channels (Fallback)
- **DRM-Free / Non-Steam Support:** For games running outside of Steam (GOG, itch.io, independent builds).
- **ICE / STUN / TURN:** Automatically punches through standard and symmetric NATs.

---

## Synchronization Protocol

- **Host-Authority Model:**
  - **Host (P1):** Serializes world tick snapshots (NPC positions, health, active quests, world item states) at 20-30 Hz.
  - **Clients (P2+):** Send local input state vectors (movement axis, buttons pressed, avatar aim angle) at 60 Hz.
- **Interpolation & Dead Reckoning:** Smooths remote player movements on clients using exponential moving average and cubic spline extrapolation.

---

## Directory Structure

```
core/netcode/
├── CMakeLists.txt
├── README.md
├── include/
│   └── duoverse/
│       ├── lobby.hpp        # Room code generator and lobby state machine
│       ├── netcode.hpp      # High-level netcode session manager
│       ├── packet.hpp       # Packet serialization and schema
│       └── sdr_transport.hpp# Steam Datagram Relay (AppID 480) wrapper
└── src/
    ├── lobby.cpp            # Room code encoder / decoder
    ├── netcode.cpp          # Tick scheduler and replication loop
    ├── packet.cpp           # Binary packing
    └── sdr_transport.cpp    # Steamworks API integration
```
