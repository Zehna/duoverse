import os
import sys
import json
import re
import yaml
from pathlib import Path

repo_root = Path(r"c:\Users\benny\duoverse")
coop_dir = repo_root / "tools" / "coop-anything"
output_dir = repo_root / "foundry" / "catalog"
output_dir.mkdir(parents=True, exist_ok=True)

yaml_path = coop_dir / "data" / "directory.yaml"
with open(yaml_path, "r", encoding="utf-8") as f:
    entries = yaml.safe_load(f)

# Well-known Steam AppIDs for catalog games
KNOWN_APPIDS = {
    "balatro": "2379780",
    "celeste": "504230",
    "subnautica": "264710",
    "subnautica: below zero": "848450",
    "elden ring": "1245620",
    "cyberpunk 2077": "1091500",
    "the elder scrolls v: skyrim": "72850",
    "the elder scrolls v: skyrim special edition": "489830",
    "skyrim": "489830",
    "fallout 4": "377160",
    "fallout: new vegas": "22380",
    "outer wilds": "753640",
    "risk of rain 2": "632360",
    "valheim": "892970",
    "hollow knight": "367520",
    "slay the spire": "646570",
    "stray": "1332010",
    "palworld": "1623730",
    "resident evil 4": "2050650",
    "resident evil 2": "883710",
    "resident evil 3": "952060",
    "resident evil 7: biohazard": "418370",
    "resident evil village": "1196590",
    "cult of the lamb": "1313140",
    "lethal company": "1966720",
    "dave the diver": "1868140",
    "ultrakill": "1229490",
    "the binding of isaac: rebirth": "250900",
    "binding of isaac": "250900",
    "cuphead": "268910",
    "dark souls: prepare to die edition": "211420",
    "dark souls: remastered": "570940",
    "dark souls ii": "236430",
    "dark souls iii": "374320",
    "sekiro: shadows die twice": "814380",
    "hades": "1145360",
    "monster hunter: world": "582010",
    "superhot": "322500",
    "bioshock": "7670",
    "bioshock remastered": "409710",
    "mirrors edge": "17410",
    "mirror's edge": "17410",
    "firewatch": "383870",
    "portal 2": "620",
    "half-life 2": "220",
    "neon white": "1533420",
    "pizza tower": "2231450",
    "tunic": "553420",
    "alien: isolation": "214490",
    "battletech": "637090",
    "code vein": "678960",
    "crash bandicoot 4": "1378990",
    "crysis": "17300",
    "darksiders": "50620",
    "dishonored": "205100",
    "dead space": "17470",
    "dying light": "239140",
    "enter the gungeon": "311690",
    "final fantasy vii remake": "1462040",
    "ghostrunner": "1139900",
    "gothic": "65540",
    "grand theft auto: san andreas": "12120",
    "grand theft auto: vice city": "12110",
    "grand theft auto iii": "12100",
    "grand theft auto iv": "12210",
    "grand theft auto v": "271590",
    "hitman: blood money": "6860",
    "hotline miami": "219150",
    "insurgency": "222880",
    "just cause 2": "8190",
    "just cause 3": "225540",
    "kingdom come: deliverance": "379430",
    "left 4 dead 2": "550",
    "mad max": "234140",
    "mafia": "40990",
    "mafia ii": "50130",
    "mass effect": "17460",
    "mass effect 2": "24960",
    "max payne": "12140",
    "max payne 2": "12150",
    "metal gear solid v": "287700",
    "metro 2033": "43110",
    "metro: last light": "43160",
    "mount & blade: warband": "48700",
    "nier: automata": "524220",
    "no man's sky": "275850",
    "payday: the heist": "24240",
    "prey": "480490",
    "prototype": "10150",
    "s.t.a.l.k.e.r.: shadow of chernobyl": "4500",
    "saints row 2": "9480",
    "shadow warrior": "233130",
    "sleeping dogs": "202170",
    "sniper elite v2": "63380",
    "spec ops: the line": "50300",
    "star wars: battlefront ii (2005)": "6060",
    "star wars: republic commando": "6000",
    "terraria": "105600",
    "the forest": "242760",
    "the witcher 3: wild hunt": "292030",
    "the witcher 2: assassins of kings": "20920",
    "titanfall 2": "1237970",
    "tomb raider": "203160",
    "trackmania": "2225070",
    "vampire: the masquerade - bloodlines": "2600",
    "wolfenstein: the new order": "201810",
    "xcom: enemy unknown": "200510",
    "yakuza 0": "638970",
}

# Scan games directories for appids and payloads
game_profiles = {}
games_dir = coop_dir / "games"
if games_dir.exists():
    for gdir in games_dir.iterdir():
        if gdir.is_dir():
            readme = gdir / "README.md"
            if readme.exists():
                text = readme.read_text(encoding="utf-8", errors="ignore")
                m_appid = re.search(r"appid\s*(\d+)", text, re.IGNORECASE)
                appid = m_appid.group(1) if m_appid else None
                
                # Check payload clues
                payload = None
                lower_text = text.lower()
                if "bepinex" in lower_text:
                    payload = "BepInEx"
                elif "lovely" in lower_text:
                    payload = "Lovely-Lua"
                elif "ue4ss" in lower_text:
                    payload = "UE4SS"
                elif "smapi" in lower_text:
                    payload = "SMAPI"
                elif "repack" in lower_text:
                    payload = "Apk-Repack"
                
                game_profiles[gdir.name.lower()] = {
                    "appid": appid,
                    "payload": payload,
                    "dir": gdir.name
                }

processed_catalog = []
seen_keys = set()

for entry in entries:
    game_name = entry.get("game", "").strip()
    if not game_name or entry.get("kind") == "gap":
        continue
    
    project = entry.get("project", "Co-op Mod")
    engine = entry.get("engine", "Unknown")
    qa_raw = entry.get("qa", "none")
    status = entry.get("status", "playable")
    
    # Map QA status (Verified / Community / Experimental)
    if qa_raw in ("verified-playthrough", "automated"):
        qa_status = "Verified"
    elif qa_raw == "community-reports":
        qa_status = "Community"
    else:
        qa_status = "Experimental"
    
    # Find AppID
    appid = None
    lower_name = game_name.lower()
    for k, v in KNOWN_APPIDS.items():
        if k == lower_name or k in lower_name or lower_name in k:
            appid = v
            break
    
    folder_slug = re.sub(r"[^a-z0-9]+", "-", lower_name).strip("-")
    if folder_slug in game_profiles and game_profiles[folder_slug]["appid"]:
        appid = game_profiles[folder_slug]["appid"]
        
    if not appid:
        for u in entry.get("sources", []) + [entry.get("url", "")]:
            m = re.search(r"store\.steampowered\.com/app/(\d+)", str(u))
            if m:
                appid = m.group(1)
                break
            m = re.search(r"steamcommunity\.com/app/(\d+)", str(u))
            if m:
                appid = m.group(1)
                break

    # Determine payload
    payload = None
    if folder_slug in game_profiles and game_profiles[folder_slug]["payload"]:
        payload = game_profiles[folder_slug]["payload"]
    
    if not payload:
        lower_engine = engine.lower()
        if "unity" in lower_engine:
            payload = "BepInEx"
        elif "unreal" in lower_engine:
            payload = "UE4SS"
        elif "godot" in lower_engine:
            payload = "Godot-Native"
        elif "love" in lower_engine:
            payload = "Lovely-Lua"
        else:
            payload = "Native-VFS"

    proj_clean = re.sub(r"[^a-z0-9]+", "_", project.lower()).strip("_")
    unique_id = f"{folder_slug}_{proj_clean}"
    if unique_id in seen_keys:
        continue
    seen_keys.add(unique_id)

    processed_catalog.append({
        "id": unique_id,
        "title": game_name,
        "slug": folder_slug,
        "appId": appid,
        "engine": engine,
        "qaStatus": qa_status,
        "status": status,
        "project": project,
        "payloadType": payload,
        "url": entry.get("url", ""),
        "networking": entry.get("networking", "direct-ip"),
        "notes": entry.get("notes", "")
    })

catalog_path = output_dir / "coop_db.json"
with open(catalog_path, "w", encoding="utf-8") as f:
    json.dump({
        "version": "1.0.0",
        "generatedAt": "2026-11-08",
        "totalGames": len(processed_catalog),
        "games": processed_catalog
    }, f, indent=2)

print(f"Successfully exported {len(processed_catalog)} catalog entries to {catalog_path}")
