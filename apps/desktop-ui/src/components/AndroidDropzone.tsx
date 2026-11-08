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

export function AndroidDropzone() {
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<APKAnalysisResult | null>(null);
  const [repackProgress, setRepackProgress] = useState<RepackProgressEvent | null>(null);
  const [isRepacking, setIsRepacking] = useState(false);
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
    if (!file.name.toLowerCase().endsWith('.apk')) {
      alert('Please select a valid Android package file (.apk)');
      return;
    }

    setIsAnalyzing(true);
    setRepackProgress(null);
    try {
      const result = await analyzeAPKFile(file);
      setAnalysisResult(result);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleStartRepack = async () => {
    if (!analysisResult || analysisResult.hasAntiCheat) return;

    setIsRepacking(true);
    try {
      await executeRepackPipeline(analysisResult, (event) => {
        setRepackProgress(event);
      });
    } catch (err) {
      console.error('Repack failed:', err);
    } finally {
      setIsRepacking(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-base font-semibold text-zinc-100 tracking-tight flex items-center gap-2">
          <Smartphone className="w-4 h-4 text-sky-400" /> Android APK Co-op Tooling
        </h2>
        <p className="text-xs text-zinc-400">
          Drop a mobile Unity/Unreal APK to automatically embed Duoverse ARM64 netcode & repack without device root.
        </p>
      </div>

      {/* Dropzone Container */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 ${
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

        <div className="p-3 rounded-full bg-zinc-950 border border-zinc-800 text-sky-400 mb-3">
          <UploadCloud className="w-6 h-6" />
        </div>

        <h3 className="text-sm font-semibold text-zinc-200">
          Drag & Drop Android Game (.apk) here
        </h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          Supports Unity IL2CPP, Unity Mono, and Unreal Engine games targeting ARM64-v8a architecture.
        </p>

        <Button variant="secondary" size="sm" className="mt-4 gap-1.5 text-xs">
          <FolderOpen className="w-3.5 h-3.5" /> Browse File
        </Button>
      </div>

      {/* Loading analysis state */}
      {isAnalyzing && (
        <div className="p-4 rounded-lg bg-zinc-900/60 border border-zinc-800 flex items-center justify-center gap-3 text-xs text-zinc-400">
          <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
          <span>Analyzing APK manifest, IL2CPP metadata, and anti-cheat signatures...</span>
        </div>
      )}

      {/* APK Analysis Preview Card */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
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
                    </CardDescription>
                  </div>
                </div>

                <Badge
                  variant={analysisResult.hasAntiCheat ? 'destructive' : 'online'}
                  className="gap-1.5 font-mono text-[11px]"
                >
                  {analysisResult.hasAntiCheat ? (
                    <>
                      <AlertTriangle className="w-3 h-3" /> UNSUPPORTED (ANTI-CHEAT)
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> READY FOR CO-OP REPACK
                    </>
                  )}
                </Badge>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Metadata Grid */}
                <div className="grid grid-cols-3 gap-3 p-3 rounded-md bg-zinc-950/80 border border-zinc-800/60 text-xs">
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Game Engine</span>
                    <span className="font-medium text-zinc-200">{analysisResult.engineDisplayName}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-zinc-500 block">Target Architecture</span>
                    <span className="font-mono text-sky-400">
                      {analysisResult.supportedAbis.join(', ') || 'None'}
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
                      This mobile game is protected by tamper detection or competitive anti-cheat software (
                      {analysisResult.antiCheatModules.join(', ')}). Injections are blocked to prevent account penalties.
                    </p>
                  </div>
                )}

                {/* Progress Bar during Repacking */}
                {repackProgress && (
                  <div className="p-3.5 rounded-md bg-zinc-950 border border-zinc-800/80 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-300 font-medium flex items-center gap-2">
                        {!repackProgress.isComplete && <Loader2 className="w-3.5 h-3.5 text-sky-400 animate-spin" />}
                        {repackProgress.currentAction}
                      </span>
                      <span className="font-mono text-sky-400 font-semibold">{repackProgress.percentage}%</span>
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
                          <CheckCircle2 className="w-4 h-4" /> Ready to install via ADB
                        </span>
                        <Button size="sm" variant="default" className="gap-1.5 text-xs h-7">
                          <Download className="w-3 h-3" /> Save Repacked APK
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
                      disabled={analysisResult.hasAntiCheat || isRepacking}
                      className="gap-2 text-xs"
                    >
                      <Cpu className="w-3.5 h-3.5" />
                      {isRepacking ? 'Repacking in Progress...' : 'Repack with Duoverse Netcode'}
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
