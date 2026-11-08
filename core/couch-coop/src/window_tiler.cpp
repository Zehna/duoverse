#include "duoverse/couch_coop.hpp"

namespace duoverse::couch {

SplitLayout CalculateLayout(int32_t monitor_width, int32_t monitor_height, SplitMode mode) {
    SplitLayout layout;

    if (mode == SplitMode::Horizontal) {
        int32_t half_h = monitor_height / 2;
        
        layout.instance_1.x = 0;
        layout.instance_1.y = 0;
        layout.instance_1.width = monitor_width;
        layout.instance_1.height = half_h;

        layout.instance_2.x = 0;
        layout.instance_2.y = half_h;
        layout.instance_2.width = monitor_width;
        layout.instance_2.height = monitor_height - half_h;
    } else { // Vertical
        int32_t half_w = monitor_width / 2;

        layout.instance_1.x = 0;
        layout.instance_1.y = 0;
        layout.instance_1.width = half_w;
        layout.instance_1.height = monitor_height;

        layout.instance_2.x = half_w;
        layout.instance_2.y = 0;
        layout.instance_2.width = monitor_width - half_w;
        layout.instance_2.height = monitor_height;
    }

    return layout;
}

} // namespace duoverse::couch
