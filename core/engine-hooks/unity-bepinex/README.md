# Unity BepInEx Co-op Hook Template

This module provides the base C# BepInEx 5.x / Harmony plugin template for injecting co-op multiplayer into Unity single-player games.

---

## Key Hook Responsibilities

1. **Avatar Replication (`PlayerSpawnHook`):** Clones the local character model to instantiate remote player avatars with distinct cosmetics, materials, or badges.
2. **Input Stream Separation (`InputFilterHook`):** Diverts remote inputs to client-specific avatar controllers without contaminating the Host's local input hardware.
3. **Host-Authority Enforcement (`HostAuthorityHook`):**
   - Host machine processes enemy AI, world events, and loot spawns.
   - Client machines suppress native spawn triggers and receive authoritative sync packets.
