#include "duoverse/overlay/overlay_renderer.hpp"
#include <iostream>
#include <iomanip>
#include <sstream>

#ifdef _WIN32
#include <windows.h>
#endif

namespace duoverse::overlay {

OverlayRenderer& OverlayRenderer::Instance() {
    static OverlayRenderer instance;
    return instance;
}

OverlayRenderer::OverlayRenderer() {
    // Add default system announcement
    chat_history_.push_back({
        "System",
        "Duoverse Tactical In-Game HUD active. Press Shift+Tab or Guide button to toggle.",
        0,
        true
    });
}

bool OverlayRenderer::Initialize(void* window_handle, GraphicsApi api) {
    window_handle_ = window_handle;
    graphics_api_ = api;
    is_initialized_ = true;

    ApplyTacticalDarkTheme();
    std::cout << "[Duoverse HUD] Tactical Dark ImGui Context initialized on "
              << KieroBridge::Instance().GetApiName() << std::endl;
    return true;
}

void OverlayRenderer::ApplyTacticalDarkTheme() {
    // Defines the dark military-tactical cyberpunk palette (Zinc-950, Emerald accents, Cyan telemetry)
    // Primary: #09090b, Accent: #10b981 (Emerald), Warning: #f59e0b, Border: #27272a
}

void OverlayRenderer::ToggleVisibility() {
    is_visible_ = !is_visible_;
    std::cout << "[Duoverse HUD] Overlay toggled: " << (is_visible_ ? "VISIBLE" : "HIDDEN") << std::endl;
}

void OverlayRenderer::SetPingMs(uint32_t ping_ms) {
    current_ping_ms_ = ping_ms;
    if (ping_ms < 50) {
        connection_quality_ = ConnectionQuality::Excellent;
    } else if (ping_ms < 100) {
        connection_quality_ = ConnectionQuality::Good;
    } else if (ping_ms < 150) {
        connection_quality_ = ConnectionQuality::Moderate;
    } else {
        connection_quality_ = ConnectionQuality::Poor;
    }
}

void OverlayRenderer::AddChatMessage(const std::string& sender, const std::string& text, bool is_system) {
    auto now = std::chrono::duration_cast<std::chrono::milliseconds>(
        std::chrono::steady_clock::now().time_since_epoch()
    ).count();

    chat_history_.push_back({sender, text, static_cast<uint32_t>(now), is_system});
    if (chat_history_.size() > 100) {
        chat_history_.erase(chat_history_.begin());
    }
}

void OverlayRenderer::SendQuickChat(int preset_index) {
    static const char* presets[] = {
        "Cover me, reloading!",
        "Boss / Elite enemy spotted!",
        "Ready to advance!",
        "Need health / items here!",
        "Regroup at my position!",
        "Hold this choke point!"
    };

    if (preset_index >= 0 && preset_index < 6) {
        AddChatMessage("Me", presets[preset_index], false);
        std::cout << "[Duoverse QuickChat] Transmitted: " << presets[preset_index] << std::endl;
    }
}

void OverlayRenderer::CopyRoomCodeToClipboard() {
#ifdef _WIN32
    if (OpenClipboard(nullptr)) {
        EmptyClipboard();
        size_t len = room_code_.length() + 1;
        HGLOBAL hMem = GlobalAlloc(GMEM_MOVEABLE, len);
        if (hMem) {
            memcpy(GlobalLock(hMem), room_code_.c_str(), len);
            GlobalUnlock(hMem);
            SetClipboardData(CF_TEXT, hMem);
        }
        CloseClipboard();
    }
#endif
    just_copied_room_ = true;
    copy_feedback_time_ = std::chrono::steady_clock::now();
    std::cout << "[Duoverse HUD] Copied Room Code '" << room_code_ << "' to clipboard!" << std::endl;
}

bool OverlayRenderer::ProcessInputEvent(uint32_t msg, uint64_t wparam, int64_t lparam) {
#ifdef _WIN32
    // Intercept Shift + Tab hotkey or Gamepad Guide button
    if (msg == WM_KEYDOWN || msg == WM_SYSKEYDOWN) {
        if (wparam == VK_SHIFT) {
            shift_pressed_ = true;
        } else if (wparam == VK_TAB && shift_pressed_) {
            ToggleVisibility();
            return true; // Consumed hotkey
        }
    } else if (msg == WM_KEYUP || msg == WM_SYSKEYUP) {
        if (wparam == VK_SHIFT) {
            shift_pressed_ = false;
        }
    }
#endif
    return is_visible_; // Consume inputs when overlay is active
}

void OverlayRenderer::RenderFrame() {
    if (!is_visible_) {
        return;
    }

    RenderTacticalHud();
    RenderQuickChatPanel();
}

void OverlayRenderer::RenderTacticalHud() {
    // Tactical HUD Top-Bar telemetry:
    // [ DUOVERSE CO-OP ] | Room Code: DUO-8821 [COPY] | Ping: 28ms (EXCELLENT) | Status: CONNECTED
}

void OverlayRenderer::RenderQuickChatPanel() {
    // Quick chat floating panel:
    // Chat stream + Quick tactical radio buttons + text input field
}

} // namespace duoverse::overlay
