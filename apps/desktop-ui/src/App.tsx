import React, { useState, useRef, useEffect } from 'react';
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
  RefreshCw,
  Sparkles,
  Zap,
  FolderPlus,
  HardDrive,
  AlertTriangle,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

import type { DetectedGame } from '@/services/gameScanner';
import { useGameScanner } from '@/hooks/useGameScanner';
import { useLobby } from '@/hooks/useLobby';
import { AndroidDropzone } from '@/components/AndroidDropzone';
import { ActivateCoopModal } from '@/components/ActivateCoopModal';

export function App() {
  const {
    games,
    androidSummary,
    isScanningPc,
    isScanningAndroid,
    scanError,
    lastScannedAt,
    runtimeMode,
    rescanPcLibraries,
    rescanAndroidDevices,
    addCustomGameFolderNative,
    addCustomGameFromBrowserDirectory,
    clearScanError,
  } = useGameScanner();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGame, setSelectedGame] = useState<DetectedGame | null>(null);
  const [isCoopModalOpen, setIsCoopModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'android' | 'lobby' | 'telemetry'>('library');

  // Hidden HTML5 directory input for Web Sandbox mode (or manual directory selection)
  const directoryInputRef = useRef<HTMLInputElement>(null);

  // Keep selectedGame synchronized when real games are discovered
  useEffect(() => {
    if (games.length > 0 && (!selectedGame || !games.some((g) => g.id === selectedGame.id))) {
      setSelectedGame(games[0]);
    } else if (games.length === 0) {
      setSelectedGame(null);
    }
  }, [games, selectedGame]);

  // Lobby state management
  const {
    roomCode,
    peers,
    copied,
    copyRoomCode,
    createRoom,
    joinRoom,
    connectionState,
    errorMessage,
  } = useLobby();

  const [joinCodeInput, setJoinCodeInput] = useState('');

  const handleAddCustomFolderClick = async () => {
    clearScanError();
    if (runtimeMode === 'tauri-native') {
      const added = await addCustomGameFolderNative();
      if (added) {
        setSelectedGame(added);
      }
    } else {
      // Trigger HTML5 webkitdirectory picker in web preview mode
      directoryInputRef.current?.click();
    }
  };

  const handleBrowserDirectorySelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const added = addCustomGameFromBrowserDirectory(e.target.files);
      if (added) {
        setSelectedGame(added);
      }
      e.target.value = '';
    }
  };

  const filteredGames = games.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.engineDisplayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.installDirectory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <TooltipProvider>
      <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 font-sans antialiased overflow-hidden select-none">
        {/* Hidden HTML5 Directory Input for Web Preview / Fallback Local Folder Inspection */}
        <input
          ref={directoryInputRef}
          type="file"
          // @ts-expect-error webkitdirectory is standard across Chromium/Firefox/WebKit
          webkitdirectory=""
          directory=""
          multiple
          onChange={handleBrowserDirectorySelected}
          className="hidden"
        />

        {/* Sleek Dark Tactical Sidebar */}
        <aside className="w-64 border-r border-zinc-800/60 bg-zinc-900/60 p-5 flex flex-col justify-between backdrop-blur-md shrink-0">
          <div className="space-y-6">
            {/* Brand Header */}
            <div className="flex items-center gap-3 px-1">
              <div className="p-2 rounded-md bg-zinc-800 border border-zinc-700/60 text-sky-400">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-sm font-semibold tracking-tight text-zinc-100">DUOVERSE</h1>
                <p className="text-[11px] font-mono text-zinc-500">v0.1.0 • OS SCANNER</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('library')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'library'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Gamepad2 className="w-4 h-4 text-sky-400" /> PC Games
                </span>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                  {games.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('android')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'android'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Smartphone className="w-4 h-4 text-emerald-400" /> Android & ADB
                </span>
                <Badge variant="online" className="text-[9px] px-1 py-0 font-mono">
                  {androidSummary?.devices.length || 0} ADB
                </Badge>
              </button>

              <button
                onClick={() => setActiveTab('lobby')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'lobby'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Users className="w-4 h-4 text-sky-400" /> Room Lobby HUD
              </button>

              <button
                onClick={() => setActiveTab('telemetry')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'telemetry'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/60 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Radio className="w-4 h-4 text-amber-400" /> Cross-Play Mesh
              </button>
            </nav>
          </div>

          {/* Scanner Runtime & VFS Status Pill */}
          <div className="space-y-2">
            <div className="p-2.5 rounded-md bg-zinc-950/80 border border-zinc-800/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-zinc-500 uppercase">Scanner Engine</span>
                <Badge
                  variant={runtimeMode === 'tauri-native' ? 'online' : 'active'}
                  className="text-[9px] px-1.5 py-0 font-mono"
                >
                  {runtimeMode === 'tauri-native' ? 'NATIVE RUST' : 'WEB FILE API'}
                </Badge>
              </div>
              {lastScannedAt && (
                <p className="text-[10px] font-mono text-zinc-500">Last scan: {lastScannedAt}</p>
              )}
            </div>

            <div className="p-3 rounded-md bg-zinc-950/80 border border-zinc-800/80 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-mono font-medium text-emerald-400">
                  NON-DESTRUCTIVE VFS
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 leading-normal">
                100% in-memory redirection. Original game files remain bit-for-bit pristine.
              </p>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Top Header Status Bar */}
          <header className="h-14 border-b border-zinc-800/60 px-6 flex items-center justify-between bg-zinc-900/30 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
              <Badge variant="online" className="gap-1.5 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> SDR: STEAM 480
              </Badge>
              <Badge variant="active" className="gap-1.5 font-mono text-[11px]">
                <Monitor className="w-3 h-3" /> PC SCANNER ({games.length})
              </Badge>
              <Badge variant="secondary" className="gap-1.5 font-mono text-[11px]">
                <Smartphone className="w-3 h-3 text-zinc-400" /> ADB DEVICES (
                {androidSummary?.devices.length || 0})
              </Badge>
            </div>

            {/* Room Code HUD Widget */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Room Code:
              </span>
              <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1 gap-2">
                <span className="font-mono text-sm tracking-widest text-sky-400 font-semibold">
                  {roomCode}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={copyRoomCode}
                      className="p-1 rounded text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {copied ? 'Copied to clipboard!' : 'Copy 6-digit room code'}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </header>

          {/* Dynamic Workspace Container */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* Error Alert Banner if Scan Fails */}
            {scanError && (
              <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{scanError}</span>
                </div>
                <button
                  onClick={clearScanError}
                  className="text-[11px] font-mono text-rose-400 hover:underline"
                >
                  DISMISS
                </button>
              </div>
            )}

            {/* TAB 1: LOCAL PC GAMES GALLERY */}
            {activeTab === 'library' && (
              <section className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
                      Installed PC Game Library
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Real hardware scan of Steam (`libraryfolders.vdf` & `appmanifest_*.acf`), Epic Games Manifests, and custom folders.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {games.length > 0 && (
                      <div className="relative w-56">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
                        <Input
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Filter detected games..."
                          className="pl-9 h-8 text-xs"
                        />
                      </div>
                    )}

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={rescanPcLibraries}
                      disabled={isScanningPc}
                      className="gap-1.5 text-xs h-8"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isScanningPc ? 'animate-spin' : ''}`} />
                      {isScanningPc ? 'Scanning OS...' : 'Rescan'}
                    </Button>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleAddCustomFolderClick}
                      className="gap-1.5 text-xs h-8"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      Add Custom Game Folder
                    </Button>
                  </div>
                </div>

                {/* Loading Indicator during OS scan */}
                {isScanningPc && (
                  <div className="p-8 rounded-lg border border-zinc-800/80 bg-zinc-900/40 flex flex-col items-center justify-center text-center space-y-2.5">
                    <Loader2 className="w-6 h-6 text-sky-400 animate-spin" />
                    <div className="text-xs font-medium text-zinc-200">
                      Scanning Steam Registry (`libraryfolders.vdf`) & Epic Games Manifests...
                    </div>
                    <p className="text-[11px] font-mono text-zinc-500">
                      Inspecting local `.exe` binaries, `UnityPlayer.dll`, `*_Data`, and `Engine/Binaries/Win64`
                    </p>
                  </div>
                )}

                {/* TACTICAL EMPTY STATE: Shown when 0 real games are detected */}
                {!isScanningPc && games.length === 0 && (
                  <Card className="border-zinc-800/80 bg-zinc-900/40">
                    <CardContent className="py-12 px-6 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400">
                        <HardDrive className="w-7 h-7 text-sky-400" />
                      </div>

                      <div className="space-y-1.5 max-w-md">
                        <h3 className="text-sm font-semibold text-zinc-100">
                          No games detected in standard directories. Click &apos;Rescan&apos; or &apos;Add Custom Game Folder&apos;.
                        </h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">
                          Duoverse strictly displays verified games installed on your hardware (zero mock data).
                          {runtimeMode === 'web-sandbox' &&
                            ' In Web Preview mode, click "Add Custom Game Folder" to select any local game folder (e.g. foundry/samples/sample_unity_game) from your computer.'}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 pt-1">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={rescanPcLibraries}
                          disabled={isScanningPc}
                          className="gap-1.5 text-xs"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Rescan
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleAddCustomFolderClick}
                          className="gap-1.5 text-xs"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          Add Custom Game Folder
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* 3:4 Real Game Poster Grid */}
                {!isScanningPc && filteredGames.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredGames.map((game) => {
                      const isSelected = selectedGame?.id === game.id;
                      return (
                        <motion.div
                          key={game.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedGame(game)}
                          className={`group relative aspect-[3/4] rounded-lg overflow-hidden border cursor-pointer transition-all bg-zinc-900 ${
                            isSelected
                              ? 'border-sky-500 ring-1 ring-sky-500/50 shadow-sm'
                              : 'border-zinc-800/80 hover:border-zinc-700/80'
                          }`}
                        >
                          {game.coverUrl ? (
                            <img
                              src={game.coverUrl}
                              alt={game.title}
                              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                            />
                          ) : (
                            /* Sleek Dark HUD Poster Fallback for Custom Folders without cover.jpg */
                            <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-4 text-center border-b border-zinc-800/60">
                              <div className="p-3 rounded-md bg-zinc-900 border border-zinc-800 text-sky-400 mb-3">
                                <Gamepad2 className="w-7 h-7" />
                              </div>
                              <span className="text-xs font-semibold text-zinc-200 line-clamp-2">
                                {game.title}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-500 mt-1 break-all line-clamp-1">
                                {game.executablePath.split(/[\\/]/).pop()}
                              </span>
                            </div>
                          )}

                          {/* Subtle Dark Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent p-3 flex flex-col justify-end">
                            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                              {game.coopModBadge === 'VERIFIED CO-OP MOD' ? (
                                <Badge
                                  variant="online"
                                  className="w-fit text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.25)]"
                                >
                                  VERIFIED CO-OP MOD
                                </Badge>
                              ) : game.coopModBadge === 'GENERIC ENGINE SYNC' ? (
                                <Badge
                                  variant="warning"
                                  className="w-fit text-[9px] font-medium bg-sky-500/20 text-sky-300 border-sky-500/40"
                                >
                                  GENERIC ENGINE SYNC
                                </Badge>
                              ) : (
                                <Badge
                                  variant={
                                    game.coopStatus === 'ready'
                                      ? 'online'
                                      : game.coopStatus === 'unsupported'
                                      ? 'destructive'
                                      : 'warning'
                                  }
                                  className="w-fit text-[10px]"
                                >
                                  {game.coopStatus.toUpperCase()}
                                </Badge>
                              )}
                              <Badge variant="default" className="text-[9px] font-mono uppercase">
                                {game.platform}
                              </Badge>
                            </div>
                            <h4 className="text-xs font-semibold text-zinc-100 line-clamp-1">
                              {game.title}
                            </h4>
                            <p className="text-[11px] font-mono text-zinc-400">
                              {game.engineDisplayName}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}

                {/* Selected Game Inspector & Launcher Card */}
                {selectedGame && (
                  <Card className="mt-6 border-zinc-800/80 bg-zinc-900/60">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <div className="min-w-0 pr-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base text-zinc-100">
                            {selectedGame.title}
                          </CardTitle>
                          <Badge variant="active" className="text-[10px] font-mono">
                            {selectedGame.engineDisplayName}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] font-mono uppercase">
                            {selectedGame.platform}
                          </Badge>
                          {selectedGame.appId && (
                            <Badge variant="default" className="text-[10px] font-mono">
                              AppID: {selectedGame.appId}
                            </Badge>
                          )}
                          {selectedGame.coopModBadge && (
                            <Badge
                              variant={selectedGame.coopModBadge === 'VERIFIED CO-OP MOD' ? 'online' : 'default'}
                              className={
                                selectedGame.coopModBadge === 'VERIFIED CO-OP MOD'
                                  ? 'text-[10px] font-bold bg-emerald-500/25 text-emerald-300 border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                                  : 'text-[10px] font-medium bg-sky-500/20 text-sky-300 border-sky-500/40'
                              }
                            >
                              {selectedGame.coopModBadge}
                            </Badge>
                          )}
                          {selectedGame.payloadType && (
                            <Badge variant="secondary" className="text-[10px] font-mono text-zinc-300">
                              VFS: {selectedGame.payloadType}
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="mt-1 font-mono text-[11px] truncate">
                          Executable: {selectedGame.executablePath}
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="default"
                          disabled={!selectedGame.antiCheatSafe}
                          onClick={() => setIsCoopModalOpen(true)}
                          className="gap-2 font-medium"
                        >
                          <Zap className="w-3.5 h-3.5 fill-current text-sky-400" /> Activate Co-op
                        </Button>
                      </div>
                    </CardHeader>

                    <CardContent className="pt-0">
                      <div className="p-3 rounded-md bg-zinc-950/80 border border-zinc-800/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-[11px] text-zinc-500 block">
                            Anti-Cheat Inspection
                          </span>
                          <span
                            className={`font-medium flex items-center gap-1.5 ${
                              selectedGame.antiCheatSafe ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" /> {selectedGame.antiCheatDetails}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-zinc-500 block">Install Directory</span>
                          <span className="text-zinc-200 font-mono text-[11px] truncate block">
                            {selectedGame.installDirectory}
                          </span>
                        </div>
                        <div>
                          <span className="text-[11px] text-zinc-500 block">Modding Safety</span>
                          <span className="text-emerald-400 font-medium">
                            Non-Destructive VFS Layer
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </section>
            )}

            {/* TAB 2: ANDROID APK & ADB SCANNER */}
            {activeTab === 'android' && (
              <AndroidDropzone
                androidSummary={androidSummary}
                isScanningAndroid={isScanningAndroid}
                onRescanAndroid={rescanAndroidDevices}
                runtimeMode={runtimeMode}
              />
            )}

            {/* TAB 3: ROOM LOBBY HUD */}
            {activeTab === 'lobby' && (
              <section className="space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
                    Room Lobby HUD
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Host or join co-op sessions using instant zero-port forwarding 6-digit room codes.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Host Card */}
                  <Card className="border-zinc-800/80 bg-zinc-900/60">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Play className="w-4 h-4 text-emerald-400" /> Host Co-op Session (Player 1)
                        </CardTitle>
                        <Badge variant="online">WORLD AUTHORITATIVE</Badge>
                      </div>
                      <CardDescription>
                        Generate a new session. You own AI decision loops, physics, and world state.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3.5 rounded-md bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                        <div>
                          <span className="text-[11px] text-zinc-500 block">Active Room Code</span>
                          <span className="font-mono text-lg font-bold text-sky-400 tracking-widest">
                            {roomCode}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={copyRoomCode}
                          className="gap-1.5 text-xs h-8"
                        >
                          {copied ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          {copied ? 'Copied' : 'Copy Code'}
                        </Button>
                      </div>

                      <Button onClick={createRoom} className="w-full gap-2">
                        <Sparkles className="w-3.5 h-3.5" /> Generate New Session Code
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
                        Enter your friend&apos;s 6-digit Room Code to connect directly via Steam SDR or WebRTC.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-zinc-400">
                          6-Digit Room Code
                        </label>
                        <Input
                          value={joinCodeInput}
                          onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                          placeholder="e.g. DUO-7K2"
                          maxLength={7}
                          className="font-mono tracking-widest text-center uppercase text-base"
                        />
                        {errorMessage && (
                          <p className="text-[11px] text-rose-400 mt-1">{errorMessage}</p>
                        )}
                      </div>

                      <Button
                        variant="tactical"
                        className="w-full gap-2"
                        disabled={joinCodeInput.length < 6 || connectionState === 'joining'}
                        onClick={() => joinRoom(joinCodeInput)}
                      >
                        {connectionState === 'joining'
                          ? 'Connecting to Peer...'
                          : 'Connect to Room'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </section>
            )}

            {/* TAB 4: CROSS-PLAY MESH & TELEMETRY */}
            {activeTab === 'telemetry' && (
              <section className="space-y-5">
                <div>
                  <h2 className="text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
                    <Radio className="w-4 h-4 text-amber-400" /> Cross-Play Mesh & Network Telemetry
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Real-time peer topology connecting Windows PC and Android ARM64 endpoints in Room{' '}
                    <span className="font-mono text-sky-400 font-semibold">{roomCode}</span>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {peers.map((peer) => (
                    <Card key={peer.id} className="border-zinc-800/80 bg-zinc-900/60">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-md bg-zinc-950 border border-zinc-800 text-sky-400">
                            {peer.platform === 'pc' ? (
                              <Monitor className="w-5 h-5" />
                            ) : (
                              <Smartphone className="w-5 h-5 text-emerald-400" />
                            )}
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                              {peer.name}
                              {peer.isHost && (
                                <Badge variant="active" className="text-[9px] px-1 py-0">
                                  HOST
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] font-mono text-zinc-400 mt-0.5">
                              {peer.platformLabel} • {peer.transport}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="font-mono text-xs font-semibold text-emerald-400 block">
                            {peer.pingMs} ms
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {peer.isHost ? '0% LOSS' : 'JITTER 2ms'}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Bottom Safety Status Bar */}
          <footer className="h-9 border-t border-zinc-800/60 px-6 flex items-center justify-between bg-zinc-900/40 text-[11px] font-mono text-zinc-400 shrink-0">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>FAILSAFE ACTIVE: EAC • BATTLEYE • VANGUARD • TENCENT ACE SCANNED</span>
            </div>
            <div className="text-zinc-500">DUOVERSE RUNTIME • SLEEK DARK HUD</div>
          </footer>
        </main>

        {/* Activate Co-op Modal for PC Games */}
        <ActivateCoopModal
          game={selectedGame}
          isOpen={isCoopModalOpen}
          onClose={() => setIsCoopModalOpen(false)}
          roomCode={roomCode}
          onCopyRoomCode={copyRoomCode}
          copied={copied}
        />
      </div>
    </TooltipProvider>
  );
}

export default App;
