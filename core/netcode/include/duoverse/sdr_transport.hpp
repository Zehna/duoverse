#pragma once

#include <string>
#include <cstdint>
#include <functional>

namespace duoverse::net {

// Default AppID for Steam Datagram Relay peer discovery
constexpr uint32_t STEAM_SPACEWAR_APP_ID = 480;

enum class ConnectionState {
    Disconnected,
    Connecting,
    Connected,
    Failed
};

class SDRTransport {
public:
    SDRTransport();
    ~SDRTransport();

    // Initialize Steamworks API using AppID 480
    bool Initialize();

    // Host creates a lobby session and generates a 6-digit room code
    bool CreateLobby(std::string* out_room_code);

    // Client connects to host using a 6-digit room code
    bool JoinLobby(const std::string& room_code);

    // Send packet reliably or unreliably via SDR
    bool SendPacket(const void* data, size_t length, bool reliable);

    // Poll inbound packets
    void PollEvents();

    ConnectionState GetState() const { return state_; }

private:
    ConnectionState state_ = ConnectionState::Disconnected;
    uint64_t current_lobby_id_ = 0;
};

} // namespace duoverse::net
