#pragma once

#include <string>
#include <cstdint>
#include <optional>

namespace duoverse::net {

class RoomLobby {
public:
    // Encodes a 64-bit Steam Lobby ID or WebRTC peer hash into a 6-character alphanumeric room code
    // (e.g. "DUO-7K2" or "8X9Q2A")
    static std::string GenerateRoomCode(uint64_t session_id);

    // Decodes a 6-character room code back into its underlying 64-bit session identifier
    static std::optional<uint64_t> DecodeRoomCode(const std::string& room_code);

    // Validate room code format
    static bool IsValidRoomCode(const std::string& code);
};

} // namespace duoverse::net
