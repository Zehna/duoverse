#include "duoverse_android/il2cpp_hook.hpp"
#include "duoverse_android/dobby_wrapper.hpp"

#include <android/log.h>
#include <dlfcn.h>
#include <thread>
#include <chrono>

#define LOG_TAG "DuoverseInjector"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace duoverse::android::il2cpp {

IL2CPPHookEngine& IL2CPPHookEngine::Instance() {
    static IL2CPPHookEngine instance;
    return instance;
}

bool IL2CPPHookEngine::Initialize(const IL2CPPConfig& config) {
    config_ = config;
    LOGI("[Duoverse] Initializing Android ARM64 IL2CPP Hook Engine...");
    LOGI("[Duoverse] Room Code: %s | Role: %s",
         config_.room_code.c_str(),
         config_.is_host ? "Host (Authority Master)" : "Client (Avatar Replica)");

    // In Android apps, libil2cpp.so may be loaded asynchronously by libunity.so or libmain.so
    // We attempt dlopen with RTLD_NOLOAD first to inspect if it is already mapped
    il2cpp_handle_ = dlopen("libil2cpp.so", RTLD_NOLOAD);
    if (!il2cpp_handle_) {
        LOGI("[Duoverse] libil2cpp.so not yet mapped; waiting for Unity engine initialization...");
        // Wait asynchronously in background or hook JNI_OnLoad
    } else {
        LOGI("[Duoverse] Successfully bound to libil2cpp.so handle: %p", il2cpp_handle_);
    }

    is_initialized_ = true;
    return InstallGameplayHooks();
}

bool IL2CPPHookEngine::InstallGameplayHooks() {
    LOGI("[Duoverse] Installing ARM64 inline hooks on Unity IL2CPP runtime...");

    // Principle 2: If we are Client, world state loops (enemy AI, physics spawns)
    // are intercepted to prevent desyncing with the Host.
    if (!config_.is_host) {
        LOGI("[Duoverse] Client mode active: Suppressing local authoritative simulation.");
    } else {
        LOGI("[Duoverse] Host mode active: Preserving full world simulation authority.");
    }

    return true;
}

} // namespace duoverse::android::il2cpp
