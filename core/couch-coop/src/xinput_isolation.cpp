#include "duoverse/couch_coop.hpp"

namespace duoverse::couch {

static uint32_t s_current_instance = 1;

void XInputFilter::SetInstanceIndex(uint32_t instance_id) {
    s_current_instance = instance_id;
}

uint32_t XInputFilter::RemapUserIndex(uint32_t requested_index) {
    // Both game instances typically poll player index 0
    if (s_current_instance == 1) {
        // Instance 1 reads physical controller 0
        return requested_index;
    } else if (s_current_instance == 2) {
        // Instance 2 maps physical controller 1 to virtual controller 0
        if (requested_index == 0) {
            return 1;
        }
        return requested_index + 1;
    }
    return requested_index;
}

bool XInputFilter::ShouldIgnoreController(uint32_t requested_index) {
    // Ensure Game 1 ignores physical controller 1..3, and Game 2 ignores physical controller 0, 2..3
    if (s_current_instance == 1 && requested_index > 0) {
        return true;
    }
    if (s_current_instance == 2 && requested_index != 0) {
        return true;
    }
    return false;
}

} // namespace duoverse::couch
