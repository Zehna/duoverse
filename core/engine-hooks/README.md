# Duoverse Engine Hooks (`core/engine-hooks`)

Engine-specific hook templates and runtime plugins for intercepting game state, spawning multiplayer avatars, and diverting input streams.

---

## Supported Engines & Roadmap

| Engine | Hook Framework | Status | Directory |
|---|---|---|---|
| **Unity (Mono)** | BepInEx 5.x / HarmonyX | Primary (Active) | `core/engine-hooks/unity-bepinex` |
| **Unity (IL2CPP)** | BepInEx 6.x / Cpp2IL | Planned | `core/engine-hooks/unity-il2cpp` |
| **Unreal Engine 4/5** | Unreal Engine Mod Loader (UEML) / Dumper | Planned | `core/engine-hooks/unreal` |
| **Custom / Native** | MinHook direct detour templates | In Design | `core/engine-hooks/native` |

---

## Unity BepInEx Architecture

For Unity games running on the Mono runtime:
1. **Zero-Disk-Overwrite:** The Duoverse Injector launches Unity with doorstop/BepInEx arguments or VFS-redirected `version.dll` / `winhttp.dll` proxy.
2. **Player Cloning:** Intercepts `PlayerController` or character prefab instantiate calls to create local ghost replicas for Player 2+ clients.
3. **Host-Authority Enforcement:**
   - **Host:** Runs all native physics, enemy pathfinding, and quest state updates. Periodically serializes snapshots to the netcode layer.
   - **Client:** Disables local enemy AI triggers and quest state advancement. Interpolates remote entity transforms received over the network.
