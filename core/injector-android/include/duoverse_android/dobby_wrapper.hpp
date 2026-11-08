#pragma once

#include <cstdint>
#include <string>

namespace duoverse::android::hook {

// Abstraction layer for ARM64 inline hooking (Dobby Hook / Frida Gum)
class InlineHookManager {
public:
    static InlineHookManager& Instance();

    // Hooks target function pointer with replacement, storing trampoline to invoke original
    bool HookFunction(void* target_address, void* replacement_address, void** out_original_trampoline);

    // Unhooks a previously installed function hook
    bool UnhookFunction(void* target_address);

    // Resolve symbol from an already loaded shared object (e.g. libil2cpp.so)
    void* FindSymbol(const char* library_name, const char* symbol_name);

private:
    InlineHookManager() = default;
    ~InlineHookManager() = default;
};

} // namespace duoverse::android::hook
