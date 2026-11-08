import { useState, useEffect, useCallback } from 'react';
import {
  isTauriRuntime,
  scanLocalGameLibraries,
  scanAndroidDevicesAndApks,
  pickAndScanCustomGameFolder,
  inspectLocalDirectoryFiles,
  type DetectedGame,
  type AndroidScanSummary,
} from '@/services/gameScanner';

export function useGameScanner() {
  const [games, setGames] = useState<DetectedGame[]>([]);
  const [customGames, setCustomGames] = useState<DetectedGame[]>([]);
  const [androidSummary, setAndroidSummary] = useState<AndroidScanSummary | null>(null);
  const [isScanningPc, setIsScanningPc] = useState<boolean>(false);
  const [isScanningAndroid, setIsScanningAndroid] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [lastScannedAt, setLastScannedAt] = useState<string | null>(null);

  const runtimeMode: 'tauri-native' | 'web-sandbox' = isTauriRuntime()
    ? 'tauri-native'
    : 'web-sandbox';

  const rescanPcLibraries = useCallback(async () => {
    setIsScanningPc(true);
    setScanError(null);
    try {
      const detected = await scanLocalGameLibraries();
      setGames(detected);
      setLastScannedAt(new Date().toLocaleTimeString());
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setScanError(`PC Library Scan Error: ${msg}`);
    } finally {
      setIsScanningPc(false);
    }
  }, []);

  const rescanAndroidDevices = useCallback(async () => {
    setIsScanningAndroid(true);
    try {
      const summary = await scanAndroidDevicesAndApks();
      setAndroidSummary(summary);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setScanError(`Android ADB Scan Error: ${msg}`);
    } finally {
      setIsScanningAndroid(false);
    }
  }, []);

  const addCustomGameFolderNative = useCallback(async (): Promise<DetectedGame | null> => {
    setScanError(null);
    try {
      const detected = await pickAndScanCustomGameFolder();
      if (detected) {
        setCustomGames((prev) => {
          const filtered = prev.filter(
            (g) => g.installDirectory.toLowerCase() !== detected.installDirectory.toLowerCase()
          );
          return [detected, ...filtered];
        });
        return detected;
      }
      return null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setScanError(msg);
      return null;
    }
  }, []);

  const addCustomGameFromBrowserDirectory = useCallback(
    (fileList: FileList): DetectedGame | null => {
      setScanError(null);
      try {
        const detected = inspectLocalDirectoryFiles(fileList);
        setCustomGames((prev) => {
          const filtered = prev.filter((g) => g.id !== detected.id);
          return [detected, ...filtered];
        });
        return detected;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setScanError(msg);
        return null;
      }
    },
    []
  );

  // Combine scanned Steam/Epic games with user-added custom folders without duplicates
  const allDetectedGames: DetectedGame[] = [
    ...customGames,
    ...games.filter(
      (g) =>
        !customGames.some(
          (cg) => cg.installDirectory.toLowerCase() === g.installDirectory.toLowerCase()
        )
    ),
  ];

  useEffect(() => {
    rescanPcLibraries();
    rescanAndroidDevices();
  }, [rescanPcLibraries, rescanAndroidDevices]);

  return {
    games: allDetectedGames,
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
    clearScanError: () => setScanError(null),
  };
}
