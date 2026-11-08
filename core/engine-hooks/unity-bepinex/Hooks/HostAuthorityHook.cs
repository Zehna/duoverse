using System;
using HarmonyLib;

namespace Duoverse.Unity.Hooks
{
    /// <summary>
    /// Enforces Principle 2 (Host-Authority):
    /// On Client instances, suppress local enemy AI decision loops and quest progression,
    /// relying instead on snapshots sent from Player 1 (Host).
    /// </summary>
    public static class HostAuthorityHook
    {
        /// <summary>
        /// Prefix check to disable local simulation on clients.
        /// Returns true on Host (run original method), false on Client (skip method).
        /// </summary>
        public static bool ShouldExecuteWorldSimulation()
        {
            if (DuoverseUnityPlugin.IsHost)
            {
                return true; // Host executes full world simulation
            }

            // Client skips local simulation logic to avoid desync
            return false;
        }
    }
}
