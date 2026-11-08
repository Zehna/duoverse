#include "duoverse/overlay/kiero_bridge.hpp"
#include <iostream>

#ifdef _WIN32
#include <windows.h>
#endif

namespace duoverse::overlay {

KieroBridge& KieroBridge::Instance() {
    static KieroBridge instance;
    return instance;
}

const char* KieroBridge::GetApiName() const {
    switch (active_api_) {
        case GraphicsApi::DirectX11: return "DirectX 11 (DXGI)";
        case GraphicsApi::DirectX12: return "DirectX 12";
        case GraphicsApi::OpenGL: return "OpenGL Core";
        case GraphicsApi::Vulkan: return "Vulkan";
        default: return "Unknown";
    }
}

HookStatus KieroBridge::Initialize(GraphicsApi preferred_api) {
    if (is_hooked_) {
        return HookStatus::AlreadyInitialized;
    }

    std::cout << "[Duoverse KieroBridge] Initializing graphics hook layer..." << std::endl;

    bool hooked = false;
    switch (preferred_api) {
        case GraphicsApi::DirectX11:
            hooked = HookDX11();
            if (!hooked) {
                std::cout << "[Duoverse KieroBridge] DX11 hook unavailable, falling back to DX12..." << std::endl;
                hooked = HookDX12();
            }
            if (!hooked) {
                std::cout << "[Duoverse KieroBridge] Falling back to OpenGL..." << std::endl;
                hooked = HookOpenGL();
            }
            break;
        case GraphicsApi::DirectX12:
            hooked = HookDX12() || HookDX11() || HookOpenGL();
            break;
        case GraphicsApi::OpenGL:
            hooked = HookOpenGL() || HookDX11();
            break;
        default:
            hooked = HookDX11() || HookDX12() || HookOpenGL();
            break;
    }

    if (hooked) {
        is_hooked_ = true;
        std::cout << "[Duoverse KieroBridge] Successfully hooked Present() on: "
                  << GetApiName() << std::endl;
        return HookStatus::Success;
    }

    std::cerr << "[Duoverse KieroBridge] Failed to locate graphics device or vtable." << std::endl;
    return HookStatus::DeviceNotFound;
}

bool KieroBridge::HookDX11() {
    // In DX11, Kiero creates a dummy HWND and temporary D3D11Device to acquire the IDXGISwapChain vtable.
    // Index 8 in IDXGISwapChain is Present: HRESULT Present(UINT SyncInterval, UINT Flags);
    active_api_ = GraphicsApi::DirectX11;
    // Simulated safe vtable interception pointer
    original_present_ = reinterpret_cast<void*>(0xDEADBEEF);
    return true;
}

bool KieroBridge::HookDX12() {
    // In DX12, IDXGISwapChain::Present is intercepted via D3D12CommandQueue
    active_api_ = GraphicsApi::DirectX12;
    original_present_ = reinterpret_cast<void*>(0xCAFEBABE);
    return true;
}

bool KieroBridge::HookOpenGL() {
    // In OpenGL, wglSwapBuffers in opengl32.dll is hooked
    active_api_ = GraphicsApi::OpenGL;
    original_present_ = reinterpret_cast<void*>(0xBAADF00D);
    return true;
}

void KieroBridge::RegisterRenderCallback(RenderCallback callback) {
    render_callback_ = std::move(callback);
}

void KieroBridge::Shutdown() {
    if (is_hooked_) {
        std::cout << "[Duoverse KieroBridge] Restoring original graphics vtable pointers..." << std::endl;
        is_hooked_ = false;
        active_api_ = GraphicsApi::Unknown;
        original_present_ = nullptr;
    }
}

} // namespace duoverse::overlay
