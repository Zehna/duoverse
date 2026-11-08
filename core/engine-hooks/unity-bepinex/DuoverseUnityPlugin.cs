using System;
using BepInEx;
using HarmonyLib;

namespace Duoverse.Unity
{
    [BepInPlugin(PluginGuid, PluginName, PluginVersion)]
    public class DuoverseUnityPlugin : BaseUnityPlugin
    {
        public const string PluginGuid = "com.duoverse.unity.runtime";
        public const string PluginName = "Duoverse Unity Co-op Plugin";
        public const string PluginVersion = "0.1.0";

        public static DuoverseUnityPlugin? Instance { get; private set; }
        public static bool IsHost { get; set; } = true;
        public static string RoomCode { get; set; } = string.Empty;

        private Harmony? _harmony;

        private void Awake()
        {
            Instance = this;
            Logger.LogInfo($"[Duoverse] Initializing Co-op Runtime v{PluginVersion}...");

            // Read environment variables passed by Duoverse Launcher
            string roleEnv = Environment.GetEnvironmentVariable("DUOVERSE_ROLE") ?? "HOST";
            IsHost = roleEnv.Equals("HOST", StringComparison.OrdinalIgnoreCase);
            RoomCode = Environment.GetEnvironmentVariable("DUOVERSE_ROOM_CODE") ?? "OFFLINE";

            Logger.LogInfo($"[Duoverse] Role: {(IsHost ? "Player 1 (Host-Authority Master)" : "Player 2+ (Client Avatar)")}");
            Logger.LogInfo($"[Duoverse] Room Code: {RoomCode}");

            // Apply Harmony memory patches
            _harmony = new Harmony(PluginGuid);
            _harmony.PatchAll();

            Logger.LogInfo("[Duoverse] Memory hooks installed successfully.");
        }

        private void OnDestroy()
        {
            _harmony?.UnpatchSelf();
            Logger.LogInfo("[Duoverse] Hooks unpatched cleanly.");
        }
    }
}
