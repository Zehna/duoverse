#!/usr/bin/env python3
"""
foundry/tests/test_save_sync.py
Verifies Ludusavi manifest path resolution, pre-session backup, delta save generation,
and packet reconstruction for Pillar 2 (Save Game & Quest Progress Sync).
"""

import os
import sys
import tempfile
import zipfile
import base64
import zlib
import json
import shutil
import unittest

def expand_ludusavi_path(template: str) -> str:
    userprofile = os.environ.get("USERPROFILE", "C:\\Users\\Default")
    appdata = os.environ.get("APPDATA", os.path.join(userprofile, "AppData", "Roaming"))
    localappdata = os.environ.get("LOCALAPPDATA", os.path.join(userprofile, "AppData", "Local"))
    saved_games = os.path.join(userprofile, "Saved Games")
    documents = os.path.join(userprofile, "Documents")

    res = (
        template.replace("<home>", userprofile)
        .replace("<appdata>", appdata)
        .replace("<localappdata>", localappdata)
        .replace("<winSavedGames>", saved_games)
        .replace("<winDocuments>", documents)
        .replace("/", os.sep)
    )
    return os.path.normpath(res)

def create_pre_session_backup(save_dir: str) -> str:
    backup_dir = save_dir + ".duo_backup"
    if os.path.exists(backup_dir):
        shutil.rmtree(backup_dir)
    shutil.copytree(save_dir, backup_dir)
    return backup_dir

def build_save_delta(save_dir: str, game_title: str, app_id: str = None) -> dict:
    backup_dir = save_dir + ".duo_backup"
    modified_files = []

    for root, _, files in os.walk(save_dir):
        for f in files:
            cur_path = os.path.join(root, f)
            rel_path = os.path.relpath(cur_path, save_dir)
            bak_path = os.path.join(backup_dir, rel_path)

            should_sync = False
            if not os.path.exists(bak_path):
                should_sync = True
            else:
                with open(cur_path, "rb") as cf, open(bak_path, "rb") as bf:
                    if cf.read() != bf.read():
                        should_sync = True

            if should_sync:
                with open(cur_path, "rb") as cf:
                    modified_files.append((rel_path, cf.read()))

    # Build ZIP in-memory
    import io
    mem_zip = io.BytesIO()
    with zipfile.ZipFile(mem_zip, "w", zipfile.ZIP_DEFLATED) as zf:
        for rel, data in modified_files:
            zf.writestr(rel.replace("\\", "/"), data)

    zip_bytes = mem_zip.getvalue()
    b64_str = base64.b64encode(zip_bytes).decode("ascii")
    crc_hex = f"{zlib.crc32(zip_bytes) & 0xffffffff:08x}"

    return {
        "packetType": "DuoversePacket::SaveSync",
        "gameTitle": game_title,
        "appId": app_id,
        "deltaZipBase64": b64_str,
        "fileCount": len(modified_files),
        "totalBytes": len(zip_bytes),
        "checksum": crc_hex,
    }

def apply_save_delta(target_dir: str, packet: dict) -> int:
    os.makedirs(target_dir, exist_ok=True)
    zip_bytes = base64.b64decode(packet["deltaZipBase64"])
    
    # Checksum validation
    calc_crc = f"{zlib.crc32(zip_bytes) & 0xffffffff:08x}"
    if calc_crc != packet["checksum"]:
        raise ValueError(f"Checksum mismatch: {calc_crc} vs {packet['checksum']}")

    import io
    mem_zip = io.BytesIO(zip_bytes)
    restored = 0
    with zipfile.ZipFile(mem_zip, "r") as zf:
        for name in zf.namelist():
            zf.extract(name, target_dir)
            restored += 1
    return restored


class TestSaveSync(unittest.TestCase):
    def setUp(self):
        self.temp_root = tempfile.mkdtemp(prefix="duoverse_save_sync_test_")
        self.host_save_dir = os.path.join(self.temp_root, "HostSaveGame")
        self.client_save_dir = os.path.join(self.temp_root, "ClientSaveGame")
        os.makedirs(self.host_save_dir, exist_ok=True)

    def tearDown(self):
        shutil.rmtree(self.temp_root, ignore_errors=True)

    def test_ludusavi_path_expansion(self):
        token_path = "<winSavedGames>/Risk of Rain 2/Steam/76561198/save.xml"
        expanded = expand_ludusavi_path(token_path)
        self.assertIn("Saved Games", expanded)
        self.assertTrue(expanded.endswith(os.path.normpath("Risk of Rain 2/Steam/76561198/save.xml")))

    def test_pre_session_backup_and_delta_generation(self):
        # 1. Host has an initial single-player campaign save
        save_file = os.path.join(self.host_save_dir, "campaign_slot0.dat")
        with open(save_file, "wb") as f:
            f.write(b"PROGRESS:CHAPTER_1_LEVEL_5_GOLD_100")

        # 2. Host launches co-op session -> pre-session backup created
        backup_dir = create_pre_session_backup(self.host_save_dir)
        self.assertTrue(os.path.isdir(backup_dir))

        # 3. Simulate co-op gameplay: Chapter 2 completed, new coop boss weapon discovered
        with open(save_file, "wb") as f:
            f.write(b"PROGRESS:CHAPTER_2_LEVEL_10_GOLD_5500_COOP_COMPLETE")

        coop_item_file = os.path.join(self.host_save_dir, "coop_shared_loot.json")
        with open(coop_item_file, "w") as f:
            json.dump({"weapon": "Thunderfury_Coop_Legendary", "tier": 5}, f)

        # 4. Session ends -> Build delta save packet
        packet = build_save_delta(self.host_save_dir, "Elden Fantasy", "480")
        self.assertEqual(packet["packetType"], "DuoversePacket::SaveSync")
        self.assertEqual(packet["fileCount"], 2)
        self.assertGreater(packet["totalBytes"], 0)

        # 5. Client receives packet and applies it to Client's save directory
        files_restored = apply_save_delta(self.client_save_dir, packet)
        self.assertEqual(files_restored, 2)

        # Verify client has identical progress data
        with open(os.path.join(self.client_save_dir, "campaign_slot0.dat"), "rb") as f:
            self.assertEqual(f.read(), b"PROGRESS:CHAPTER_2_LEVEL_10_GOLD_5500_COOP_COMPLETE")

        with open(os.path.join(self.client_save_dir, "coop_shared_loot.json"), "r") as f:
            loot_data = json.load(f)
            self.assertEqual(loot_data["weapon"], "Thunderfury_Coop_Legendary")


if __name__ == "__main__":
    unittest.main()
