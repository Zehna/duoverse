#pragma once

#include <cstdint>
#include <string>
#include <vector>

namespace duoverse::couch {

enum class SplitMode {
    Horizontal, // Top / Bottom
    Vertical    // Left / Right
};

struct WindowRect {
    int32_t x = 0;
    int32_t y = 0;
    int32_t width = 0;
    int32_t height = 0;
};

struct SplitLayout {
    WindowRect instance_1;
    WindowRect instance_2;
};

struct InstanceConfig {
    uint32_t instance_id;        // 1 or 2
    uint32_t assigned_pad_index; // 0 or 1
    std::wstring isolated_env_dir;
    WindowRect target_window;
};

// Calculates window coordinates given monitor dimensions and split mode
SplitLayout CalculateLayout(int32_t monitor_width, int32_t monitor_height, SplitMode mode);

// Spawns dual instances with isolated environment variables and mutex hooks
bool LaunchDualInstances(
    const std::wstring& executable_path,
    const std::wstring& arguments,
    SplitMode mode,
    int32_t monitor_width,
    int32_t monitor_height
);

// XInput Controller Isolation: Filters/remaps XInput calls so Game 1 receives Pad 0 and Game 2 receives Pad 1 as Pad 0
class XInputFilter {
public:
    static void SetInstanceIndex(uint32_t instance_id);
    static uint32_t RemapUserIndex(uint32_t requested_index);
    static bool ShouldIgnoreController(uint32_t requested_index);
};

} // namespace duoverse::couch
