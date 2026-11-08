import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  FileBox,
  Smartphone,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Loader2,
  Download,
  FolderOpen,
  RefreshCw,
  Usb,
  HardDrive,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  analyzeAPKFile,
  executeRepackPipeline,
  type APKAnalysisResult,
  type RepackProgressEvent,
} from '@/services/apkService';
import type { AndroidScanSummary, LocalApkFile } from '@/services/gameScanner';

interface AndroidDropzoneProps {
  androidSummary: AndroidScanSummary | null;
  isScanningAndroid: boolean;
  onRescanAndroid: () => void;
  runtimeMode: 'tauri-native' | 'web-sandbox';
}

export function AndroidDropzone({
  androidSummary,
  isScanningAndroid,
  onRescanAndroid,
  runtimeMode,
}: AndroidDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<APKAnalysisResult | null>(null);
  const [repackProgress, setRepackProgress] = useState<RepackProgressEvent | null>(null);
  const [isRepacking, setIsRepacking] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await processFile(file);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await processFile(file);
    }
  };

  const processFile = async (file: File) => {
    setErrorBanner(null);
    if (!file.name.toLowerCase().endsWith('.apk')) {
      setErrorBanner('Invalid file extension. Please select a valid Android package file (.apk).');
      return;
    }

    setIsAnalyzing(true);
    setRepackProgress(null);
    try {
      const result = await analyzeAPKFile(file);
      setAnalysisResult(result);
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : String(err));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const selectDiscoveredLocalApk = (apk: LocalApkFile) => {
    setErrorBanner(null);
    setRepackProgress(null);
    setAnalysisResult({
      fileName: apk.fileName,
      filePath: apk.filePath,
      fileSizeBytes: apk.fileSizeBytes,
      fileSizeFormatted: apk.fileSizeFormatted,
      packageName: apk.packageName,
      engine: apk.engine,
      engineDisplayName: apk.engineDisplayName,
      supportedAbis: apk.supportedAbis,
      isCompatible: apk.isCompatible,
      hasAntiCheat: apk.hasAntiCheat,
      antiCheatModules: apk.antiCheatModules,
      statusText: apk.statusText,
    });
  };

  const handleStartRepack = async () => {
    if (!analysisResult || analysisResult.hasAntiCheat || !analysisResult.isCompatible) return;

    setIsRepacking(true);
    setErrorBanner(null);
    try {
      await executeRepackPipeline(analysisResult, (event) => {
        setRepackProgress(event);
      });
    } catch (err) {
      setErrorBanner(err instanceof Error ? err.message : String(err));
    } finally {
      setIsRepacking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Rescan Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-sky-400" /> Android Hardware & APK Scanner
          </h2>
          <p className="text-xs text-zinc-400">
            Detects connected Android devices via ADB (`adb devices`) and inspects `.apk` files in `Downloads`.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onRescanAndroid}
          disabled={isScanningAndroid}
          className="gap-1.5 text-xs h-8"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isScanningAndroid ? 'animate-spin' : ''}`} />
          {isScanningAndroid ? 'Scanning ADB & Disk...' : 'Rescan ADB & Downloads'}
        </Button>
      </div>

      {errorBanner && (
        <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorBanner}</span>
        </div>
      )}

      {/* Real ADB Devices & Downloads Folder Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: ADB Connected Hardware */}
        <Card className="border-zinc-800/80 bg-zinc-900/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Usb className="w-3.5 h-3.5 text-sky-400" /> Connected ADB Devices
              </CardTitle>
              <Badge
                variant={
                  androidSummary?.devices && androidSummary.devices.length > 0
                    ? 'online'
                    : 'default'
                }
                className="font-mono text-[10px]"
              >
                {androidSummary?.devices.length || 0} ONLINE
              </Badge>
            </div>
            <CardDescription className="text-[11px]">
              Queries `adb devices -l` and `pm list packages -3 -f` on connected Android hardware.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!androidSummary || androidSummary.devices.length === 0 ? (
              <div className="p-4 rounded-md bg-zinc-950/70 border border-zinc-800/60 text-center space-y-1">
                <p className="text-xs font-medium text-zinc-400">
                  No Android ADB devices currently detected.
                </p>
                <p className="text-[11px] text-zinc-500">
                  {runtimeMode === 'web-sandbox'
                    ? 'Run in Tauri Desktop mode to query local USB / Wireless ADB devices directly.'
                    : 'Connect an Android phone with USB Debugging enabled and click Rescan.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {androidSummary.devices.map((dev) => (
                  <div
                    key={dev.serial}
                    className="p-3 rounded-md bg-zinc-950 border border-zinc-800/80 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-zinc-100">{dev.model}</span>
                        <span className="text-[11px] font-mono text-zinc-500 block">
                          Serial: {dev.serial} • ABI: {dev.abi}
                        </span>
                      </div>
                      <Badge variant={dev.state === 'device' ? 'online' : 'warning'} className="text-[10px] font-mono">
                        {dev.state.toUpperCase()}
                      </Badge>
                    </div>

                    {dev.installedGames.length > 0 && (
                      <div className="pt-2 border-t border-zinc-800/60 space-y-1.5">
                        <span className="text-[10px] font-mono uppercase text-zinc-500 block">
                          Installed 3rd-Party Packages ({dev.installedGames.length}):
                        </span>
                        <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                          {dev.installedGames.map((pkg) => (
                            <div
                              key={pkg.packageName}
                              className="flex items-center justify-between text-[11px] bg-zinc-900/80 px-2 py-1 rounded border border-zinc-800/50"
                            >
                              <span className="font-mono text-zinc-300 truncate max-w-[180px]">
                                {pkg.packageName}
                              </span>
                              <Badge
                                variant={
                                  pkg.hasAntiCheat
                                    ? 'destructive'
                                    : pkg.engine !== 'unknown'
                                    ? 'online'
                                    : 'default'
                                }
                                className="text-[9px] font-mono"
                              >
                                {pkg.engineDisplayName}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Local Downloads Folder APK Scanner */}
        <Card className="border-zinc-800/80 bg-zinc-900/60">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400" /> Local Downloads APK Scanner
              </CardTitle>
              <Badge variant="default" className="font-mono text-[10px]">
                {androidSummary?.localApks.length || 0} FOUND
              </Badge>
            </div>
            <CardDescription className="text-[11px] font-mono truncate">
              Path: {androidSummary?.downloadsPath || '~/Downloads'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!androidSummary || androidSummary.localApks.length === 0 ? (
              <div className="p-4 rounded-md bg-zinc-950/70 border border-zinc-800/60 text-center space-y-1">
                <p className="text-xs font-medium text-zinc-400">
                  No `.apk` files found in Downloads folder.
                </p>
                <p className="text-[11px] text-zinc-500">
                  Drop any `.apk` file into the inspector below or browse from disk.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {androidSummary.localApks.map((apk) => (
                  <div
                    key={apk.filePath}
                    onClick={() => selectDiscoveredLocalApk(apk)}
                    className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800/80 hover:border-sky-500/60 cursor-pointer transition flex items-center justify-between"
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-medium text-zinc-200 truncate">{apk.fileName}</div>
                      <div className="text-[10px] font-mono text-zinc-500">
                        {apk.fileSizeFormatted} • {apk.engineDisplayName}
                      </div>
                    </div>
                    <Badge
                      variant={apk.hasAntiCheat ? 'destructive' : apk.isCompatible ? 'online' : 'default'}
                      className="text-[9px] font-mono shrink-0"
                    >
                      {apk.hasAntiCheat ? 'ANTI-CHEAT' : apk.isCompatible ? 'READY' : 'UNKNOWN'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Interactive APK Binary Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-7 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150 ${
          isDragging
            ? 'border-sky-500 bg-sky-500/10'
            : 'border-zinc-800/80 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".apk"
          onChange={handleFileInput}
          className="hidden"
        />

        <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-sky-400 mb-2.5">
          <UploadCloud className="w-5 h-5" />
        </div>

        <h3 className="text-sm font-semibold text-zinc-200">
          Inspect Local `.apk` File (Binary ZIP & ELF Header Scanner)
        </h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-md">
          Reads internal ZIP Central Directory headers in real time to verify `lib/arm64-v8a/libil2cpp.so`, `Assembly-CSharp.dll`, and mobile anti-cheat modules.
        </p>

        <Button variant="secondary" size="sm" className="mt-3.5 gap-1.5 text-xs">
          <FolderOpen className="w-3.5 h-3.5" /> Select `.apk` from Disk
        </Button>
      </div>

      {/* Loading analysis state */}
      {isAnalyzing && (
        <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-center gap-3 text-xs text-zinc-400">
          <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
          <span>Parsing binary APK Central Directory headers, ABIs, and anti-cheat signatures...</span>
        </div>
      )}

      {/* APK Analysis Preview Card */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16 }}
          >
            <Card className="border-zinc-800/80 bg-zinc-900/80">
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-md bg-zinc-950 border border-zinc-800 text-sky-400 mt-0.5">
                    <FileBox className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                      {analysisResult.fileName}
                      <span className="text-xs font-mono text-zinc-500 font-normal">
                        ({analysisResult.fileSizeFormatted})
                      </span>
                    </CardTitle>
                    <CardDescription className="font-mono text-[11px] text-zinc-400 mt-0.5">
                      Package: {analysisResult.packageName}
                      {analysisResult.totalEntries !== undefined &&
                        ` • ${analysisResult.totalEntries} archive entries scanned`}
                    </CardDescription>
                  </div>
                </div>

                <Badge
                  variant={
                    analysisResult.hasAntiCheat
                      ? 'destructive'
                      : analysisResult.isCompatible
                      ? 'online'
                      : 'warning'
                  }
                  className="gap-1.5 font-mono text-[11px]"
                >
                  {analysisResult.hasAntiCheat ? (
                    <>
                      <AlertTriangle className="w-3 h-3" /> UNSUPPORTED (ANTI-CHEAT)
                    </>
                  ) : analysisResult.isCompatible ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> READY FOR CO-OP REPACK
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-3 h-3" /> {analysisResult.statusText.toUpperCase()}
                    </>
                  )}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Metadata Grid */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-md bg-zinc-950/80 border border-zinc-800/60 text-xs">
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Detected Engine</span>
                    <span className="font-medium text-zinc-200">{analysisResult.engineDisplayName}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Detected ABIs (`lib/*`)</span>
                    <span className="font-mono text-sky-400">
                      {analysisResult.supportedAbis.length > 0
                        ? analysisResult.supportedAbis.join(', ')
                        : 'No native lib/ folders'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Anti-Cheat Scan</span>
                    <span
                      className={`font-medium ${
                        analysisResult.hasAntiCheat ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {analysisResult.hasAntiCheat
                        ? analysisResult.antiCheatModules.join(', ')
                        : 'Clean (0 Signatures)'}
                    </span>
                  </div>
                </div>

                {/* Warning if Anti-Cheat detected */}
                {analysisResult.hasAntiCheat && (
                  <div className="p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-1">
                    <div className="font-semibold flex items-center gap-1.5 text-rose-400">
                      <AlertTriangle className="w-4 h-4" /> Duoverse Principle 3 Failsafe Triggered
                    </div>
                    <p className="text-[11px] text-rose-400/80 leading-relaxed">
                      This APK contains competitive anti-cheat or tamper protection modules (
                      {analysisResult.antiCheatModules.join(', ')}). Repacking is automatically aborted.
                    </p>
                  </div>
                )}

                {/* Progress Bar during Repacking */}
                {repackProgress && (
                  <div className="p-3.5 rounded-md bg-zinc-950 border border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 font-medium flex items-center gap-2">
                        {!repackProgress.isComplete && (
                          <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />
                        )}
                        {repackProgress.currentAction}
                      </span>
                      <span className="font-mono text-sky-400 font-semibold">
                        {repackProgress.percentage}%
                      </span>
                    </div>

                    <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                      <motion.div
                        className="h-full bg-sky-500"
                        initial={{ width: 0 }}
                        animate={{ width: `${repackProgress.percentage}%` }}
                        transition={{ ease: 'easeOut', duration: 0.2 }}
                      />
                    </div>

                    {repackProgress.isComplete && (
                      <div className="pt-2 flex items-center justify-between border-t border-zinc-800/60 text-xs">
                        <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Output: {repackProgress.outputApkPath}
                        </span>
                        <Button size="sm" variant="default" className="gap-1.5 text-xs h-7">
                          <Download className="w-3 h-3" /> Ready for ADB Install
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Trigger */}
                {!repackProgress && (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                      variant="default"
                      onClick={handleStartRepack}
                      disabled={
                        analysisResult.hasAntiCheat ||
                        !analysisResult.isCompatible ||
                        isRepacking
                      }
                      className="gap-2 text-xs"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      {isRepacking ? 'Repacking in Progress...' : 'Activate Co-op (Auto-Repack APK)'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
