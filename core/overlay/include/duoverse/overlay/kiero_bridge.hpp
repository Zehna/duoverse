#pragma once

#include <cstdint>
#include <string>
#include <functional>

namespace duoverse::overlay {

enum class GraphicsApi : uint8_t {
    Unknown = 0,
    DirectX11 = 1,
    DirectX12 = 2,
    OpenGL = 3,
    Vulkan = 4
};

enum class HookStatus : uint8_t {
    NotInitialized = 0,
    Success = 1,
    AlreadyInitialized = 2,
    HookMethodFailed = 3,
    DeviceNotFound = 4
};

// Universal graphics hook bridge based on Kiero vtable interception.
// Hooks IDXGISwapChain::Present (DX11/DX12) or wglSwapBuffers (OpenGL).
class KieroBridge {
public:
    static KieroBridge& Instance();

    // Initializes graphics subsystem detection and binds vtable pointers
    HookStatus Initialize(GraphicsApi preferred_api = GraphicsApi::DirectX11);

    // Binds a render callback that executes inside the Present() swapchain context
    using RenderCallback = std::function<void(void* swapchain_or_device, GraphicsApi api)>;
    void RegisterRenderCallback(RenderCallback callback);

    // Detaches hooks and restores original vtable function pointers
    void Shutdown();

    // Query active state
    bool IsHooked() const { return is_hooked_; }
    GraphicsApi GetActiveApi() const { return active_api_; }
    const char* GetApiName() const;

private:
    KieroBridge() = default;
    ~KieroBridge() { Shutdown(); }

    bool HookDX11();
    bool HookDX12();
    bool HookOpenGL();

    bool is_hooked_ = false;
    GraphicsApi active_api_ = GraphicsApi::Unknown;
    RenderCallback render_callback_;
    void* original_present_ = nullptr;
};

} // namespace duoverse::overlay
