#pragma once

#include "export.hpp"
#include <cstdint>
#include <vector>

namespace duoverse::net {

#pragma pack(push, 1)

enum class PlatformType : uint8_t {
    WindowsPC = 0x01,
    AndroidARM64 = 0x02,
    AndroidARM32 = 0x03,
    LinuxProton = 0x04
};

enum class PacketType : uint8_t {
    Handshake = 0x01,
    HandshakeAck = 0x02,
    ClientInput = 0x10,
    ClientTouchInput = 0x11,
    HostWorldSnapshot = 0x20,
    EntityTransformSync = 0x21,
    EventTrigger = 0x30,
    Disconnect = 0xFF
};

struct PacketHeader {
    uint32_t magic = 0x44554F56; // 'DUOV'
    uint8_t protocol_version = 2; // v2: Multiplatform cross-play
    PacketType type;
    PlatformType source_platform;
    uint32_t sequence_number;
    uint32_t timestamp_ms;
};

// Client input frame (sent 60 Hz from client PC/Android to host)
struct ClientInputPayload {
    float move_x;        // -1.0 to 1.0 (analog stick or WASD)
    float move_y;        // -1.0 to 1.0
    float aim_x;         // -1.0 to 1.0 (mouse / right touch stick)
    float aim_y;         // -1.0 to 1.0
    uint32_t button_mask;// Bitmask of action buttons (Jump, Attack, Dash, Use)
};

// Mobile-specific touch pointer event (for games with touch UI)
struct ClientTouchPayload {
    uint8_t pointer_id;  // Touch finger index (0..9)
    uint8_t phase;       // 0: Began, 1: Moved, 2: Ended, 3: Canceled
    float normalized_x;  // 0.0 to 1.0 screen coordinate
    float normalized_y;  // 0.0 to 1.0 screen coordinate
    float pressure;
};

// Authoritative world snapshot (sent 20-30 Hz from host to clients)
struct WorldSnapshotHeader {
    uint32_t tick_number;
    uint16_t entity_count;
};

#pragma pack(pop)

} // namespace duoverse::net
