#pragma once

#include "export.hpp"
#include "packet.hpp"
#include <string>
#include <vector>
#include <functional>

namespace duoverse::net {

enum class TransportBackend {
    SteamDatagramRelay, // Available on PC / Steam
    WebRTCDataChannel,  // Universal across PC & Android
    DirectUDP           // Local LAN
};

struct PeerInfo {
    uint32_t peer_id;
    std::string display_name;
    PlatformType platform;
    TransportBackend transport;
    uint32_t ping_ms;
};

class DUOVERSE_API CrossPlayLobbyManager {
public:
    CrossPlayLobbyManager();
    ~CrossPlayLobbyManager();

    // Host initializes cross-play session (generates 6-digit room code)
    bool CreateCrossPlayLobby(std::string* out_room_code);

    // Join cross-play session from either PC or Android using the 6-digit room code
    bool JoinCrossPlayLobby(const std::string& room_code, PlatformType my_platform);

    // Send packet to all peers (or targeted peer)
    bool BroadcastPacket(const void* data, size_t length, bool reliable);
    bool SendToPeer(uint32_t peer_id, const void* data, size_t length, bool reliable);

    // Register callback for incoming packets from any cross-play peer
    using PacketCallback = std::function<void(const PeerInfo& sender, const PacketHeader& header, const uint8_t* payload, size_t payload_len)>;
    void SetPacketCallback(PacketCallback callback);

    const std::vector<PeerInfo>& GetConnectedPeers() const { return peers_; }
    const std::string& GetCurrentRoomCode() const { return current_room_code_; }
    bool IsHost() const { return is_host_; }

private:
    std::string current_room_code_;
    bool is_host_ = false;
    PlatformType local_platform_ = PlatformType::WindowsPC;
    std::vector<PeerInfo> peers_;
    PacketCallback on_packet_received_;
};

} // namespace duoverse::net
