#!/usr/bin/env python3
"""
foundry/tests/test_splitscreen_layout.py
Verifies window coordinate calculation and XInput controller isolation logic
for Pillar 4 (Couch Co-Op & Split-Screen Multi-Instance).
"""

import unittest

def calculate_split_layout(monitor_width: int, monitor_height: int, mode: str) -> dict:
    is_horizontal = mode.lower() == "horizontal"
    if is_horizontal:
        half_h = monitor_height // 2
        return {
            "mode": "Horizontal",
            "instance1": {
                "x": 0,
                "y": 0,
                "width": monitor_width,
                "height": half_h
            },
            "instance2": {
                "x": 0,
                "y": half_h,
                "width": monitor_width,
                "height": monitor_height - half_h
            }
        }
    else:
        half_w = monitor_width // 2
        return {
            "mode": "Vertical",
            "instance1": {
                "x": 0,
                "y": 0,
                "width": half_w,
                "height": monitor_height
            },
            "instance2": {
                "x": half_w,
                "y": 0,
                "width": monitor_width - half_w,
                "height": monitor_height
            }
        }

class XInputFilterSimulator:
    """Simulates XInput isolation in core/couch-coop/src/xinput_isolation.cpp"""
    def __init__(self, instance_id: int):
        self.instance_id = instance_id

    def remap_user_index(self, requested_index: int) -> int:
        if self.instance_id == 1:
            return requested_index
        elif self.instance_id == 2:
            if requested_index == 0:
                return 1
            return requested_index + 1
        return requested_index

    def should_ignore_controller(self, requested_index: int) -> bool:
        if self.instance_id == 1 and requested_index > 0:
            return True
        if self.instance_id == 2 and requested_index != 0:
            return True
        return False


class TestSplitScreenLayout(unittest.TestCase):
    def test_horizontal_1080p(self):
        res = calculate_split_layout(1920, 1080, "Horizontal")
        inst1 = res["instance1"]
        inst2 = res["instance2"]

        # Instance 1: Top half
        self.assertEqual(inst1["x"], 0)
        self.assertEqual(inst1["y"], 0)
        self.assertEqual(inst1["width"], 1920)
        self.assertEqual(inst1["height"], 540)

        # Instance 2: Bottom half
        self.assertEqual(inst2["x"], 0)
        self.assertEqual(inst2["y"], 540)
        self.assertEqual(inst2["width"], 1920)
        self.assertEqual(inst2["height"], 540)

        # Total coverage
        self.assertEqual(inst1["height"] + inst2["height"], 1080)

    def test_vertical_1080p(self):
        res = calculate_split_layout(1920, 1080, "Vertical")
        inst1 = res["instance1"]
        inst2 = res["instance2"]

        # Instance 1: Left half
        self.assertEqual(inst1["x"], 0)
        self.assertEqual(inst1["y"], 0)
        self.assertEqual(inst1["width"], 960)
        self.assertEqual(inst1["height"], 1080)

        # Instance 2: Right half
        self.assertEqual(inst2["x"], 960)
        self.assertEqual(inst2["y"], 0)
        self.assertEqual(inst2["width"], 960)
        self.assertEqual(inst2["height"], 1080)

        # Total coverage
        self.assertEqual(inst1["width"] + inst2["width"], 1920)

    def test_high_resolutions_1440p_and_4k(self):
        # 1440p Horizontal
        res_1440 = calculate_split_layout(2560, 1440, "Horizontal")
        self.assertEqual(res_1440["instance1"]["height"], 720)
        self.assertEqual(res_1440["instance2"]["height"], 720)

        # 4K Vertical
        res_4k = calculate_split_layout(3840, 2160, "Vertical")
        self.assertEqual(res_4k["instance1"]["width"], 1920)
        self.assertEqual(res_4k["instance2"]["width"], 1920)

    def test_odd_dimensions_no_pixel_loss(self):
        # Test uneven dimension (e.g. 1921 x 1081)
        res = calculate_split_layout(1921, 1081, "Horizontal")
        self.assertEqual(
            res["instance1"]["height"] + res["instance2"]["height"],
            1081
        )

        res_v = calculate_split_layout(1921, 1081, "Vertical")
        self.assertEqual(
            res_v["instance1"]["width"] + res_v["instance2"]["width"],
            1921
        )

    def test_xinput_controller_isolation(self):
        filter_p1 = XInputFilterSimulator(instance_id=1)
        filter_p2 = XInputFilterSimulator(instance_id=2)

        # Game 1 queries gamepad 0 -> Receives physical gamepad 0
        self.assertEqual(filter_p1.remap_user_index(0), 0)
        self.assertFalse(filter_p1.should_ignore_controller(0))
        # Game 1 ignores physical gamepad 1
        self.assertTrue(filter_p1.should_ignore_controller(1))

        # Game 2 queries gamepad 0 -> Remapped to read physical gamepad 1
        self.assertEqual(filter_p2.remap_user_index(0), 1)
        self.assertFalse(filter_p2.should_ignore_controller(0))
        # Game 2 ignores non-zero requests to avoid crosstalk
        self.assertTrue(filter_p2.should_ignore_controller(1))


if __name__ == "__main__":
    unittest.main()
