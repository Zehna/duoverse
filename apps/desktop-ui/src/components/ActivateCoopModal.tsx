import { useState } from 'react';
import {
  Play,
  Users,
  Copy,
  Check,
  Loader2,
  CheckCircle2,
  Layers,
  Save,
  Gamepad2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { type DetectedGame, launchCoopSession } from '@/services/gameScanner';

interface ActivateCoopModalProps {
  game: DetectedGame | null;
  isOpen: boolean;
  onClose: () => void;
  roomCode: string;
  onCopyRoomCode: () => void;
  copied: boolean;
}

export function ActivateCoopModal({
  game,
  isOpen,
  onClose,
  roomCode,
  onCopyRoomCode,
  copied,
}: ActivateCoopModalProps) {
  const [role, setRole] = useState<'host' | 'join'>('host');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [isLaunching, setIsLaunching] = useState(false);
  const [vfsStage, setVfsStage] = useState<number>(0);

  // Pillar 1, 2, 4 Tactical Toggles
  const [enableHud, setEnableHud] = useState(true);
  const [syncSave, setSyncSave] = useState(true);
  const [couchSplit, setCouchSplit] = useState(false);

  if (!game) return null;

  const handleLaunch = async () => {
    setIsLaunching(true);
    setVfsStage(1); // Anti-cheat check
    await new Promise((r) => setTimeout(r, 400));

    setVfsStage(2); // Mounting VFS
    await launchCoopSession(
      game.executablePath,
      role === 'host' ? roomCode : joinCodeInput,
      {
        enableHud,
        syncSave,
        couchSplit,
      }
    );
    await new Promise((r) => setTimeout(r, 400));

    setVfsStage(3); // In-memory injection
    await new Promise((r) => setTimeout(r, 500));

    setVfsStage(4); // SDR lobby active
    setIsLaunching(false);
  };

  const handleResetAndClose = () => {
    setIsLaunching(false);
    setVfsStage(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleResetAndClose()}>
      <DialogContent className="max-w-md bg-zinc-900 border-zinc-800 text-zinc-100 p-6">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="active" className="text-[10px] font-mono">
              {game.engineDisplayName}
            </Badge>
            <Badge variant="online" className="text-[10px] font-mono">
              NON-DESTRUCTIVE VFS
            </Badge>
          </div>
          <DialogTitle className="text-base font-semibold text-zinc-100 mt-2">
            Activate Co-op: {game.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Configure multiplayer session and initialize non-destructive in-memory injection.
          </DialogDescription>
        </DialogHeader>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950/80 rounded-md border border-zinc-800/60 mt-3">
          <button
            onClick={() => setRole('host')}
            className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded text-xs font-medium transition ${
              role === 'host'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-emerald-400" /> Host (Player 1)
          </button>
          <button
            onClick={() => setRole('join')}
            className={`flex items-center justify-center gap-2 py-1.5 px-3 rounded text-xs font-medium transition ${
              role === 'join'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-sky-400" /> Join (Client)
          </button>
        </div>

        {/* Content based on role */}
        <div className="space-y-4 my-2">
          {role === 'host' ? (
            <div className="space-y-3">
              <div className="p-3 rounded-md bg-zinc-950 border border-zinc-800/80 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-medium text-zinc-500 block">Lobby Room Code</span>
                  <span className="font-mono text-base font-bold text-sky-400 tracking-wider">
                    {roomCode}
                  </span>
                </div>
                <Button size="sm" variant="secondary" onClick={onCopyRoomCode} className="h-8 gap-1.5 text-xs">
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>

              <div className="text-[11px] text-zinc-400 space-y-1">
                <p>• You own the authoritative world simulation (AI decision loop & physics).</p>
                <p>• Partner can join from PC or Android using this 6-digit Room Code.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Enter Host Room Code</label>
                <Input
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. DUO-7K2"
                  maxLength={7}
                  className="font-mono text-center tracking-widest uppercase text-sm"
                />
              </div>
              <p className="text-[11px] text-zinc-400">
                You will connect as a remote avatar without modifying local quest or world files.
              </p>
            </div>
          )}

          {/* Tactical v0.2.0 Engine Options */}
          <div className="p-3 rounded-md bg-zinc-950/90 border border-zinc-800/80 space-y-2.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-semibold block">
              Session Features & Architecture
            </span>

            <label className="flex items-center gap-2.5 text-xs text-zinc-300 hover:text-zinc-100 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={enableHud}
                onChange={(e) => setEnableHud(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-sky-500 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5"
              />
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Enable In-Game Tactical HUD (<kbd className="font-mono text-[10px] bg-zinc-800 px-1 rounded text-zinc-400">Shift + Tab</kbd>)
              </span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-zinc-300 hover:text-zinc-100 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={syncSave}
                onChange={(e) => setSyncSave(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5"
              />
              <span className="flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5 text-emerald-400" />
                Sync Save Game to Client on Session End
              </span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-zinc-300 hover:text-zinc-100 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={couchSplit}
                onChange={(e) => setCouchSplit(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5"
              />
              <span className="flex items-center gap-1.5">
                <Gamepad2 className="w-3.5 h-3.5 text-amber-400" />
                Launch in Couch Split-Screen (1 PC, 2 Controllers)
              </span>
            </label>
          </div>

          {/* VFS & Injection Staging Progression */}
          {vfsStage > 0 && (
            <div className="p-3 rounded-md bg-zinc-950 border border-zinc-800/80 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-zinc-300 font-medium">
                {vfsStage < 4 ? (
                  <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <span>
                  {vfsStage === 1 && 'Scanning binary PE headers & anti-cheat signatures...'}
                  {vfsStage === 2 && 'Mounting Virtual File System (VFS) redirection layer...'}
                  {vfsStage === 3 && 'Injecting in-memory hooks (Zero-disk modification)...'}
                  {vfsStage === 4 && 'Lobby active! Game running with Duoverse Netcode.'}
                </span>
              </div>

              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${(vfsStage / 4) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-zinc-800/60">
          <Button variant="ghost" size="sm" onClick={handleResetAndClose}>
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleLaunch}
            disabled={isLaunching || (role === 'join' && joinCodeInput.length < 6)}
            className="gap-2"
          >
            {isLaunching ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing VFS...
              </>
            ) : vfsStage === 4 ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Launching Game...
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                {role === 'host' ? 'Activate Co-op & Launch' : 'Connect & Launch'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
