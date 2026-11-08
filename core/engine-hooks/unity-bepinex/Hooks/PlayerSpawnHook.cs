using System;
using HarmonyLib;

namespace Duoverse.Unity.Hooks
{
    /// <summary>
    /// Hook template for instantiating and cloning remote player models
    /// when new players join the co-op session.
    /// </summary>
    public static class PlayerSpawnHook
    {
        // Example hook point: Intercept player instantiation
        public static void OnPlayerSpawned(object playerInstance)
        {
            if (DuoverseUnityPlugin.IsHost)
            {
                // Host keeps primary authority over player stats & inventory
                DuoverseUnityPlugin.Instance?.Logger.LogInfo("[Duoverse::Spawn] Host player registered.");
            }
            else
            {
                // Client binds local inputs to their own avatar entity
                DuoverseUnityPlugin.Instance?.Logger.LogInfo("[Duoverse::Spawn] Client avatar linked to remote session.");
            }
        }
    }
}
