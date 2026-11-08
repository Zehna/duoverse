# Duoverse Desktop UI

The user-facing desktop application for **Duoverse**, built with **Tauri v2**, **React 18 / 19**, and **Tailwind CSS**.

---

## Features

- **Game Library Discovery:** Automatically scans installed Steam, GOG, and Epic Games libraries, detecting supported single-player games.
- **Profile Selector & Foundry Integration:** Pulls community and validated game profiles directly from `foundry/profiles/` and the Co-op Anything catalog.
- **Zero-Config Room Lobby:** Host or join lobbies using simple 6-character room codes powered by Steam Datagram Relay (Spacewar AppID 480) or WebRTC.
- **Live Injection & Safety Monitor:** Real-time visual feedback on anti-cheat detection, PE binary architecture verification (x86/x64), memory injection state, and network desync telemetry.

---

## Tech Stack

- **Desktop Framework:** [Tauri](https://tauri.app/) (Rust backend for low-level IPC, secure process execution, and native system integration).
- **Frontend Framework:** React + TypeScript + Vite.
- **Styling:** Tailwind CSS + Lucide Icons.

---

## Project Structure

```
apps/desktop-ui/
├── src/
│   ├── components/      # UI components (Library, Lobby, InjectorModal, Telemetry)
│   ├── hooks/           # Custom React hooks (IPC listeners, room state)
│   ├── types/           # TypeScript types for profiles, rooms, and injector status
│   ├── App.tsx          # Main launcher shell & navigation
│   └── main.tsx         # App entry point
├── src-tauri/
│   ├── src/             # Rust IPC command handlers linking to core/injector & core/netcode
│   ├── Cargo.toml       # Rust dependencies
│   └── tauri.conf.json  # Tauri app configuration
├── package.json
└── tsconfig.json
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- Rust toolchain (`cargo`, `rustc`)

### Development
```bash
# Install dependencies
npm install

# Start in development mode with hot reloading
npm run tauri dev
```
