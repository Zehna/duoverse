#pragma once

#include <cstdint>
#include <vector>

namespace duoverse::net {

#pragma pack(push, 1)

enum class PacketType : uint8_t {
    Handshake = 0x01,
    HandshakeAck = 0x02,
    ClientInput = 0x10,
    HostWorldSnapshot = 0x20,
    EntityTransformSync = 0x21,
    EventTrigger = 0x30,
    Disconnect = 0xFF
};

struct PacketHeader {
    uint32_t magic = 0x44554F56; // 'DUOV'
    uint8_t protocol_version = 1;
    PacketType type;
    uint32_t sequence_number;
    uint32_t timestamp_ms;
};

// Client input frame (sent 60 Hz from client to host)
struct ClientInputPayload {
    float move_x;
    float move_y;
    float aim_x;
    float aim_y;
    uint32_t button_mask;
};

// Authoritative world snapshot (sent 20-30 Hz from host to client)
struct WorldSnapshotHeader {
    uint32_t tick_number;
    uint16_t entity_count;
};

#pragma pack(pop)

} // namespace duoverse::net
