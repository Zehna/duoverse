#pragma once

#include <string>
#include <vector>
#include <cstdint>

namespace duoverse::pe {

enum class Architecture {
    Unknown,
    x86_32,
    x86_64,
    ARM64
};

enum class Subsystem {
    Unknown,
    WindowsGui,
    WindowsCui
};

struct PEInfo {
    bool is_valid_pe = false;
    Architecture architecture = Architecture::Unknown;
    Subsystem subsystem = Subsystem::Unknown;
    uint32_t timestamp = 0;
    uint64_t image_base = 0;
    uint32_t entry_point = 0;
    std::vector<std::string> imported_dlls;
    std::vector<std::string> section_names;
    std::string sha256_checksum;
};

// Analyzes the PE header and import tables of an executable file
PEInfo AnalyzeExecutable(const std::string& path);

} // namespace duoverse::pe
