//! Ludusavi Manifest Parser and Save Game Synchronizer
//! Reference: mtkennerly/ludusavi & ludusavi-manifest

use std::collections::HashMap;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone)]
pub struct LudusaviGameEntry {
    pub name: String,
    pub steam_id: Option<u32>,
    pub gog_id: Option<u64>,
    pub file_patterns: Vec<String>,
}

#[derive(Debug, Default)]
pub struct LudusaviManifest {
    pub games: HashMap<String, LudusaviGameEntry>,
    pub steam_id_map: HashMap<u32, String>,
}

impl LudusaviManifest {
    pub fn new() -> Self {
        Self::default()
    }

    /// Register a game entry with file patterns
    pub fn register_game(&mut self, name: &str, steam_id: Option<u32>, patterns: Vec<String>) {
        let entry = LudusaviGameEntry {
            name: name.to_string(),
            steam_id,
            gog_id: None,
            file_patterns: patterns,
        };

        if let Some(sid) = steam_id {
            self.steam_id_map.insert(sid, name.to_string());
        }
        self.games.insert(name.to_lowercase(), entry);
    }

    /// Resolve candidate save directory paths for a game
    pub fn resolve_save_paths(&self, name: &str, steam_id: Option<u32>) -> Vec<PathBuf> {
        let mut paths = Vec::new();

        // 1. Check by Steam ID
        if let Some(sid) = steam_id {
            if let Some(game_name) = self.steam_id_map.get(&sid) {
                if let Some(entry) = self.games.get(&game_name.to_lowercase()) {
                    for pat in &entry.file_patterns {
                        if let Some(expanded) = crate::save_sync::expand_ludusavi_path(pat) {
                            paths.push(expanded);
                        }
                    }
                }
            }
        }

        // 2. Check by name
        if let Some(entry) = self.games.get(&name.to_lowercase()) {
            for pat in &entry.file_patterns {
                if let Some(expanded) = crate::save_sync::expand_ludusavi_path(pat) {
                    paths.push(expanded);
                }
            }
        }

        paths
    }
}
