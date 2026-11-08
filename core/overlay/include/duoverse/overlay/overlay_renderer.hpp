#pragma once

#include "kiero_bridge.hpp"
#include <string>
#include <vector>
#include <chrono>

namespace duoverse::overlay {

struct ChatMessage {
    std::string sender;
    std::string text;
    uint32_t timestamp_ms;
    bool is_system = false;
};

enum class ConnectionQuality : uint8_t {
    Excellent, // < 50ms (Green)
    Good,      // 50-100ms (Yellow-Green)
    Moderate,  // 100-150ms (Yellow)
    Poor       // > 150ms (Red)
};

// ImGui-based Tactical Dark HUD Overlay rendered directly in the game's viewport
class OverlayRenderer {
public:
    static OverlayRenderer& Instance();

    // Initialize ImGui context and Dark Tactical theme styling
    bool Initialize(void* window_handle, GraphicsApi api);

    // Toggle HUD visibility (called on Shift+Tab or Controller Guide button)
    void ToggleVisibility();
    bool IsVisible() const { return is_visible_; }
    void SetVisible(bool visible) { is_visible_ = visible; }

    // Update real-time session telemetry
    void SetRoomCode(const std::string& room_code) { room_code_ = room_code; }
    void SetPingMs(uint32_t ping_ms);
    void SetPeerStatus(const std::string& status) { peer_status_ = status; }

    // Quick chat & messaging
    void AddChatMessage(const std::string& sender, const std::string& text, bool is_system = false);
    void SendQuickChat(int preset_index);

    // Render frame called by the Kiero Present() hook
    void RenderFrame();

    // Input message hook for handling Shift+Tab or Guide button
    bool ProcessInputEvent(uint32_t msg, uint64_t wparam, int64_t lparam);

    // Clipboard copy helper
    void CopyRoomCodeToClipboard();

    uint32_t GetCurrentPing() const { return current_ping_ms_; }
    ConnectionQuality GetConnectionQuality() const { return connection_quality_; }
    const std::string& GetRoomCode() const { return room_code_; }

private:
    OverlayRenderer();
    ~OverlayRenderer() = default;

    void ApplyTacticalDarkTheme();
    void RenderTacticalHud();
    void RenderQuickChatPanel();

    bool is_initialized_ = false;
    bool is_visible_ = false;
    void* window_handle_ = nullptr;
    GraphicsApi graphics_api_ = GraphicsApi::Unknown;

    std::string room_code_ = "DUO-8821";
    uint32_t current_ping_ms_ = 28;
    ConnectionQuality connection_quality_ = ConnectionQuality::Excellent;
    std::string peer_status_ = "CONNECTED (P2P Mesh)";

    std::vector<ChatMessage> chat_history_;
    char chat_input_buffer_[256] = {};

    bool shift_pressed_ = false;
    bool just_copied_room_ = false;
    std::chrono::steady_clock::time_point copy_feedback_time_;
};

} // namespace duoverse::overlay
