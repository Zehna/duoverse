#!/usr/bin/env python3
"""APK Structure and Engine Inspector for Duoverse."""

import zipfile
import re
from pathlib import Path
from dataclasses import dataclass, field
from typing import List, Optional

KNOWN_ANTI_CHEAT_SIGNATURES = [
    "libtprt.so",      # Tencent ACE
    "libtermp.so",     # Tencent Protect
    "libnesec.so",     # NetEase Sec
    "libmsaoaidsec.so",# MSA Security
    "libxigncode.so",  # Wellbia XIGNCODE3
    "libanort.so",     # AhnLab
    "libgcloud.so"     # GCloud AntiCheat
]

@dataclass
class APKMetadata:
    is_valid_apk: bool = False
    package_name: Optional[str] = None
    engine: str = "unknown"
    abis: List[str] = field(default_factory=list)
    has_il2cpp: bool = False
    has_anti_cheat: bool = False
    anti_cheat_modules: List[str] = field(default_factory=list)
    native_libraries: List[str] = field(default_factory=list)
    total_files: int = 0

def analyze_apk(apk_path: str) -> APKMetadata:
    path = Path(apk_path)
    if not path.is_file():
        return APKMetadata(is_valid_apk=False)

    try:
        with zipfile.ZipFile(path, 'r') as zf:
            namelist = zf.namelist()
            metadata = APKMetadata(is_valid_apk=True, total_files=len(namelist))

            detected_abis = set()
            native_libs = []
            detected_ac = []

            for name in namelist:
                # Check ABIs under lib/
                lib_match = re.match(r"^lib/([^/]+)/(lib[^/]+\.so)$", name)
                if lib_match:
                    abi, libname = lib_match.groups()
                    detected_abis.add(abi)
                    native_libs.append(name)

                    if libname == "libil2cpp.so":
                        metadata.has_il2cpp = True

                    # Anti-cheat check
                    if libname in KNOWN_ANTI_CHEAT_SIGNATURES:
                        detected_ac.append(libname)

            metadata.abis = sorted(list(detected_abis))
            metadata.native_libraries = native_libs
            metadata.anti_cheat_modules = detected_ac
            metadata.has_anti_cheat = len(detected_ac) > 0

            # Engine classification
            if metadata.has_il2cpp:
                metadata.engine = "unity-il2cpp"
            elif any("Managed/Assembly-CSharp.dll" in n for n in namelist):
                metadata.engine = "unity-mono"
            elif any("libUE4.so" in n or "libUnreal.so" in n for n in namelist):
                metadata.engine = "unreal"
            elif any("libgodot_android.so" in n for n in namelist):
                metadata.engine = "godot"
            else:
                metadata.engine = "native-custom"

            return metadata

    except zipfile.BadZipFile:
        return APKMetadata(is_valid_apk=False)
