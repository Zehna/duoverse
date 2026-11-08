#!/usr/bin/env python3
"""
foundry/tests/test_vfs_redirection.py
Verifies the Zero-Disk Modification Guarantee and in-memory VFS redirection.
"""

import os
import sys
import tempfile
import hashlib
import unittest

def calculate_sha256(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, "rb") as f:
        while chunk := f.read(8192):
            h.update(chunk)
    return h.hexdigest()

class MockVFSEngine:
    """Python reference emulator matching core/vfs/src/usvfs_core.cpp"""
    def __init__(self):
        self.virtual_table = {}
        self.mounted_directories = []
        self.hooks_active = False

    def normalize_path(self, path: str) -> str:
        norm = os.path.normpath(path).lower()
        return norm

    def mount_staging_directory(self, virtual_game_root: str, staging_dir: str):
        self.mounted_directories.append((
            self.normalize_path(virtual_game_root),
            self.normalize_path(staging_dir)
        ))

    def add_virtual_redirect(self, virtual_path: str, physical_target: str):
        norm = self.normalize_path(virtual_path)
        self.virtual_table[norm] = {
            "type": "file",
            "target": physical_target
        }

    def add_memory_file(self, virtual_path: str, buffer_bytes: bytes):
        norm = self.normalize_path(virtual_path)
        self.virtual_table[norm] = {
            "type": "memory",
            "buffer": buffer_bytes
        }

    def resolve_and_read(self, requested_path: str) -> bytes:
        norm = self.normalize_path(requested_path)
        
        # 1. Direct virtual table check
        if norm in self.virtual_table:
            entry = self.virtual_table[norm]
            if entry["type"] == "memory":
                return entry["buffer"]
            elif entry["type"] == "file":
                with open(entry["target"], "rb") as f:
                    return f.read()

        # 2. Mounted staging directory check
        for v_root, s_root in self.mounted_directories:
            if norm.startswith(v_root):
                rel = os.path.relpath(norm, v_root)
                staged_file = os.path.join(s_root, rel)
                if os.path.exists(staged_file):
                    with open(staged_file, "rb") as f:
                        return f.read()

        # 3. Fallback to physical disk
        with open(requested_path, "rb") as f:
            return f.read()


class TestVFSRedirection(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp(prefix="duoverse_vfs_test_")
        self.game_dir = os.path.join(self.temp_dir, "GameInstall")
        self.staging_dir = os.path.join(self.temp_dir, "DuoverseStaging")
        os.makedirs(self.game_dir, exist_ok=True)
        os.makedirs(self.staging_dir, exist_ok=True)

        # Create original pristine game executable and libraries
        self.exe_path = os.path.join(self.game_dir, "Game.exe")
        self.dll_path = os.path.join(self.game_dir, "Assembly-CSharp.dll")
        
        with open(self.exe_path, "wb") as f:
            f.write(b"ORIGINAL_GAME_EXE_BINARY_PRISTINE_DATA_12345")
        with open(self.dll_path, "wb") as f:
            f.write(b"ORIGINAL_MONO_ASSEMBLY_WITHOUT_MULTIPLAYER")

        self.initial_exe_hash = calculate_sha256(self.exe_path)
        self.initial_dll_hash = calculate_sha256(self.dll_path)

        self.vfs = MockVFSEngine()

    def tearDown(self):
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)

    def test_file_redirection(self):
        # Create modified co-op DLL in staging directory
        staged_mod_dll = os.path.join(self.staging_dir, "Assembly-CSharp.dll")
        with open(staged_mod_dll, "wb") as f:
            f.write(b"DUOVERSE_HOOKED_COOP_ASSEMBLY_PAYLOAD_V020")

        self.vfs.add_virtual_redirect(self.dll_path, staged_mod_dll)

        # Game reads DLL via VFS
        content_read = self.vfs.resolve_and_read(self.dll_path)
        self.assertEqual(content_read, b"DUOVERSE_HOOKED_COOP_ASSEMBLY_PAYLOAD_V020")

        # Disk file must remain 100% pristine
        post_dll_hash = calculate_sha256(self.dll_path)
        self.assertEqual(post_dll_hash, self.initial_dll_hash)

    def test_memory_only_staging(self):
        # In-memory virtual payload (no physical file anywhere on disk)
        virtual_header_path = os.path.join(self.game_dir, "duoverse_netcode_config.json")
        payload = b'{"room": "DUO-7K2", "tick_rate": 60, "anti_cheat": "clean"}'
        
        self.vfs.add_memory_file(virtual_header_path, payload)

        content = self.vfs.resolve_and_read(virtual_header_path)
        self.assertEqual(content, payload)
        self.assertFalse(os.path.exists(virtual_header_path))

    def test_zero_disk_modification_guarantee(self):
        # Mount entire staging dir over game root
        staged_extra = os.path.join(self.staging_dir, "ExtraAssets.pak")
        with open(staged_extra, "wb") as f:
            f.write(b"COOP_MAP_DATA_PACK")

        self.vfs.mount_staging_directory(self.game_dir, self.staging_dir)

        # Access virtual extra asset as if it were in the game folder
        virtual_pak_path = os.path.join(self.game_dir, "ExtraAssets.pak")
        content = self.vfs.resolve_and_read(virtual_pak_path)
        self.assertEqual(content, b"COOP_MAP_DATA_PACK")

        # Verify disk remains completely untampered
        final_exe_hash = calculate_sha256(self.exe_path)
        final_dll_hash = calculate_sha256(self.dll_path)

        self.assertEqual(final_exe_hash, self.initial_exe_hash)
        self.assertEqual(final_dll_hash, self.initial_dll_hash)
        self.assertFalse(os.path.exists(virtual_pak_path))


if __name__ == "__main__":
    unittest.main()
