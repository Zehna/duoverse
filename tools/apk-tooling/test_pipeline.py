#!/usr/bin/env python3
"""Automated Unit Tests for Duoverse APK Tooling & Repack Pipeline."""

import os
import sys
import tempfile
import unittest
import zipfile
from pathlib import Path

# Local imports
sys.path.insert(0, str(Path(__file__).resolve().parent))
from apk_analyzer import analyze_apk
from repack_pipeline import inject_and_repack


class TestAPKTooling(unittest.TestCase):
    def setUp(self):
        self.test_dir = tempfile.TemporaryDirectory()
        self.base_path = Path(self.test_dir.name)

    def tearDown(self):
        self.test_dir.cleanup()

    def test_unity_il2cpp_detection_and_repack(self):
        # 1. Create mock Unity IL2CPP APK
        mock_apk = self.base_path / "mock_unity_game.apk"
        with zipfile.ZipFile(mock_apk, 'w') as zf:
            zf.writestr("AndroidManifest.xml", "<manifest></manifest>")
            zf.writestr("lib/arm64-v8a/libunity.so", b"MOCK_UNITY_SO")
            zf.writestr("lib/arm64-v8a/libil2cpp.so", b"MOCK_IL2CPP_SO")
            zf.writestr("assets/bin/Data/settings.xml", "<data></data>")

        # 2. Verify analyzer
        meta = analyze_apk(str(mock_apk))
        self.assertTrue(meta.is_valid_apk)
        self.assertEqual(meta.engine, "unity-il2cpp")
        self.assertIn("arm64-v8a", meta.abis)
        self.assertFalse(meta.has_anti_cheat)

        # 3. Test repacking
        output_apk = self.base_path / "repacked_game.apk"
        success = inject_and_repack(str(mock_apk), str(output_apk), abi="arm64-v8a")
        self.assertTrue(success)
        self.assertTrue(output_apk.exists())

        # 4. Verify injected libraries in repacked APK
        with zipfile.ZipFile(output_apk, 'r') as zf:
            names = zf.namelist()
            self.assertIn("lib/arm64-v8a/libduoverse_injector_android.so", names)
            self.assertIn("lib/arm64-v8a/libduoverse_netcode.so", names)
            self.assertIn("META-INF/MANIFEST.MF", names)

    def test_anti_cheat_abort_principle(self):
        # 1. Create mock game with anti-cheat
        mock_ac_apk = self.base_path / "protected_game.apk"
        with zipfile.ZipFile(mock_ac_apk, 'w') as zf:
            zf.writestr("lib/arm64-v8a/libtprt.so", b"TENCENT_ACE_SIGNATURE")
            zf.writestr("lib/arm64-v8a/libil2cpp.so", b"MOCK_IL2CPP")

        meta = analyze_apk(str(mock_ac_apk))
        self.assertTrue(meta.has_anti_cheat)
        self.assertIn("libtprt.so", meta.anti_cheat_modules)

        # 2. Repack should fail as per Principle 3
        output_apk = self.base_path / "should_not_exist.apk"
        success = inject_and_repack(str(mock_ac_apk), str(output_apk), force=False)
        self.assertFalse(success)
        self.assertFalse(output_apk.exists())


if __name__ == "__main__":
    unittest.main()
