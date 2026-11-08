import { useState, useEffect } from 'react';
import {
  Gamepad2,
  SplitSquareVertical,
  SplitSquareHorizontal,
  Play,
  CheckCircle2,
  Monitor,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  type DetectedGame,
  calculateSplitLayout,
  launchCouchCoop,
  type SplitLayoutInfo,
} from '@/services/gameScanner';

interface CouchCoopTabProps {
  games: DetectedGame[];
  selectedGame: DetectedGame | null;
  onSelectGame: (game: DetectedGame) => void;
}

export function CouchCoopTab({ games, selectedGame, onSelectGame }: CouchCoopTabProps) {
  const [splitMode, setSplitMode] = useState<'Horizontal' | 'Vertical'>('Horizontal');
  const [resPreset, setResPreset] = useState<'1080p' | '1440p' | '4k'>('1080p');
  const [layout, setLayout] = useState<SplitLayoutInfo | null>(null);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchMessage, setLaunchMessage] = useState<string | null>(null);

  const getDims = () => {
    switch (resPreset) {
      case '1440p':
        return { w: 2560, h: 1440 };
      case '4k':
        return { w: 3840, h: 2160 };
      case '1080p':
      default:
        return { w: 1920, h: 1080 };
    }
  };

  useEffect(() => {
    const { w, h } = getDims();
    calculateSplitLayout(w, h, splitMode).then((l) => setLayout(l));
  }, [splitMode, resPreset]);

  const handleLaunch = async () => {
    if (!selectedGame) return;
    setIsLaunching(true);
    setLaunchMessage(null);

    const { w, h } = getDims();
    try {
      const res = await launchCouchCoop(selectedGame.executablePath, splitMode, w, h);
      setLaunchMessage(res.message);
    } catch (e: unknown) {
      setLaunchMessage(String(e));
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
              Couch Co-op & Split-Screen Multi-Instance
            </h2>
            <Badge variant="online" className="text-[10px] font-mono">
              PILAR 4
            </Badge>
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Run 2 isolated instances of the same game on 1 PC with dual-controller isolation and auto window tiling.
          </p>
        </div>
      </div>

      {/* Target Game Selector */}
      <Card className="border-zinc-800/80 bg-zinc-900/60">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase text-zinc-400">Target Game</span>
              <div className="flex items-center gap-2">
                <select
                  value={selectedGame?.id || ''}
                  onChange={(e) => {
                    const g = games.find((item) => item.id === e.target.value);
                    if (g) onSelectGame(g);
                  }}
                  className="bg-zinc-950 border border-zinc-800 text-zinc-100 text-xs rounded px-3 py-1.5 focus:outline-none focus:border-sky-500"
                >
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.title} ({g.engineDisplayName})
                    </option>
                  ))}
                </select>
                {selectedGame?.coopModBadge && (
                  <Badge variant="online" className="text-[10px] font-mono">
                    {selectedGame.coopModBadge}
                  </Badge>
                )}
              </div>
            </div>

            {/* Resolution Presets */}
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase text-zinc-400">Target Monitor</span>
              <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded border border-zinc-800">
                {(['1080p', '1440p', '4k'] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setResPreset(preset)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded transition ${
                      resPreset === preset
                        ? 'bg-zinc-800 text-sky-400 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {preset.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Split Mode Selector & Virtual Monitor Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="space-y-4">
          <Card className="border-zinc-800/80 bg-zinc-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-zinc-200">
                Window Tiling Layout
              </CardTitle>
              <CardDescription className="text-[11px] text-zinc-400">
                Select how the 2 game windows are tiled across the screen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => setSplitMode('Horizontal')}
                className={`w-full flex items-center justify-between p-3 rounded-md border text-left transition ${
                  splitMode === 'Horizontal'
                    ? 'border-sky-500/60 bg-sky-500/10 text-zinc-100 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <SplitSquareHorizontal className="w-5 h-5 text-sky-400" />
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">Horizontal Split</div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      Top & Bottom • {getDims().w} x {Math.floor(getDims().h / 2)} each
                    </div>
                  </div>
                </div>
                {splitMode === 'Horizontal' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
              </button>

              <button
                onClick={() => setSplitMode('Vertical')}
                className={`w-full flex items-center justify-between p-3 rounded-md border text-left transition ${
                  splitMode === 'Vertical'
                    ? 'border-sky-500/60 bg-sky-500/10 text-zinc-100 shadow-[0_0_12px_rgba(56,189,248,0.15)]'
                    : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <SplitSquareVertical className="w-5 h-5 text-emerald-400" />
                  <div>
                    <div className="text-xs font-semibold text-zinc-200">Vertical Split</div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      Left & Right • {Math.floor(getDims().w / 2)} x {getDims().h} each
                    </div>
                  </div>
                </div>
                {splitMode === 'Vertical' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
              </button>
            </CardContent>
          </Card>

          {/* Controller Isolation Card */}
          <Card className="border-zinc-800/80 bg-zinc-900/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                <Gamepad2 className="w-4 h-4 text-amber-400" />
                XInput Controller Isolation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-[11px] font-mono">
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                <span className="text-zinc-400">Player 1 (Host)</span>
                <Badge variant="online" className="text-[9px] px-1 py-0 font-mono">
                  GAMEPAD 0 (Direct)
                </Badge>
              </div>
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                <span className="text-zinc-400">Player 2 (Couch)</span>
                <Badge variant="active" className="text-[9px] px-1 py-0 font-mono">
                  GAMEPAD 1 → PAD 0 (Remapped)
                </Badge>
              </div>
              <p className="text-[10px] text-zinc-500 pt-1 leading-normal font-sans">
                Each game instance is locked to its own gamepad hook, preventing controller crosstalk.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monitor Visualizer Canvas Column */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-zinc-800/80 bg-zinc-900/60 h-full flex flex-col justify-between">
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-sky-400" />
                  Monitor Tiling Simulation ({getDims().w} × {getDims().h})
                </CardTitle>
                <CardDescription className="text-[11px] text-zinc-400">
                  Virtual viewports automatically bound to independent game processes.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="font-mono text-[10px]">
                MUTEX BYPASS: ACTIVE
              </Badge>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-center">
              {/* Virtual Bezel */}
              <div className="relative w-full aspect-video bg-zinc-950 rounded-lg border-2 border-zinc-800 p-2 shadow-2xl flex flex-col">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-800 px-3 py-0.5 rounded-full text-[9px] font-mono text-zinc-400">
                  PRIMARY MONITOR ({resPreset.toUpperCase()})
                </div>

                {layout && splitMode === 'Horizontal' && (
                  <div className="h-full w-full flex flex-col gap-1.5">
                    {/* Top Instance */}
                    <div className="flex-1 rounded border border-sky-500/40 bg-sky-500/5 p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <Badge variant="online" className="text-[9px] font-mono">
                          INSTANCE 1 • PLAYER 1
                        </Badge>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {layout.instance1.width} × {layout.instance1.height} (Y: {layout.instance1.y})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-sky-400">
                        <Gamepad2 className="w-4 h-4" /> Gamepad #0 (User Index 0)
                      </div>
                    </div>

                    {/* Bottom Instance */}
                    <div className="flex-1 rounded border border-emerald-500/40 bg-emerald-500/5 p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <Badge variant="active" className="text-[9px] font-mono">
                          INSTANCE 2 • PLAYER 2
                        </Badge>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {layout.instance2.width} × {layout.instance2.height} (Y: {layout.instance2.y})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                        <Gamepad2 className="w-4 h-4" /> Gamepad #1 (Remapped to 0)
                      </div>
                    </div>
                  </div>
                )}

                {layout && splitMode === 'Vertical' && (
                  <div className="h-full w-full flex flex-row gap-1.5">
                    {/* Left Instance */}
                    <div className="flex-1 rounded border border-sky-500/40 bg-sky-500/5 p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <Badge variant="online" className="text-[9px] font-mono">
                          P1 (LEFT)
                        </Badge>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {layout.instance1.width} × {layout.instance1.height}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-sky-400">
                        <Gamepad2 className="w-4 h-4" /> Gamepad #0
                      </div>
                    </div>

                    {/* Right Instance */}
                    <div className="flex-1 rounded border border-emerald-500/40 bg-emerald-500/5 p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between">
                        <Badge variant="active" className="text-[9px] font-mono">
                          P2 (RIGHT)
                        </Badge>
                        <span className="text-[10px] font-mono text-zinc-400">
                          {layout.instance2.width} × {layout.instance2.height}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-emerald-400">
                        <Gamepad2 className="w-4 h-4" /> Gamepad #1
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>

            {/* Launch Action */}
            <div className="p-4 pt-0">
              {launchMessage && (
                <div className="mb-3 p-2.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-sky-300 font-mono">
                  {launchMessage}
                </div>
              )}
              <Button
                variant="default"
                size="default"
                onClick={handleLaunch}
                disabled={isLaunching || !selectedGame}
                className="w-full gap-2 font-medium"
              >
                {isLaunching ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Spawning Dual Game Instances...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current text-sky-400" />
                    Launch Couch Co-op ({splitMode} Split)
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
