#pragma once

#include <string>
#include <vector>
#include <string_view>

namespace duoverse::anticheat {

enum class AntiCheatKind {
    None,
    EasyAntiCheat,
    BattlEye,
    RiotVanguard,
    Ricochet,
    DenuvoAntiCheat,
    ValveAntiCheat,
    UnknownKernelDriver
};

struct AntiCheatScanResult {
    bool has_anti_cheat = false;
    AntiCheatKind kind = AntiCheatKind::None;
    std::string module_name;
    std::string reason;
};

// Returns true if the target executable or its directory contains signatures
// of kernel or competitive anti-cheat software that must not be injected.
AntiCheatScanResult ScanBinaryForAntiCheat(const std::string& executable_path);

// Check if a given module or import name matches known anti-cheat drivers/DLLs
bool IsAntiCheatSignature(std::string_view filename);

} // namespace duoverse::anticheat
