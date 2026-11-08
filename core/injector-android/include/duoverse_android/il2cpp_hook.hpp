#pragma once

#include <string>
#include <cstdint>

namespace duoverse::android::il2cpp {

struct IL2CPPConfig {
    bool is_host = true;
    std::string room_code;
    std::string player_name = "Android_Player";
    int client_tick_rate = 60;
};

class IL2CPPHookEngine {
public:
    static IL2CPPHookEngine& Instance();

    // Initializes IL2CPP symbol resolution and waits for libil2cpp.so to load
    bool Initialize(const IL2CPPConfig& config);

    // Hooks game lifecycle and player controller instantiation
    bool InstallGameplayHooks();

    // Host authority check: returns true if local instance should run world simulation
    bool IsHostAuthority() const { return config_.is_host; }

    const IL2CPPConfig& GetConfig() const { return config_; }

private:
    IL2CPPHookEngine() = default;
    ~IL2CPPHookEngine() = default;

    IL2CPPConfig config_;
    void* il2cpp_handle_ = nullptr;
    bool is_initialized_ = false;
};

} // namespace duoverse::android::il2cpp
