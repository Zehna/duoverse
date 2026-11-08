use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::io::Read;
use std::path::{Path, PathBuf};
use std::process::Command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DetectedGame {
    pub id: String,
    pub title: String,
    pub platform: String, // "steam" | "epic" | "custom"
    pub engine: String,   // "unity-mono" | "unity-il2cpp" | "unreal-4" | "unreal-5" | "godot" | "custom"
    #[serde(rename = "engineDisplayName")]
    pub engine_display_name: String,
    #[serde(rename = "executablePath")]
    pub executable_path: String,
    #[serde(rename = "installDirectory")]
    pub install_directory: String,
    #[serde(rename = "coverUrl")]
    pub cover_url: Option<String>,
    #[serde(rename = "coopStatus")]
    pub coop_status: String, // "ready" | "testing" | "unsupported"
    #[serde(rename = "antiCheatSafe")]
    pub anti_cheat_safe: bool,
    #[serde(rename = "antiCheatDetails")]
    pub anti_cheat_details: String,
    #[serde(rename = "appId")]
    pub app_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AdbInstalledGame {
    #[serde(rename = "packageName")]
    pub package_name: String,
    #[serde(rename = "apkPath")]
    pub apk_path: String,
    pub engine: String,
    #[serde(rename = "engineDisplayName")]
    pub engine_display_name: String,
    pub abi: String,
    #[serde(rename = "hasAntiCheat")]
    pub has_anti_cheat: bool,
    #[serde(rename = "antiCheatModules")]
    pub anti_cheat_modules: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AdbDeviceInfo {
    pub serial: String,
    pub state: String,
    pub model: String,
    pub abi: String,
    #[serde(rename = "installedGames")]
    pub installed_games: Vec<AdbInstalledGame>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LocalApkFile {
    #[serde(rename = "fileName")]
    pub file_name: String,
    #[serde(rename = "filePath")]
    pub file_path: String,
    #[serde(rename = "fileSizeBytes")]
    pub file_size_bytes: u64,
    #[serde(rename = "fileSizeFormatted")]
    pub file_size_formatted: String,
    #[serde(rename = "packageName")]
    pub package_name: String,
    pub engine: String,
    #[serde(rename = "engineDisplayName")]
    pub engine_display_name: String,
    #[serde(rename = "supportedAbis")]
    pub supported_abis: Vec<String>,
    #[serde(rename = "isCompatible")]
    pub is_compatible: bool,
    #[serde(rename = "hasAntiCheat")]
    pub has_anti_cheat: bool,
    #[serde(rename = "antiCheatModules")]
    pub anti_cheat_modules: Vec<String>,
    #[serde(rename = "statusText")]
    pub status_text: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AndroidScanSummary {
    #[serde(rename = "adbAvailable")]
    pub adb_available: bool,
    pub devices: Vec<AdbDeviceInfo>,
    #[serde(rename = "localApks")]
    pub local_apks: Vec<LocalApkFile>,
    #[serde(rename = "downloadsPath")]
    pub downloads_path: String,
}

/// Scans all local PC game libraries (Steam Registry/VDF + Epic Games Manifests).
/// Returns ONLY real games found on the machine (never mock data).
pub fn scan_all_pc_games() -> Vec<DetectedGame> {
    let mut games = Vec::new();
    let mut seen_dirs = HashSet::new();

    // 1. Scan Steam installations
    for steam_root in find_steam_roots() {
        for lib_folder in parse_steam_library_folders(&steam_root) {
            let steamapps = lib_folder.join("steamapps");
            if !steamapps.is_dir() {
                continue;
            }
            if let Ok(entries) = fs::read_dir(&steamapps) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    let fname = entry.file_name().to_string_lossy().to_string();
                    if fname.starts_with("appmanifest_") && fname.ends_with(".acf") {
                        if let Some(game) = parse_steam_appmanifest(&path, &steamapps, &steam_root) {
                            let canonical_dir = game.install_directory.to_lowercase();
                            if seen_dirs.insert(canonical_dir) {
                                games.push(game);
                            }
                        }
                    }
                }
            }
        }
    }

    // 2. Scan Epic Games Launcher manifests
    for manifest_dir in find_epic_manifest_dirs() {
        if let Ok(entries) = fs::read_dir(&manifest_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) == Some("item") {
                    if let Some(game) = parse_epic_manifest(&path) {
                        let canonical_dir = game.install_directory.to_lowercase();
                        if seen_dirs.insert(canonical_dir) {
                            games.push(game);
                        }
                    }
                }
            }
        }
    }

    games
}

/// Inspects a user-specified custom game directory and returns a `DetectedGame` if valid.
pub fn inspect_custom_game_folder(folder_path: &Path) -> Result<DetectedGame, String> {
    if !folder_path.exists() || !folder_path.is_dir() {
        return Err(format!("Directory does not exist: {}", folder_path.display()));
    }

    let folder_name = folder_path
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "Custom Game".to_string());

    let inspection = inspect_game_directory(folder_path, None);
    let exe_path = inspection.executable_path.ok_or_else(|| {
        format!(
            "No game executable (.exe) found in '{}'. Please select a valid game installation folder.",
            folder_path.display()
        )
    })?;

    let id = folder_name
        .chars()
        .map(|c| if c.is_alphanumeric() { c.to_ascii_lowercase() } else { '_' })
        .collect::<String>();

    let coop_status = if !inspection.anti_cheat_safe {
        "unsupported".to_string()
    } else if inspection.engine == "unity-mono" || inspection.engine == "unity-il2cpp" {
        "ready".to_string()
    } else {
        "testing".to_string()
    };

    Ok(DetectedGame {
        id,
        title: folder_name,
        platform: "custom".into(),
        engine: inspection.engine,
        engine_display_name: inspection.engine_display_name,
        executable_path: exe_path.to_string_lossy().to_string(),
        install_directory: folder_path.to_string_lossy().to_string(),
        cover_url: find_local_cover_in_game_dir(folder_path),
        coop_status,
        anti_cheat_safe: inspection.anti_cheat_safe,
        anti_cheat_details: inspection.anti_cheat_details,
        app_id: None,
    })
}

/// Locates Steam installation roots via Windows Registry (`HKCU\Software\Valve\Steam\SteamPath`)
/// and standard OS filesystem locations.
fn find_steam_roots() -> Vec<PathBuf> {
    let mut roots = Vec::new();
    let mut seen = HashSet::new();

    let mut add_candidate = |p: PathBuf| {
        if p.is_dir() {
            let key = p.to_string_lossy().to_lowercase();
            if seen.insert(key) {
                roots.push(p);
            }
        }
    };

    // Windows Registry lookup: HKCU\Software\Valve\Steam\SteamPath
    if cfg!(target_os = "windows") {
        let reg_queries = [
            (r"HKCU\Software\Valve\Steam", "SteamPath"),
            (r"HKLM\SOFTWARE\WOW6432Node\Valve\Steam", "InstallPath"),
            (r"HKLM\SOFTWARE\Valve\Steam", "InstallPath"),
        ];
        for (key_path, value_name) in reg_queries {
            if let Ok(output) = Command::new("reg")
                .args(["query", key_path, "/v", value_name])
                .output()
            {
                if output.status.success() {
                    let stdout = String::from_utf8_lossy(&output.stdout);
                    for line in stdout.lines() {
                        if line.contains(value_name) && line.contains("REG_SZ") {
                            if let Some(idx) = line.find("REG_SZ") {
                                let raw_path = line[idx + "REG_SZ".len()..].trim().replace('/', "\\");
                                add_candidate(PathBuf::from(raw_path));
                            }
                        }
                    }
                }
            }
        }

        // Standard Windows drive paths
        for drive in ['C', 'D', 'E', 'F', 'G'] {
            add_candidate(PathBuf::from(format!(r"{}:\Program Files (x86)\Steam", drive)));
            add_candidate(PathBuf::from(format!(r"{}:\Program Files\Steam", drive)));
            add_candidate(PathBuf::from(format!(r"{}:\Steam", drive)));
            add_candidate(PathBuf::from(format!(r"{}:\SteamLibrary", drive)));
        }
    } else {
        // Linux / SteamOS standard paths
        if let Ok(home) = std::env::var("HOME") {
            let home_path = PathBuf::from(home);
            add_candidate(home_path.join(".steam/steam"));
            add_candidate(home_path.join(".local/share/Steam"));
            add_candidate(home_path.join(".var/app/com.valvesoftware.Steam/data/Steam"));
        }
    }

    roots
}

/// Parses `steamapps/libraryfolders.vdf` to extract all Steam library folders across drives.
pub fn parse_steam_library_folders(steam_root: &Path) -> Vec<PathBuf> {
    let mut folders = Vec::new();
    let mut seen = HashSet::new();

    let mut add_folder = |p: PathBuf| {
        if p.is_dir() {
            let key = p.to_string_lossy().to_lowercase();
            if seen.insert(key) {
                folders.push(p);
            }
        }
    };

    add_folder(steam_root.to_path_buf());

    let vdf_path = steam_root.join("steamapps").join("libraryfolders.vdf");
    if let Ok(content) = fs::read_to_string(&vdf_path) {
        for line in content.lines() {
            let trimmed = line.trim();
            if let Some((key, val)) = parse_vdf_key_value(trimmed) {
                if key.eq_ignore_ascii_case("path") {
                    let normalized = val.replace("\\\\", "\\");
                    add_folder(PathBuf::from(normalized));
                }
            }
        }
    }

    folders
}

/// Parses a single line `"key" "value"` from a Valve KeyValue (.vdf / .acf) file.
fn parse_vdf_key_value(line: &str) -> Option<(String, String)> {
    let mut parts = Vec::new();
    let mut chars = line.chars().peekable();

    while let Some(&ch) = chars.peek() {
        if ch == '"' {
            chars.next(); // consume opening quote
            let mut token = String::new();
            while let Some(c) = chars.next() {
                if c == '\\' {
                    if let Some(escaped) = chars.next() {
                        token.push('\\');
                        token.push(escaped);
                    }
                } else if c == '"' {
                    break;
                } else {
                    token.push(c);
                }
            }
            parts.push(token);
            if parts.len() == 2 {
                return Some((parts[0].clone(), parts[1].clone()));
            }
        } else {
            chars.next();
        }
    }
    None
}

/// Parses `appmanifest_<appid>.acf` and inspects the corresponding game installation directory.
fn parse_steam_appmanifest(acf_path: &Path, steamapps_dir: &Path, steam_root: &Path) -> Option<DetectedGame> {
    let content = fs::read_to_string(acf_path).ok()?;
    let mut app_id = None;
    let mut name = None;
    let mut install_dir_name = None;

    for line in content.lines() {
        if let Some((k, v)) = parse_vdf_key_value(line.trim()) {
            match k.to_ascii_lowercase().as_str() {
                "appid" => app_id = Some(v),
                "name" => name = Some(v),
                "installdir" => install_dir_name = Some(v),
                _ => {}
            }
        }
    }

    let app_id = app_id?;
    let name = name?;
    let install_dir_name = install_dir_name?;

    // Exclude redistributables, runtimes, and Proton layers
    let lower_name = name.to_lowercase();
    if app_id == "228980"
        || lower_name.starts_with("proton ")
        || lower_name.starts_with("steam linux runtime")
        || lower_name.contains("steamworks common redistributables")
    {
        return None;
    }

    let game_dir = steamapps_dir.join("common").join(&install_dir_name);
    if !game_dir.is_dir() {
        return None;
    }

    let inspection = inspect_game_directory(&game_dir, None);
    let exe_path = inspection.executable_path?;

    let cover_url = resolve_steam_cover(steam_root, &app_id);

    let coop_status = if !inspection.anti_cheat_safe {
        "unsupported".to_string()
    } else if inspection.engine == "unity-mono" || inspection.engine == "unity-il2cpp" {
        "ready".to_string()
    } else {
        "testing".to_string()
    };

    Some(DetectedGame {
        id: format!("steam_{}", app_id),
        title: name,
        platform: "steam".into(),
        engine: inspection.engine,
        engine_display_name: inspection.engine_display_name,
        executable_path: exe_path.to_string_lossy().to_string(),
        install_directory: game_dir.to_string_lossy().to_string(),
        cover_url,
        coop_status,
        anti_cheat_safe: inspection.anti_cheat_safe,
        anti_cheat_details: inspection.anti_cheat_details,
        app_id: Some(app_id),
    })
}

/// Checks local Steam `appcache/librarycache` for cover art, falling back to official Steam CDN URL for that real AppID.
fn resolve_steam_cover(steam_root: &Path, app_id: &str) -> Option<String> {
    let cache_dir = steam_root.join("appcache").join("librarycache");
    let candidates = [
        cache_dir.join(format!("{}_library_600x900.jpg", app_id)),
        cache_dir.join(app_id).join("library_600x900.jpg"),
        cache_dir.join(format!("{}_header.jpg", app_id)),
        cache_dir.join(app_id).join("header.jpg"),
    ];

    for candidate in candidates {
        if candidate.is_file() {
            if let Some(data_uri) = file_to_data_uri(&candidate, "image/jpeg") {
                return Some(data_uri);
            }
        }
    }

    // Real Steam CDN cover URL corresponding to the detected AppID
    Some(format!(
        "https://cdn.akamai.steamstatic.com/steam/apps/{}/library_600x900.jpg",
        app_id
    ))
}

fn find_local_cover_in_game_dir(game_dir: &Path) -> Option<String> {
    let candidates = ["cover.jpg", "cover.png", "header.jpg", "icon.png"];
    for name in candidates {
        let p = game_dir.join(name);
        if p.is_file() {
            let mime = if name.ends_with(".png") { "image/png" } else { "image/jpeg" };
            if let Some(uri) = file_to_data_uri(&p, mime) {
                return Some(uri);
            }
        }
    }
    None
}

fn file_to_data_uri(path: &Path, mime: &str) -> Option<String> {
    let bytes = fs::read(path).ok()?;
    if bytes.len() > 4 * 1024 * 1024 {
        return None; // Skip overly huge images
    }
    let encoded = base64_encode(&bytes);
    Some(format!("data:{};base64,{}", mime, encoded))
}

fn base64_encode(input: &[u8]) -> String {
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

/// Locates Epic Games Launcher Manifests directory (`%ProgramData%\Epic\EpicGamesLauncher\Data\Manifests`).
fn find_epic_manifest_dirs() -> Vec<PathBuf> {
    let mut dirs = Vec::new();
    if cfg!(target_os = "windows") {
        let program_data = std::env::var("ProgramData").unwrap_or_else(|_| r"C:\ProgramData".to_string());
        let epic_dir = PathBuf::from(program_data)
            .join("Epic")
            .join("EpicGamesLauncher")
            .join("Data")
            .join("Manifests");
        if epic_dir.is_dir() {
            dirs.push(epic_dir);
        }
    } else if let Ok(home) = std::env::var("HOME") {
        let heroic_dir = PathBuf::from(home).join(".config/heroic/EpicGamesLauncher/Data/Manifests");
        if heroic_dir.is_dir() {
            dirs.push(heroic_dir);
        }
    }
    dirs
}

/// Parses an Epic Games `.item` JSON manifest file.
fn parse_epic_manifest(item_path: &Path) -> Option<DetectedGame> {
    let content = fs::read_to_string(item_path).ok()?;
    let json: serde_json::Value = serde_json::from_str(&content).ok()?;

    let display_name = json.get("DisplayName")?.as_str()?.to_string();
    let install_location = json.get("InstallLocation")?.as_str()?;
    let launch_exe = json.get("LaunchExecutable").and_then(|v| v.as_str());
    let app_name = json
        .get("AppName")
        .and_then(|v| v.as_str())
        .unwrap_or(&display_name)
        .to_string();

    let game_dir = PathBuf::from(install_location);
    if !game_dir.is_dir() {
        return None;
    }

    let inspection = inspect_game_directory(&game_dir, launch_exe);
    let exe_path = inspection.executable_path?;

    let coop_status = if !inspection.anti_cheat_safe {
        "unsupported".to_string()
    } else if inspection.engine == "unity-mono" || inspection.engine == "unity-il2cpp" {
        "ready".to_string()
    } else {
        "testing".to_string()
    };

    Some(DetectedGame {
        id: format!("epic_{}", app_name.to_lowercase()),
        title: display_name,
        platform: "epic".into(),
        engine: inspection.engine,
        engine_display_name: inspection.engine_display_name,
        executable_path: exe_path.to_string_lossy().to_string(),
        install_directory: game_dir.to_string_lossy().to_string(),
        cover_url: find_local_cover_in_game_dir(&game_dir),
        coop_status,
        anti_cheat_safe: inspection.anti_cheat_safe,
        anti_cheat_details: inspection.anti_cheat_details,
        app_id: Some(app_name),
    })
}

struct DirInspectionResult {
    executable_path: Option<PathBuf>,
    engine: String,
    engine_display_name: String,
    anti_cheat_safe: bool,
    anti_cheat_details: String,
}

/// Walks a game installation directory (up to depth 3) to identify:
/// 1. Primary game `.exe` binary
/// 2. Game engine signature (`UnityPlayer.dll`, `*_Data`, `Managed/Assembly-CSharp.dll`, `GameAssembly.dll`, `Engine/Binaries/Win64`)
/// 3. Kernel anti-cheat presence (`EasyAntiCheat`, `BattlEye`, `vgk.sys`, `Ricochet`)
fn inspect_game_directory(game_dir: &Path, preferred_exe: Option<&str>) -> DirInspectionResult {
    let mut has_unity_player = false;
    let mut has_unity_data_dir = false;
    let mut has_assembly_csharp = false;
    let mut has_game_assembly_il2cpp = false;
    let mut has_unreal_binaries = false;
    let mut has_godot_pck = false;

    let mut anti_cheat_hits: Vec<String> = Vec::new();
    let mut exe_candidates: Vec<(PathBuf, u64)> = Vec::new();

    if let Some(pref) = preferred_exe {
        let p = game_dir.join(pref);
        if p.is_file() {
            let size = p.metadata().map(|m| m.len()).unwrap_or(0);
            exe_candidates.push((p, size + 1_000_000_000)); // boost preferred exe
        }
    }

    let mut stack: Vec<(PathBuf, usize)> = vec![(game_dir.to_path_buf(), 0)];

    while let Some((current_dir, depth)) = stack.pop() {
        if depth > 3 {
            continue;
        }
        let entries = match fs::read_dir(&current_dir) {
            Ok(e) => e,
            Err(_) => continue,
        };

        for entry in entries.flatten() {
            let path = entry.path();
            let fname = entry.file_name().to_string_lossy().to_string();
            let lower = fname.to_lowercase();

            if path.is_dir() {
                if lower.ends_with("_data") {
                    has_unity_data_dir = true;
                }
                if lower == "easyanticheat" && !anti_cheat_hits.iter().any(|s| s.contains("Easy Anti-Cheat")) {
                    anti_cheat_hits.push("Easy Anti-Cheat (EAC)".into());
                }
                if lower == "battleye" && !anti_cheat_hits.iter().any(|s| s.contains("BattlEye")) {
                    anti_cheat_hits.push("BattlEye".into());
                }
                if lower == "binaries" {
                    if path.join("Win64").is_dir() || path.join("WinGDK").is_dir() {
                        has_unreal_binaries = true;
                    }
                }
                stack.push((path, depth + 1));
            } else if path.is_file() {
                // Engine file markers
                if lower == "unityplayer.dll" {
                    has_unity_player = true;
                } else if lower == "assembly-csharp.dll" {
                    has_assembly_csharp = true;
                } else if lower == "gameassembly.dll" {
                    has_game_assembly_il2cpp = true;
                } else if lower.ends_with("-win64-shipping.exe") {
                    has_unreal_binaries = true;
                } else if lower.ends_with(".pck") {
                    has_godot_pck = true;
                }

                // Anti-cheat file markers
                if (lower.starts_with("easyanticheat") || lower == "eac_server.dll")
                    && !anti_cheat_hits.iter().any(|s| s.contains("Easy Anti-Cheat"))
                {
                    anti_cheat_hits.push("Easy Anti-Cheat (EAC)".into());
                } else if (lower == "beservice.exe" || lower == "beservice_x64.exe" || lower.starts_with("beclient"))
                    && !anti_cheat_hits.iter().any(|s| s.contains("BattlEye"))
                {
                    anti_cheat_hits.push("BattlEye".into());
                } else if (lower == "vgk.sys" || lower == "vgc.exe")
                    && !anti_cheat_hits.iter().any(|s| s.contains("Vanguard"))
                {
                    anti_cheat_hits.push("Riot Vanguard".into());
                } else if lower == "randgrid.sys" && !anti_cheat_hits.iter().any(|s| s.contains("Ricochet")) {
                    anti_cheat_hits.push("Ricochet Anti-Cheat".into());
                }

                // Executable candidate check
                if lower.ends_with(".exe") && !is_helper_executable(&lower) {
                    let size = path.metadata().map(|m| m.len()).unwrap_or(0);
                    // Prefer root-level executables
                    let depth_bonus = if depth == 0 { 50_000_000 } else { 0 };
                    exe_candidates.push((path, size + depth_bonus));
                }
            }
        }
    }

    exe_candidates.sort_by(|a, b| b.1.cmp(&a.1));
    let executable_path = exe_candidates.into_iter().next().map(|(p, _)| p);

    let (engine, engine_display_name) = if has_unity_player || has_unity_data_dir || has_assembly_csharp {
        if has_game_assembly_il2cpp && !has_assembly_csharp {
            ("unity-il2cpp".into(), "Unity (IL2CPP)".into())
        } else {
            ("unity-mono".into(), "Unity (Mono / BepInEx)".into())
        }
    } else if has_unreal_binaries {
        ("unreal-4".into(), "Unreal Engine (Win64)".into())
    } else if has_godot_pck {
        ("godot".into(), "Godot Engine".into())
    } else {
        ("custom".into(), "Native / Custom Engine".into())
    };

    let anti_cheat_safe = anti_cheat_hits.is_empty();
    let anti_cheat_details = if anti_cheat_safe {
        "Clean (0 kernel anti-cheat signatures)".into()
    } else {
        format!("Detected: {}", anti_cheat_hits.join(", "))
    };

    DirInspectionResult {
        executable_path,
        engine,
        engine_display_name,
        anti_cheat_safe,
        anti_cheat_details,
    }
}

fn is_helper_executable(lower_name: &str) -> bool {
    let ignore_patterns = [
        "unitycrashhandler",
        "crashreport",
        "unins000",
        "uninstall",
        "vc_redist",
        "vcredist",
        "dxsetup",
        "dxwebsetup",
        "ue4prereqsetup",
        "ueprereqsetup",
        "dotnet",
        "easyanticheat",
        "beservice",
        "launcher_helper",
    ];
    ignore_patterns.iter().any(|pat| lower_name.contains(pat))
}

// ============================================================================
// REAL ANDROID SCANNER (ADB Devices + Local Downloads APK Inspector)
// ============================================================================

/// Scans connected Android devices via `adb devices -l` and scans the user's `Downloads` folder for `.apk` files.
pub fn scan_android_environment() -> AndroidScanSummary {
    let (adb_available, devices) = scan_adb_devices();
    let downloads_dir = get_user_downloads_dir();
    let local_apks = scan_downloads_for_apks(&downloads_dir);

    AndroidScanSummary {
        adb_available,
        devices,
        local_apks,
        downloads_path: downloads_dir.to_string_lossy().to_string(),
    }
}

fn scan_adb_devices() -> (bool, Vec<AdbDeviceInfo>) {
    let output = match Command::new("adb").arg("devices").arg("-l").output() {
        Ok(o) => o,
        Err(_) => return (false, Vec::new()),
    };

    if !output.status.success() {
        return (false, Vec::new());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut devices = Vec::new();

    for line in stdout.lines().skip(1) {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('*') {
            continue;
        }
        let parts: Vec<&str> = trimmed.split_whitespace().collect();
        if parts.len() < 2 {
            continue;
        }
        let serial = parts[0].to_string();
        let state = parts[1].to_string();

        let mut model = "Android Device".to_string();
        for part in &parts[2..] {
            if let Some(m) = part.strip_prefix("model:") {
                model = m.replace('_', " ");
            }
        }

        let mut abi = "arm64-v8a".to_string();
        let mut installed_games = Vec::new();

        if state == "device" {
            if let Ok(abi_out) = Command::new("adb")
                .args(["-s", &serial, "shell", "getprop", "ro.product.cpu.abi"])
                .output()
            {
                let parsed_abi = String::from_utf8_lossy(&abi_out.stdout).trim().to_string();
                if !parsed_abi.is_empty() {
                    abi = parsed_abi;
                }
            }
            installed_games = scan_adb_installed_packages(&serial, &abi);
        }

        devices.push(AdbDeviceInfo {
            serial,
            state,
            model,
            abi,
            installed_games,
        });
    }

    (true, devices)
}

fn scan_adb_installed_packages(serial: &str, default_abi: &str) -> Vec<AdbInstalledGame> {
    let mut games = Vec::new();
    let output = match Command::new("adb")
        .args(["-s", serial, "shell", "pm", "list", "packages", "-3", "-f"])
        .output()
    {
        Ok(o) if o.status.success() => o,
        _ => return games,
    };

    let stdout = String::from_utf8_lossy(&output.stdout);
    for line in stdout.lines().take(25) {
        // Format: package:/data/app/~~.../com.company.game-.../base.apk=com.company.game
        if let Some(stripped) = line.trim().strip_prefix("package:") {
            if let Some(eq_idx) = stripped.rfind('=') {
                let apk_path = stripped[..eq_idx].to_string();
                let pkg_name = stripped[eq_idx + 1..].to_string();

                // Check native lib directory next to base.apk on device
                let parent_dir = apk_path.rsplit_once('/').map(|(p, _)| p).unwrap_or("");
                let mut engine = "unknown".to_string();
                let mut engine_display = "Android Native App".to_string();
                let mut has_ac = false;
                let mut ac_mods = Vec::new();

                if !parent_dir.is_empty() {
                    if let Ok(ls_out) = Command::new("adb")
                        .args(["-s", serial, "shell", "ls", &format!("{}/lib/arm64", parent_dir)])
                        .output()
                    {
                        let libs = String::from_utf8_lossy(&ls_out.stdout);
                        if libs.contains("libil2cpp.so") {
                            engine = "unity-il2cpp".into();
                            engine_display = "Unity (IL2CPP ARM64)".into();
                        } else if libs.contains("libmonobdwgc") || libs.contains("libmono.so") {
                            engine = "unity-mono".into();
                            engine_display = "Unity (Mono)".into();
                        } else if libs.contains("libUE4.so") || libs.contains("libUnreal.so") {
                            engine = "unreal".into();
                            engine_display = "Unreal Engine Mobile".into();
                        } else if libs.contains("libgodot_android.so") {
                            engine = "godot".into();
                            engine_display = "Godot Mobile".into();
                        }

                        for sig in ["libtprt.so", "libtermp.so", "libnesec.so", "libxigncode.so"] {
                            if libs.contains(sig) {
                                has_ac = true;
                                ac_mods.push(sig.to_string());
                            }
                        }
                    }
                }

                games.push(AdbInstalledGame {
                    package_name: pkg_name,
                    apk_path,
                    engine,
                    engine_display_name: engine_display,
                    abi: default_abi.to_string(),
                    has_anti_cheat: has_ac,
                    anti_cheat_modules: ac_mods,
                });
            }
        }
    }

    games
}

fn get_user_downloads_dir() -> PathBuf {
    if cfg!(target_os = "windows") {
        if let Ok(profile) = std::env::var("USERPROFILE") {
            return PathBuf::from(profile).join("Downloads");
        }
    }
    if let Ok(home) = std::env::var("HOME") {
        return PathBuf::from(home).join("Downloads");
    }
    PathBuf::from(".")
}

pub fn scan_downloads_for_apks(downloads_dir: &Path) -> Vec<LocalApkFile> {
    let mut apks = Vec::new();
    if !downloads_dir.is_dir() {
        return apks;
    }

    if let Ok(entries) = fs::read_dir(downloads_dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                    if ext.eq_ignore_ascii_case("apk") {
                        if let Some(analyzed) = inspect_apk_file(&path) {
                            apks.push(analyzed);
                        }
                    }
                }
            }
        }
    }

    apks
}

/// Inspects a local `.apk` file on disk by scanning its ZIP entry filenames for
/// `lib/<abi>/libil2cpp.so`, `Assembly-CSharp.dll`, `libUE4.so`, and anti-cheat `.so` modules.
pub fn inspect_apk_file(apk_path: &Path) -> Option<LocalApkFile> {
    let meta = fs::metadata(apk_path).ok()?;
    let size_bytes = meta.len();
    let file_name = apk_path.file_name()?.to_string_lossy().to_string();
    let package_name = file_name
        .strip_suffix(".apk")
        .or_else(|| file_name.strip_suffix(".APK"))
        .unwrap_or(&file_name)
        .to_lowercase();

    let entries = read_zip_entry_names(apk_path).unwrap_or_default();

    let mut abis_set = HashSet::new();
    let mut has_il2cpp = false;
    let mut has_mono = false;
    let mut has_unreal = false;
    let mut has_godot = false;
    let mut ac_modules = Vec::new();

    let known_ac = [
        "libtprt.so",
        "libtermp.so",
        "libnesec.so",
        "libmsaoaidsec.so",
        "libxigncode.so",
        "libanort.so",
    ];

    for name in &entries {
        if let Some(rest) = name.strip_prefix("lib/") {
            if let Some((abi, lib_file)) = rest.split_once('/') {
                abis_set.insert(abi.to_string());
                if lib_file == "libil2cpp.so" {
                    has_il2cpp = true;
                } else if lib_file == "libUE4.so" || lib_file == "libUnreal.so" {
                    has_unreal = true;
                } else if lib_file == "libgodot_android.so" {
                    has_godot = true;
                }
                if known_ac.contains(&lib_file) && !ac_modules.contains(&lib_file.to_string()) {
                    ac_modules.push(lib_file.to_string());
                }
            }
        } else if name.contains("Managed/Assembly-CSharp.dll") {
            has_mono = true;
        }
    }

    let mut supported_abis: Vec<String> = abis_set.into_iter().collect();
    supported_abis.sort();

    let (engine, engine_display_name) = if has_il2cpp {
        ("unity-il2cpp".to_string(), "Unity (IL2CPP ARM64)".to_string())
    } else if has_mono {
        ("unity-mono".to_string(), "Unity (Mono Android)".to_string())
    } else if has_unreal {
        ("unreal".to_string(), "Unreal Engine 4/5".to_string())
    } else if has_godot {
        ("godot".to_string(), "Godot Engine".to_string())
    } else {
        ("unknown".to_string(), "Native / Unknown Engine".to_string())
    };

    let has_anti_cheat = !ac_modules.is_empty();
    let is_compatible = !has_anti_cheat && (has_il2cpp || has_mono || has_unreal || has_godot);
    let status_text = if has_anti_cheat {
        "Unsupported (Anti-Cheat Detected)".to_string()
    } else if is_compatible {
        "Ready for Co-op Repack".to_string()
    } else {
        "Unrecognized Engine Structure".to_string()
    };

    Some(LocalApkFile {
        file_name,
        file_path: apk_path.to_string_lossy().to_string(),
        file_size_bytes: size_bytes,
        file_size_formatted: format_bytes(size_bytes),
        package_name,
        engine,
        engine_display_name,
        supported_abis,
        is_compatible,
        has_anti_cheat,
        anti_cheat_modules: ac_modules,
        status_text,
    })
}

/// Lightweight parser that extracts entry filenames from a ZIP/APK archive without external crates.
fn read_zip_entry_names(zip_path: &Path) -> Option<Vec<String>> {
    let mut file = fs::File::open(zip_path).ok()?;
    let mut buf = Vec::new();
    file.read_to_end(&mut buf).ok()?;

    let mut names = Vec::new();
    let mut i = 0;
    // Scan Local File Headers (signature 0x04034b50 -> PK\x03\x04)
    while i + 30 <= buf.len() {
        if buf[i] == 0x50 && buf[i + 1] == 0x4B && buf[i + 2] == 0x03 && buf[i + 3] == 0x04 {
            let name_len = u16::from_le_bytes([buf[i + 26], buf[i + 27]]) as usize;
            let extra_len = u16::from_le_bytes([buf[i + 28], buf[i + 29]]) as usize;
            let comp_size = u32::from_le_bytes([buf[i + 18], buf[i + 19], buf[i + 20], buf[i + 21]]) as usize;
            let name_start = i + 30;
            if name_start + name_len <= buf.len() {
                if let Ok(name) = std::str::from_utf8(&buf[name_start..name_start + name_len]) {
                    names.push(name.to_string());
                }
            }
            let next = name_start + name_len + extra_len + comp_size;
            if next > i {
                i = next;
                continue;
            }
        }
        i += 1;
    }

    Some(names)
}

fn format_bytes(bytes: u64) -> String {
    if bytes == 0 {
        return "0 B".to_string();
    }
    let units = ["B", "KB", "MB", "GB"];
    let mut size = bytes as f64;
    let mut unit_idx = 0;
    while size >= 1024.0 && unit_idx < units.len() - 1 {
        size /= 1024.0;
        unit_idx += 1;
    }
    format!("{:.2} {}", size, units[unit_idx])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_vdf_key_value() {
        let line = r#"		"path"		"D:\\SteamLibrary""#;
        let parsed = parse_vdf_key_value(line);
        assert_eq!(
            parsed,
            Some(("path".to_string(), r"D:\\SteamLibrary".to_string()))
        );
    }

    #[test]
    fn test_inspect_real_sample_unity_game_folder() {
        let sample_dir = PathBuf::from("../../../foundry/samples/sample_unity_game");
        if sample_dir.exists() {
            let game = inspect_custom_game_folder(&sample_dir).expect("Should detect sample unity game");
            assert_eq!(game.engine, "unity-mono");
            assert!(game.anti_cheat_safe);
            assert!(game.executable_path.ends_with("Game.exe"));
        }
    }
}

