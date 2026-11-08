import React, { useState } from 'react';
import { Gamepad2, ShieldCheck, Users, Radio, Play, AlertTriangle } from 'lucide-react';

export function App() {
  const [roomCode, setRoomCode] = useState('');
  const [selectedGame, setSelectedGame] = useState('Hollow Knight');

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/30">
              <Gamepad2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">DUOVERSE</h1>
              <span className="text-xs text-indigo-400 font-mono">v0.1.0-alpha</span>
            </div>
          </div>

          <nav className="space-y-1">
            <a href="#library" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-indigo-600/20 text-indigo-300 font-medium border border-indigo-500/30">
              <Gamepad2 className="w-4 h-4" /> Game Library
            </a>
            <a href="#lobby" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition">
              <Users className="w-4 h-4" /> Room Lobby
            </a>
            <a href="#safety" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 transition">
              <ShieldCheck className="w-4 h-4" /> Anti-Cheat Failsafe
            </a>
          </nav>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400 space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Non-Destructive VFS Active
          </div>
          <p className="text-[11px] text-slate-500">Original game files on disk are protected & untouched.</p>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex items-center justify-between pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-white">Co-op Launcher</h2>
            <p className="text-sm text-slate-400">Launch single-player games with Host-Authoritative multiplayer injection.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300">
              <Radio className="w-3.5 h-3.5 text-indigo-400" />
              SDR: AppID 480 (Spacewar)
            </div>
          </div>
        </header>

        {/* Quick Launch Panel */}
        <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Host Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-emerald-400" /> Host a Session (Player 1)
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              You will own the authoritative world simulation (AI, quests, physics).
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Target Game</label>
                <select
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="Hollow Knight">Hollow Knight (Unity BepInEx)</option>
                  <option value="Celeste">Celeste (MonoMod)</option>
                  <option value="Custom Unity Game">Custom Unity Game (PE Auto-detect)</option>
                </select>
              </div>

              <button className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-medium text-sm text-white shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2">
                <Play className="w-4 h-4 fill-current" /> Start Host & Generate Room Code
              </button>
            </div>
          </div>

          {/* Join Card */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" /> Join Session (Client)
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Enter the 6-digit Room Code to connect directly via SDR NAT traversal.
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">6-Digit Room Code</label>
                <input
                  type="text"
                  placeholder="e.g. DUO-7K2"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={7}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-sm font-mono tracking-widest text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button className="w-full py-2.5 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 font-medium text-sm text-slate-200 border border-slate-700 transition flex items-center justify-center gap-2">
                Connect to Host
              </button>
            </div>
          </div>
        </section>

        {/* Safety & Failsafe Status Banner */}
        <div className="mt-8 p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-slate-200">Active Anti-Cheat Failsafe Protection</h4>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              PE Analyzer actively scans for EAC, BattlEye, and Vanguard before any process injection. Injection is canceled automatically if kernel anti-cheat is present.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
