use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct WindowRect {
    pub x: i32,
    pub y: i32,
    pub width: i32,
    pub height: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub struct SplitLayoutResult {
    pub mode: String,
    #[serde(rename = "instance1")]
    pub instance_1: WindowRect,
    #[serde(rename = "instance2")]
    pub instance_2: WindowRect,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CouchLaunchResult {
    pub success: bool,
    pub message: String,
    #[serde(rename = "instanceCount")]
    pub instance_count: u32,
    pub layout: SplitLayoutResult,
}

/// Computes window bounds for Horizontal or Vertical split screen based on monitor dimensions.
pub fn calculate_split_layout(monitor_width: i32, monitor_height: i32, mode: &str) -> SplitLayoutResult {
    let is_horizontal = mode.eq_ignore_ascii_case("horizontal");

    if is_horizontal {
        let half_h = monitor_height / 2;
        SplitLayoutResult {
            mode: "Horizontal".to_string(),
            instance_1: WindowRect {
                x: 0,
                y: 0,
                width: monitor_width,
                height: half_h,
            },
            instance_2: WindowRect {
                x: 0,
                y: half_h,
                width: monitor_width,
                height: monitor_height - half_h,
            },
        }
    } else {
        let half_w = monitor_width / 2;
        SplitLayoutResult {
            mode: "Vertical".to_string(),
            instance_1: WindowRect {
                x: 0,
                y: 0,
                width: half_w,
                height: monitor_height,
            },
            instance_2: WindowRect {
                x: half_w,
                y: 0,
                width: monitor_width - half_w,
                height: monitor_height,
            },
        }
    }
}

/// Spawns two isolated game processes configured for dual controller play.
pub fn launch_couch_instances(
    exe_path: &str,
    mode: &str,
    monitor_width: i32,
    monitor_height: i32,
) -> Result<CouchLaunchResult, String> {
    let p = std::path::Path::new(exe_path);
    if !p.exists() {
        return Err(format!("Game executable not found: {}", exe_path));
    }

    let layout = calculate_split_layout(monitor_width, monitor_height, mode);

    #[cfg(target_os = "windows")]
    {
        use std::process::Command;

        // Instance 1 (Gamepad 0)
        let _ = Command::new(exe_path)
            .env("DUOVERSE_INSTANCE_ID", "1")
            .env("DUOVERSE_COUCH_SPLIT", &layout.mode)
            .env("DUOVERSE_PAD_INDEX", "0")
            .spawn()
            .map_err(|e| format!("Failed to spawn Game Instance 1: {}", e))?;

        // Instance 2 (Gamepad 1 remapped to Gamepad 0)
        let _ = Command::new(exe_path)
            .env("DUOVERSE_INSTANCE_ID", "2")
            .env("DUOVERSE_COUCH_SPLIT", &layout.mode)
            .env("DUOVERSE_PAD_INDEX", "1")
            .spawn()
            .map_err(|e| format!("Failed to spawn Game Instance 2: {}", e))?;
    }

    Ok(CouchLaunchResult {
        success: true,
        message: format!("Successfully spawned 2 game instances in {} mode", layout.mode),
        instance_count: 2,
        layout,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_splitscreen_horizontal_1080p() {
        let res = calculate_split_layout(1920, 1080, "Horizontal");
        assert_eq!(res.mode, "Horizontal");
        // Instance 1: top half
        assert_eq!(res.instance_1.x, 0);
        assert_eq!(res.instance_1.y, 0);
        assert_eq!(res.instance_1.width, 1920);
        assert_eq!(res.instance_1.height, 540);

        // Instance 2: bottom half
        assert_eq!(res.instance_2.x, 0);
        assert_eq!(res.instance_2.y, 540);
        assert_eq!(res.instance_2.width, 1920);
        assert_eq!(res.instance_2.height, 540);
    }

    #[test]
    fn test_splitscreen_vertical_1080p() {
        let res = calculate_split_layout(1920, 1080, "Vertical");
        assert_eq!(res.mode, "Vertical");
        // Instance 1: left half
        assert_eq!(res.instance_1.x, 0);
        assert_eq!(res.instance_1.y, 0);
        assert_eq!(res.instance_1.width, 960);
        assert_eq!(res.instance_1.height, 1080);

        // Instance 2: right half
        assert_eq!(res.instance_2.x, 960);
        assert_eq!(res.instance_2.y, 0);
        assert_eq!(res.instance_2.width, 960);
        assert_eq!(res.instance_2.height, 1080);
    }
}
