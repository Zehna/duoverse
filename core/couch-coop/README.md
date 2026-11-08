# Duoverse Couch Co-Op & Split-Screen Multi-Instance Engine

The `core/couch-coop` module enables running two isolated instances of the same game simultaneously on 1 PC with dual-gamepad isolation and split-screen window tiling.

## Features
- **Multi-Instance Process Spawner**: Launches separate game instances with isolated environment variables (`DUOVERSE_INSTANCE_ID=1` and `2`) and mutex evasion.
- **XInput Controller Isolation**:
  - Virtual hook ensures Game 1 receives only Gamepad 0 (User Index 0).
  - Game 2 remaps Gamepad 1 (User Index 1) to virtual Gamepad 0, eliminating controller crosstalk.
- **Window Tiler**: Automatically tiles game windows for Horizontal (Top/Bottom) or Vertical (Left/Right) layout based on monitor resolution.
