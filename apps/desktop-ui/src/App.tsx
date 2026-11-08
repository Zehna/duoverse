import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Gamepad2,
  ShieldCheck,
  Users,
  Radio,
  Play,
  Copy,
  Check,
  Smartphone,
  Monitor,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

interface GameItem {
  id: string;
  name: string;
  engine: string;
  poster: string;
  isInstalled: boolean;
  players: string;
  status: 'ready' | 'testing' | 'offline';
}

const SAMPLE_GAMES: GameItem[] = [
  {
    id: 'hollow_knight',
    name: 'Hollow Knight',
    engine: 'Unity (BepInEx)',
    poster: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    isInstalled: true,
    players: '1 - 4 Players',
    status: 'ready',
  },
  {
    id: 'celeste',
    name: 'Celeste',
    engine: 'MonoMod / C#',
    poster: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    isInstalled: true,
    players: '1 - 2 Players',
    status: 'ready',
  },
  {
    id: 'dead_cells',
    name: 'Dead Cells',
    engine: 'Heaps / Native',
    poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    isInstalled: false,
    players: '1 - 2 Players',
    status: 'testing',
  },
];

export function App() {
  const [selectedGame, setSelectedGame] = useState<GameItem>(SAMPLE_GAMES[0]);
  const [roomCode] = useState('DUO-7K2');
  const [copied, setCopied] = useState(false);
  const [joinInput, setJoinInput] = useState('');
  const [activeTab, setActiveTab] = useState('library');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <TooltipProvider>
      <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 font-sans antialiased overflow-hidden">
        {/* Sleek Sidebar HUD */}
        <aside className="w-64 border-r border-zinc-800/60 bg-zinc-900/60 p-5 flex flex-col justify-between backdrop-blur-md">
          <div className="space-y-6">
            {/* Brand Header */}
            <div className="flex items-center gap-3 px-1">
              <div className="p-2 rounded-md bg-zinc-800 border border-zinc-700/60 text-sky-400">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-zinc-100">DUOVERSE</h1>
                <p className="text-[11px] font-mono text-zinc-500">v0.1.0 • HUD RUNTIME</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('library')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'library'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Gamepad2 className="w-4 h-4 text-sky-400" /> Game Library
              </button>
              <button
                onClick={() => setActiveTab('lobby')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'lobby'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Users className="w-4 h-4 text-emerald-400" /> Room Lobby
              </button>
              <button
                onClick={() => setActiveTab('crossplay')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'crossplay'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850/50'
                }`}
              >
                <Radio className="w-4 h-4 text-amber-400" /> Cross-Play Bridge
              </button>
            </nav>
          </div>

          {/* Non-Destructive VFS Status Pill */}
          <div className="p-3 rounded-md bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-mono font-medium text-emerald-400">VFS RUNTIME ACTIVE</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Zero-disk modification. Target binaries remain 100% pristine.
            </p>
          </div>
        </aside>

        {/* Main Workspace HUD */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Status Bar */}
          <header className="h-14 border-b border-zinc-800/60 px-6 flex items-center justify-between bg-zinc-900/30 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="online" className="gap-1.5 font-mono text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> SDR: STEAM 480
                </Badge>
                <Badge variant="active" className="gap-1.5 font-mono text-[11px]">
                  <Monitor className="w-3 h-3" /> PC x86_64
                </Badge>
                <Badge variant="secondary" className="gap-1.5 font-mono text-[11px]">
                  <Smartphone className="w-3 h-3 text-zinc-400" /> ANDROID ARM64 READY
                </Badge>
              </div>
            </div>

            {/* Room Code HUD Widget */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Room Code:</span>
              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1 gap-2">
                <span className="font-mono text-sm tracking-widest text-sky-400 font-semibold">{roomCode}</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={handleCopyCode}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copied ? 'Copied to clipboard!' : 'Copy 6-digit room code'}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </header>

          {/* Dynamic Content Area */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {activeTab === 'library' && (
              <section className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-100 tracking-tight">Installed Game Catalog</h2>
                    <p className="text-xs text-zinc-400">Select a single-player game to launch Host-Authority co-op injection.</p>
                  </div>
                  <div className="relative w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
                    <Input placeholder="Filter installed games..." className="pl-9 h-8 text-xs" />
                  </div>
                </div>

                {/* 3:4 Game Poster Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {SAMPLE_GAMES.map((game) => {
                    const isSelected = selectedGame.id === game.id;
                    return (
                      <motion.div
                        key={game.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedGame(game)}
                        className={`group relative aspect-[3/4] rounded-lg overflow-hidden border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-sky-500 ring-1 ring-sky-500/50'
                            : 'border-zinc-800/80 hover:border-zinc-700/80'
                        }`}
                      >
                        <img
                          src={game.poster}
                          alt={game.name}
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                        />

                        {/* Subtle Dark Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-3 flex flex-col justify-end">
                          <Badge
                            variant={game.status === 'ready' ? 'online' : 'warning'}
                            className="w-fit text-[10px] mb-1.5"
                          >
                            {game.status.toUpperCase()}
                          </Badge>
                          <h4 className="text-xs font-semibold text-zinc-100 line-clamp-1">{game.name}</h4>
                          <p className="text-[11px] font-mono text-zinc-400">{game.engine}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Selected Game Details Panel */}
                <Card className="mt-6 border-zinc-800/80 bg-zinc-900/60">
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base text-zinc-100">{selectedGame.name}</CardTitle>
                        <Badge variant="active" className="text-[10px] font-mono">
                          {selectedGame.engine}
                        </Badge>
                      </div>
                      <CardDescription className="mt-1">
                        Host-Authority topology with local avatar replication. Zero-disk files overwritten.
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="default" className="gap-2 font-medium">
                        <Play className="w-3.5 h-3.5 fill-current" /> Launch Host Session
                      </Button>
                      <Button variant="secondary" className="gap-2">
                        Profile Config
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              </section>
            )}

            {activeTab === 'lobby' && (
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Host Card */}
                <Card className="border-zinc-800/80 bg-zinc-900/60">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Play className="w-4 h-4 text-emerald-400" /> Host Co-op Session (Player 1)
                      </CardTitle>
                      <Badge variant="online">AUTHORITATIVE</Badge>
                    </div>
                    <CardDescription>
                      You will compute AI decisions, world state, and physics. Remote peers stream inputs to you.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-3 rounded-md bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-zinc-500 block">Assigned Room Code</span>
                        <span className="font-mono text-lg font-semibold text-sky-400 tracking-wider">{roomCode}</span>
                      </div>
                      <Button size="sm" variant="secondary" onClick={handleCopyCode} className="gap-1.5 text-xs">
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? 'Copied' : 'Copy'}
                      </Button>
                    </div>

                    <Button className="w-full gap-2">
                      <Play className="w-4 h-4 fill-current" /> Start Host & Open Lobby
                    </Button>
                  </CardContent>
                </Card>

                {/* Join Card */}
                <Card className="border-zinc-800/80 bg-zinc-900/60">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="w-4 h-4 text-sky-400" /> Join Peer Session (Client)
                      </CardTitle>
                      <Badge variant="secondary">AVATAR STREAM</Badge>
                    </div>
                    <CardDescription>
                      Enter your friend's 6-digit Room Code to connect directly via Steam SDR or WebRTC.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-zinc-400">Room Code</label>
                      <Input
                        value={joinInput}
                        onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                        placeholder="e.g. DUO-7K2"
                        maxLength={7}
                        className="font-mono tracking-widest text-center uppercase text-base"
                      />
                    </div>

                    <Button variant="tactical" className="w-full gap-2" disabled={joinInput.length < 6}>
                      Connect to Host
                    </Button>
                  </CardContent>
                </Card>
              </section>
            )}

            {activeTab === 'crossplay' && (
              <section className="space-y-5">
                <Card className="border-zinc-800/80 bg-zinc-900/60">
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Radio className="w-4 h-4 text-amber-400" /> Cross-Play Mesh Network Status
                    </CardTitle>
                    <CardDescription>
                      Real-time peer topology bridging Windows PC and Android ARM64 endpoints.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-md bg-zinc-950 border border-zinc-800/80">
                      <div className="flex items-center gap-3">
                        <Monitor className="w-4 h-4 text-sky-400" />
                        <div>
                          <div className="text-xs font-medium text-zinc-200">Local PC Host (You)</div>
                          <div className="text-[11px] font-mono text-zinc-500">Windows x86_64 • Steam SDR Relay 480</div>
                        </div>
                      </div>
                      <Badge variant="online" className="font-mono text-[11px]">0 ms • AUTHORITATIVE</Badge>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-md bg-zinc-950 border border-zinc-800/80">
                      <div className="flex items-center gap-3">
                        <Smartphone className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="text-xs font-medium text-zinc-200">Android Peer 1 (Guest)</div>
                          <div className="text-[11px] font-mono text-zinc-500">Android ARM64 • WebRTC DataChannel (STUN)</div>
                        </div>
                      </div>
                      <Badge variant="online" className="font-mono text-[11px]">28 ms • SYNCED</Badge>
                    </div>
                  </CardContent>
                </Card>
              </section>
            )}
          </div>

          {/* Bottom Safety Status Bar */}
          <footer className="h-9 border-t border-zinc-800/60 px-6 flex items-center justify-between bg-zinc-900/40 text-[11px] font-mono text-zinc-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>ANTI-CHEAT FAILSAFE: ACTIVE (EAC / BATTLEYE / VANGUARD / ACE SCANNED)</span>
            </div>
            <div className="text-zinc-500">
              ZERO-SLOP DESIGN SYSTEM • TAILWIND + FRAMER MOTION
            </div>
          </footer>
        </main>
      </div>
    </TooltipProvider>
  );
}

export default App;
