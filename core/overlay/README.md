# Duoverse In-Game Tactical HUD Overlay (`core/overlay`)

Universal in-game graphical overlay layer powered by DirectX 11, DirectX 12, and OpenGL interception based on the Kiero vtable hooking architecture and ImGui dark tactical styling.

---

## Architecture

```
core/overlay/
├── include/duoverse/overlay/
│   ├── kiero_bridge.hpp       # Universal graphics API vtable hook abstraction
│   └── overlay_renderer.hpp   # In-game HUD state machine, quick chat, & telemetry
├── src/
│   ├── kiero_bridge.cpp       # DX11 / DX12 / OpenGL Present() vtable intercepter
│   └── overlay_renderer.cpp   # Tactical dark theme HUD & hotkey listener
├── CMakeLists.txt
└── README.md
```

## Features

1. **Zero-Flicker Interception**:
   * Hooks `IDXGISwapChain::Present` on DirectX 11 and DirectX 12.
   * Fallback support for `wglSwapBuffers` on legacy OpenGL engines.

2. **Tactical In-Game HUD**:
   * **Hotkey Trigger**: `Shift + Tab` on keyboard or `Guide / Xbox button` on gamepad.
   * **Active Room Code**: 1-click clipboard copy with visual confirmation.
   * **Real-time Latency (Ping ms)**: Dynamic color indicator (Green <50ms, Yellow <100ms, Red >150ms).
   * **Quick Chat & Tactical Radio**: Quick communication between co-op players with pre-configured tactical pings.
