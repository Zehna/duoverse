use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SaveLocation {
    #[serde(rename = "gameTitle")]
    pub game_title: String,
    #[serde(rename = "appId")]
    pub app_id: Option<String>,
    #[serde(rename = "saveDirectory")]
    pub save_directory: String,
    #[serde(rename = "totalFiles")]
    pub total_files: usize,
    #[serde(rename = "totalSizeBytes")]
    pub total_size_bytes: u64,
    #[serde(rename = "lastModified")]
    pub last_modified: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SaveBackupResult {
    pub success: bool,
    #[serde(rename = "originalPath")]
    pub original_path: String,
    #[serde(rename = "backupPath")]
    pub backup_path: String,
    pub message: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SaveSyncPacket {
    #[serde(rename = "packetType")]
    pub packet_type: String, // "DuoversePacket::SaveSync" (0x40)
    #[serde(rename = "gameTitle")]
    pub game_title: String,
    #[serde(rename = "appId")]
    pub app_id: Option<String>,
    #[serde(rename = "relativeFolder")]
    pub relative_folder: String,
    #[serde(rename = "deltaZipBase64")]
    pub delta_zip_base64: String,
    #[serde(rename = "fileCount")]
    pub file_count: usize,
    #[serde(rename = "totalBytes")]
    pub total_bytes: usize,
    pub checksum: String,
}

/// Expands Ludusavi / Windows standard path tokens to absolute local filesystem paths.
pub fn expand_ludusavi_path(template: &str) -> Option<PathBuf> {
    let user_profile = std::env::var("USERPROFILE").ok()?;
    let appdata = std::env::var("APPDATA").unwrap_or_else(|_| format!(r"{}\AppData\Roaming", user_profile));
    let localappdata = std::env::var("LOCALAPPDATA").unwrap_or_else(|_| format!(r"{}\AppData\Local", user_profile));
    let localappdata_low = format!(r"{}\AppData\LocalLow", user_profile);
    let saved_games = format!(r"{}\Saved Games", user_profile);
    let documents = format!(r"{}\Documents", user_profile);

    let replaced = template
        .replace("<home>", &user_profile)
        .replace("<appdata>", &appdata)
        .replace("<localappdata>", &localappdata)
        .replace("<localappdataLow>", &localappdata_low)
        .replace("<winSavedGames>", &saved_games)
        .replace("<winDocuments>", &documents)
        .replace('/', "\\");

    Some(PathBuf::from(replaced))
}

/// Scans standard Windows save directories for a given game title or Steam AppID.
/// Supports %USERPROFILE%\AppData\Local, LocalLow, Roaming, and Saved Games.
pub fn detect_game_save_location(game_title: &str, app_id: Option<&str>) -> Option<SaveLocation> {
    let user_profile = std::env::var("USERPROFILE").unwrap_or_else(|_| r"C:\Users\Default".to_string());
    let clean_title = game_title.replace(':', "").replace('/', "").trim().to_string();

    let candidates = [
        format!(r"{}\AppData\Local\{}", user_profile, clean_title),
        format!(r"{}\AppData\LocalLow\{}", user_profile, clean_title),
        format!(r"{}\AppData\Roaming\{}", user_profile, clean_title),
        format!(r"{}\Saved Games\{}", user_profile, clean_title),
        format!(r"{}\Documents\My Games\{}", user_profile, clean_title),
        format!(r"{}\Documents\{}", user_profile, clean_title),
    ];

    let mut target_dir = None;

    // Check direct candidate paths
    for cand in &candidates {
        let p = Path::new(cand);
        if p.exists() && p.is_dir() {
            target_dir = Some(p.to_path_buf());
            break;
        }
    }

    // Check Steam AppID subfolder in Steam userdata if provided
    if target_dir.is_none() {
        if let Some(aid) = app_id {
            let steam_userdata = PathBuf::from(r"C:\Program Files (x86)\Steam\userdata");
            if steam_userdata.is_dir() {
                if let Ok(entries) = fs::read_dir(&steam_userdata) {
                    for entry in entries.flatten() {
                        let app_save = entry.path().join(aid);
                        if app_save.is_dir() {
                            target_dir = Some(app_save);
                            break;
                        }
                    }
                }
            }
        }
    }

    let save_path = target_dir?;
    let mut total_files = 0;
    let mut total_size = 0u64;
    let mut latest_mod = 0u64;

    if let Ok(entries) = fs::read_dir(&save_path) {
        for entry in entries.flatten() {
            if let Ok(meta) = entry.metadata() {
                if meta.is_file() {
                    total_files += 1;
                    total_size += meta.len();
                    if let Ok(mtime) = meta.modified() {
                        let ts = mtime
                            .duration_since(std::time::UNIX_EPOCH)
                            .map(|d| d.as_secs())
                            .unwrap_or(0);
                        if ts > latest_mod {
                            latest_mod = ts;
                        }
                    }
                }
            }
        }
    }

    Some(SaveLocation {
        game_title: game_title.to_string(),
        app_id: app_id.map(|s| s.to_string()),
        save_directory: save_path.to_string_lossy().to_string(),
        total_files,
        total_size_bytes: total_size,
        last_modified: latest_mod,
    })
}

/// Creates a pre-session backup (`.duo_backup`) of the original save game files.
pub fn create_pre_session_backup(save_dir: &Path) -> Result<SaveBackupResult, String> {
    if !save_dir.exists() || !save_dir.is_dir() {
        return Err(format!("Save directory does not exist: {}", save_dir.display()));
    }

    let backup_dir = save_dir.with_extension("duo_backup");
    if backup_dir.exists() {
        let _ = fs::remove_dir_all(&backup_dir);
    }
    fs::create_dir_all(&backup_dir)
        .map_err(|e| format!("Failed to create backup directory: {}", e))?;

    copy_dir_all(save_dir, &backup_dir)
        .map_err(|e| format!("Failed to copy save files to backup: {}", e))?;

    Ok(SaveBackupResult {
        success: true,
        original_path: save_dir.to_string_lossy().to_string(),
        backup_path: backup_dir.to_string_lossy().to_string(),
        message: format!("Pre-session backup verified at: {}", backup_dir.display()),
    })
}

/// Recursively copies directory contents
fn copy_dir_all(src: &Path, dst: &Path) -> std::io::Result<()> {
    if !dst.exists() {
        fs::create_dir_all(dst)?;
    }
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let ty = entry.file_type()?;
        let dest_child = dst.join(entry.file_name());
        if ty.is_dir() {
            copy_dir_all(&entry.path(), &dest_child)?;
        } else {
            fs::copy(entry.path(), dest_child)?;
        }
    }
    Ok(())
}

/// Builds delta save synchronization packet by comparing active save files with pre-session backup.
/// Formats compressed ZIP archive for network transmission via DuoversePacket::SaveSync.
pub fn build_save_sync_delta(
    save_dir: &Path,
    game_title: &str,
    app_id: Option<&str>,
) -> Result<SaveSyncPacket, String> {
    if !save_dir.exists() {
        return Err(format!("Save directory not found: {}", save_dir.display()));
    }

    let backup_dir = save_dir.with_extension("duo_backup");
    let mut modified_files: Vec<(PathBuf, Vec<u8>)> = Vec::new();

    // Collect all active files
    let mut stack = vec![save_dir.to_path_buf()];
    while let Some(current) = stack.pop() {
        if let Ok(entries) = fs::read_dir(&current) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    stack.push(path);
                } else if path.is_file() {
                    let rel = path
                        .strip_prefix(save_dir)
                        .unwrap_or(&path)
                        .to_path_buf();

                    let backup_file = backup_dir.join(&rel);
                    let should_sync = if !backup_file.exists() {
                        true // Newly created file
                    } else {
                        // Compare file content/hashes
                        let cur_bytes = fs::read(&path).unwrap_or_default();
                        let bak_bytes = fs::read(&backup_file).unwrap_or_default();
                        cur_bytes != bak_bytes
                    };

                    if should_sync {
                        if let Ok(bytes) = fs::read(&path) {
                            modified_files.push((rel, bytes));
                        }
                    }
                }
            }
        }
    }

    // Build lightweight zip-compatible archive buffer
    let mut zip_buffer = Vec::new();
    let mut file_count = 0;

    for (rel_path, content) in &modified_files {
        let path_str = rel_path.to_string_lossy().replace('\\', "/");
        let path_bytes = path_str.as_bytes();

        // Local file header (PK\x03\x04)
        zip_buffer.extend_from_slice(b"\x50\x4B\x03\x04");
        zip_buffer.extend_from_slice(&[20, 0]); // version needed
        zip_buffer.extend_from_slice(&[0, 0]);  // flags
        zip_buffer.extend_from_slice(&[0, 0]);  // compression = 0 (store)
        zip_buffer.extend_from_slice(&[0, 0, 0, 0]); // time/date
        let crc = crc32_simple(content);
        zip_buffer.extend_from_slice(&crc.to_le_bytes());
        zip_buffer.extend_from_slice(&(content.len() as u32).to_le_bytes()); // comp size
        zip_buffer.extend_from_slice(&(content.len() as u32).to_le_bytes()); // uncomp size
        zip_buffer.extend_from_slice(&(path_bytes.len() as u16).to_le_bytes());
        zip_buffer.extend_from_slice(&[0, 0]); // extra len
        zip_buffer.extend_from_slice(path_bytes);
        zip_buffer.extend_from_slice(content);
        file_count += 1;
    }

    let b64 = base64_simple(&zip_buffer);
    let checksum = format!("{:08x}", crc32_simple(&zip_buffer));

    Ok(SaveSyncPacket {
        packet_type: "DuoversePacket::SaveSync".to_string(),
        game_title: game_title.to_string(),
        app_id: app_id.map(|s| s.to_string()),
        relative_folder: save_dir
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| clean_title(game_title)),
        delta_zip_base64: b64,
        file_count,
        total_bytes: zip_buffer.len(),
        checksum,
    })
}

/// Applies a received SaveSyncPacket directly into the local player's save game directory.
pub fn apply_save_sync_delta(target_dir: &Path, packet: &SaveSyncPacket) -> Result<usize, String> {
    if !target_dir.exists() {
        fs::create_dir_all(target_dir)
            .map_err(|e| format!("Failed to create target directory: {}", e))?;
    }

    let zip_bytes = base64_decode_simple(&packet.delta_zip_base64)
        .ok_or_else(|| "Failed to decode base64 payload".to_string())?;

    let mut cursor = 0;
    let mut files_restored = 0;

    // Parse simple zip buffer
    while cursor + 30 <= zip_bytes.len() {
        if &zip_bytes[cursor..cursor + 4] == b"\x50\x4B\x03\x04" {
            let filename_len = u16::from_le_bytes([zip_bytes[cursor + 26], zip_bytes[cursor + 27]]) as usize;
            let extra_len = u16::from_le_bytes([zip_bytes[cursor + 28], zip_bytes[cursor + 29]]) as usize;
            let comp_size = u32::from_le_bytes([
                zip_bytes[cursor + 18],
                zip_bytes[cursor + 19],
                zip_bytes[cursor + 20],
                zip_bytes[cursor + 21],
            ]) as usize;

            let name_start = cursor + 30;
            if name_start + filename_len <= zip_bytes.len() {
                if let Ok(filename) = std::str::from_utf8(&zip_bytes[name_start..name_start + filename_len]) {
                    let data_start = name_start + filename_len + extra_len;
                    if data_start + comp_size <= zip_bytes.len() {
                        let file_content = &zip_bytes[data_start..data_start + comp_size];
                        let dest_path = target_dir.join(filename);
                        if let Some(parent) = dest_path.parent() {
                            let _ = fs::create_dir_all(parent);
                        }
                        fs::write(&dest_path, file_content)
                            .map_err(|e| format!("Failed to write restored save file: {}", e))?;
                        files_restored += 1;
                    }
                }
            }
            cursor = name_start + filename_len + extra_len + comp_size;
        } else {
            cursor += 1;
        }
    }

    Ok(files_restored)
}

fn clean_title(title: &str) -> String {
    title.chars().filter(|c| c.is_alphanumeric() || *c == '_' || *c == '-').collect()
}

fn crc32_simple(data: &[u8]) -> u32 {
    let mut crc = 0xFFFFFFFFu32;
    for &byte in data {
        crc ^= byte as u32;
        for _ in 0..8 {
            let mask = -( (crc & 1) as i32 ) as u32;
            crc = (crc >> 1) ^ (0xEDB88320 & mask);
        }
    }
    !crc
}

fn base64_simple(input: &[u8]) -> String {
    const TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity((input.len() + 2) / 3 * 4);
    for chunk in input.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let triple = (b0 << 16) | (b1 << 8) | b2;

        out.push(TABLE[((triple >> 18) & 0x3F) as usize] as char);
        out.push(TABLE[((triple >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            out.push(TABLE[((triple >> 6) & 0x3F) as usize] as char);
        } else {
            out.push('=');
        }
        if chunk.len() > 2 {
            out.push(TABLE[(triple & 0x3F) as usize] as char);
        } else {
            out.push('=');
        }
    }
    out
}

fn base64_decode_simple(input: &str) -> Option<Vec<u8>> {
    let mut out = Vec::new();
    let mut buf = 0u32;
    let mut bits = 0;

    for &b in input.as_bytes() {
        if b == b'=' || b.is_ascii_whitespace() {
            continue;
        }
        let val = match b {
            b'A'..=b'Z' => b - b'A',
            b'a'..=b'z' => b - b'a' + 26,
            b'0'..=b'9' => b - b'0' + 52,
            b'+' => 62,
            b'/' => 63,
            _ => return None,
        } as u32;

        buf = (buf << 6) | val;
        bits += 6;
        if bits >= 8 {
            bits -= 8;
            out.push((buf >> bits) as u8);
            buf &= (1 << bits) - 1;
        }
    }
    Some(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_expand_ludusavi_path() {
        let template = "<winSavedGames>/MyGame/Save1.dat";
        let expanded = expand_ludusavi_path(template);
        assert!(expanded.is_some());
        let s = expanded.unwrap().to_string_lossy().to_string();
        assert!(s.contains("Saved Games"));
        assert!(s.ends_with(r"MyGame\Save1.dat"));
    }

    #[test]
    fn test_save_backup_and_delta_sync() {
        let temp_dir = std::env::temp_dir().join("duoverse_test_save_sync");
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(&temp_dir).unwrap();

        let save_file = temp_dir.join("progress.dat");
        fs::write(&save_file, b"QUEST_CHAPTER_1_COMPLETE").unwrap();

        // 1. Create Pre-session backup
        let backup_res = create_pre_session_backup(&temp_dir).expect("Backup should succeed");
        assert!(backup_res.success);

        // 2. Simulate co-op play modification
        fs::write(&save_file, b"QUEST_CHAPTER_2_COMPLETE_GOLD_999").unwrap();
        let new_file = temp_dir.join("achievement.dat");
        fs::write(&new_file, b"COOP_BOSS_SLAIN").unwrap();

        // 3. Build delta sync packet
        let sync_packet = build_save_sync_delta(&temp_dir, "TestGame", Some("12345"))
            .expect("Delta should be generated");
        assert_eq!(sync_packet.packet_type, "DuoversePacket::SaveSync");
        assert_eq!(sync_packet.file_count, 2);
        assert!(!sync_packet.delta_zip_base64.is_empty());

        // 4. Client applies delta sync packet
        let client_save_dir = std::env::temp_dir().join("duoverse_test_client_save");
        let _ = fs::remove_dir_all(&client_save_dir);
        let restored = apply_save_sync_delta(&client_save_dir, &sync_packet).expect("Restore should succeed");
        assert_eq!(restored, 2);

        let client_progress = fs::read_to_string(client_save_dir.join("progress.dat")).unwrap();
        assert_eq!(client_progress, "QUEST_CHAPTER_2_COMPLETE_GOLD_999");

        let client_achieve = fs::read_to_string(client_save_dir.join("achievement.dat")).unwrap();
        assert_eq!(client_achieve, "COOP_BOSS_SLAIN");

        // Clean up
        let _ = fs::remove_dir_all(&temp_dir);
        let _ = fs::remove_dir_all(temp_dir.with_extension("duo_backup"));
        let _ = fs::remove_dir_all(&client_save_dir);
    }
}
