#include "duoverse/crossplay.hpp"
#include "duoverse/lobby.hpp"

#include <iostream>
#include <algorithm>

namespace duoverse::net {

CrossPlayLobbyManager::CrossPlayLobbyManager() {
#if defined(__ANDROID__)
    local_platform_ = PlatformType::AndroidARM64;
#elif defined(_WIN32)
    local_platform_ = PlatformType::WindowsPC;
#else
    local_platform_ = PlatformType::LinuxProton;
#endif
}

CrossPlayLobbyManager::~CrossPlayLobbyManager() = default;

bool CrossPlayLobbyManager::CreateCrossPlayLobby(std::string* out_room_code) {
    is_host_ = true;
    // Generate 6-digit room code with session seed
    uint64_t session_seed = 0x5D3E8F1; // Example seed
    current_room_code_ = RoomLobby::GenerateRoomCode(session_seed);

    if (out_room_code) {
        *out_room_code = current_room_code_;
    }

    // Add local host to peers list
    PeerInfo host_info;
    host_info.peer_id = 1;
    host_info.display_name = (local_platform_ == PlatformType::WindowsPC) ? "Host (PC)" : "Host (Android)";
    host_info.platform = local_platform_;
    host_info.transport = (local_platform_ == PlatformType::WindowsPC) ? TransportBackend::SteamDatagramRelay : TransportBackend::WebRTCDataChannel;
    host_info.ping_ms = 0;
    peers_.push_back(host_info);

    return true;
}

bool CrossPlayLobbyManager::JoinCrossPlayLobby(const std::string& room_code, PlatformType my_platform) {
    if (!RoomLobby::IsValidRoomCode(room_code)) {
        return false;
    }

    is_host_ = false;
    current_room_code_ = room_code;
    local_platform_ = my_platform;

    // Connect via WebRTC signaling or SDR
    return true;
}

bool CrossPlayLobbyManager::BroadcastPacket(const void* data, size_t length, bool reliable) {
    if (!data || length == 0) return false;
    // Dispatch to WebRTC data channels and/or SDR transport
    return true;
}

bool CrossPlayLobbyManager::SendToPeer(uint32_t peer_id, const void* data, size_t length, bool reliable) {
    if (!data || length == 0) return false;
    return true;
}

void CrossPlayLobbyManager::SetPacketCallback(PacketCallback callback) {
    on_packet_received_ = std::move(callback);
}

} // namespace duoverse::net
