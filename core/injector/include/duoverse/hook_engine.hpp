#pragma once

#include <string>
#include <cstdint>

namespace duoverse::hook {

enum class InjectionMethod {
    SuspendedProcessCreate,
    ManualDllLoad,
    AppInitDlls,
    EarlyTrampoline
};

struct ProcessLaunchConfig {
    std::string executable_path;
    std::string command_line_args;
    std::string working_directory;
    std::vector<std::string> payload_dlls;
    bool enable_vfs = true;
};

struct ProcessHandleInfo {
    uint32_t process_id = 0;
    uint32_t thread_id = 0;
    void* native_process_handle = nullptr;
    void* native_thread_handle = nullptr;
    bool is_suspended = false;
};

// Launches a process in suspended mode, injects the payload DLLs, initializes VFS, and resumes
bool LaunchSuspendedAndInject(const ProcessLaunchConfig& config, ProcessHandleInfo* out_info);

// Abort and kill process safely if anomaly detected
void TerminateTargetProcess(ProcessHandleInfo& info);

} // namespace duoverse::hook
