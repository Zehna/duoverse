#include "duoverse/vfs/usvfs_core.hpp"

#include <algorithm>
#include <fstream>
#include <iomanip>
#include <sstream>
#include <iostream>

#if defined(_WIN32)
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <wincrypt.h>
#endif

namespace duoverse::vfs {

USVFSEngine& USVFSEngine::Instance() {
    static USVFSEngine instance;
    return instance;
}

std::wstring USVFSEngine::NormalizePath(const std::wstring& path) const {
    if (path.empty()) return L"";
    std::wstring result = path;
    std::replace(result.begin(), result.end(), L'/', L'\\');
    
    // Convert to lowercase for case-insensitive comparison on Windows
    std::transform(result.begin(), result.end(), result.begin(), ::towlower);

    // Remove extended-length prefix if present
    if (result.rfind(L"\\\\?\\", 0) == 0) {
        result = result.substr(4);
    }

    // Trim trailing backslash unless root drive "c:\"
    while (result.length() > 3 && result.back() == L'\\') {
        result.pop_back();
    }
    return result;
}

bool USVFSEngine::MountStagingDirectory(const std::wstring& virtual_game_root, const std::wstring& staging_dir) {
    std::lock_guard<std::mutex> lock(vfs_lock_);
    std::wstring norm_virtual = NormalizePath(virtual_game_root);
    std::wstring norm_staging = NormalizePath(staging_dir);
    mounted_directories_.push_back({norm_virtual, norm_staging});
    return true;
}

bool USVFSEngine::AddVirtualRedirect(const std::wstring& virtual_path, const std::wstring& target_path) {
    std::lock_guard<std::mutex> lock(vfs_lock_);
    std::wstring norm = NormalizePath(virtual_path);
    VirtualFileEntry entry;
    entry.virtual_path = virtual_path;
    entry.physical_target = target_path;
    entry.memory_buffer = nullptr;
    entry.memory_size = 0;
    entry.is_in_memory = false;
    entry.attributes = 0x80; // FILE_ATTRIBUTE_NORMAL
    virtual_table_[norm] = entry;
    return true;
}

bool USVFSEngine::AddMemoryFile(const std::wstring& virtual_path, const void* buffer, size_t size) {
    std::lock_guard<std::mutex> lock(vfs_lock_);
    std::wstring norm = NormalizePath(virtual_path);
    VirtualFileEntry entry;
    entry.virtual_path = virtual_path;
    entry.physical_target = L"";
    entry.memory_buffer = buffer;
    entry.memory_size = size;
    entry.is_in_memory = true;
    entry.attributes = 0x80; // FILE_ATTRIBUTE_NORMAL
    virtual_table_[norm] = entry;
    return true;
}

bool USVFSEngine::ResolveFile(const wchar_t* lpFileName, std::wstring* out_resolved_path, const VirtualFileEntry** out_entry) {
    if (!lpFileName) return false;
    std::lock_guard<std::mutex> lock(vfs_lock_);

    std::wstring norm = NormalizePath(lpFileName);
    auto it = virtual_table_.find(norm);
    if (it != virtual_table_.end()) {
        if (out_entry) *out_entry = &it->second;
        if (out_resolved_path) *out_resolved_path = it->second.physical_target;
        return true;
    }

    // Check directory mounts
    for (const auto& [v_root, s_root] : mounted_directories_) {
        if (norm.rfind(v_root, 0) == 0) {
            std::wstring sub = norm.substr(v_root.length());
            if (sub.empty() || sub[0] == L'\\') {
                std::wstring resolved = s_root + sub;
                if (out_resolved_path) *out_resolved_path = resolved;
                return true;
            }
        }
    }

    return false;
}

bool USVFSEngine::GetVirtualAttributes(const wchar_t* lpFileName, uint32_t* out_attributes) {
    const VirtualFileEntry* entry = nullptr;
    std::wstring resolved;
    if (ResolveFile(lpFileName, &resolved, &entry)) {
        if (out_attributes) {
            if (entry) {
                *out_attributes = entry->attributes;
            } else {
                *out_attributes = 0x80; // FILE_ATTRIBUTE_NORMAL
            }
        }
        return true;
    }
    return false;
}

// Function pointer typedefs for Windows I/O API interception
#if defined(_WIN32)
typedef HANDLE(WINAPI* PFN_CreateFileW)(LPCWSTR, DWORD, DWORD, LPSECURITY_ATTRIBUTES, DWORD, DWORD, HANDLE);
typedef DWORD(WINAPI* PFN_GetFileAttributesW)(LPCWSTR);
typedef HANDLE(WINAPI* PFN_FindFirstFileW)(LPCWSTR, LPWIN32_FIND_DATAW);

static PFN_CreateFileW g_Original_CreateFileW = nullptr;
static PFN_GetFileAttributesW g_Original_GetFileAttributesW = nullptr;
static PFN_FindFirstFileW g_Original_FindFirstFileW = nullptr;

static HANDLE WINAPI Hooked_CreateFileW(
    LPCWSTR lpFileName,
    DWORD dwDesiredAccess,
    DWORD dwShareMode,
    LPSECURITY_ATTRIBUTES lpSecurityAttributes,
    DWORD dwCreationDisposition,
    DWORD dwFlagsAndAttributes,
    HANDLE hTemplateFile
) {
    std::wstring resolved;
    const VirtualFileEntry* entry = nullptr;
    if (USVFSEngine::Instance().ResolveFile(lpFileName, &resolved, &entry)) {
        if (!entry || !entry->is_in_memory) {
            return g_Original_CreateFileW ?
                g_Original_CreateFileW(resolved.c_str(), dwDesiredAccess, dwShareMode, lpSecurityAttributes, dwCreationDisposition, dwFlagsAndAttributes, hTemplateFile) :
                CreateFileW(resolved.c_str(), dwDesiredAccess, dwShareMode, lpSecurityAttributes, dwCreationDisposition, dwFlagsAndAttributes, hTemplateFile);
        }
    }
    return g_Original_CreateFileW ?
        g_Original_CreateFileW(lpFileName, dwDesiredAccess, dwShareMode, lpSecurityAttributes, dwCreationDisposition, dwFlagsAndAttributes, hTemplateFile) :
        CreateFileW(lpFileName, dwDesiredAccess, dwShareMode, lpSecurityAttributes, dwCreationDisposition, dwFlagsAndAttributes, hTemplateFile);
}
#endif

bool USVFSEngine::InstallFileSystemHooks() {
    std::lock_guard<std::mutex> lock(vfs_lock_);
    if (hooks_active_) return true;
#if defined(_WIN32)
    // Detours/MinHook activation point
    hooks_active_ = true;
    return true;
#else
    hooks_active_ = true;
    return true;
#endif
}

bool USVFSEngine::UninstallFileSystemHooks() {
    std::lock_guard<std::mutex> lock(vfs_lock_);
    hooks_active_ = false;
    return true;
}

std::string USVFSEngine::CalculateDiskExecutableHash(const std::wstring& executable_path) {
    std::ifstream file(std::string(executable_path.begin(), executable_path.end()), std::ios::binary);
    if (!file.is_open()) return "";

#if defined(_WIN32)
    HCRYPTPROV hProv = 0;
    HCRYPTHASH hHash = 0;
    if (!CryptAcquireContextW(&hProv, NULL, NULL, PROV_RSA_AES, CRYPT_VERIFYCONTEXT)) {
        return "";
    }
    if (!CryptCreateHash(hProv, CALG_SHA_256, 0, 0, &hHash)) {
        CryptReleaseContext(hProv, 0);
        return "";
    }

    char buffer[8192];
    while (file.read(buffer, sizeof(buffer)) || file.gcount() > 0) {
        CryptHashData(hHash, reinterpret_cast<const BYTE*>(buffer), static_cast<DWORD>(file.gcount()), 0);
        if (file.eof()) break;
    }

    BYTE hash_bytes[32];
    DWORD hash_len = sizeof(hash_bytes);
    std::ostringstream ss;
    if (CryptGetHashParam(hHash, HP_HASHVAL, hash_bytes, &hash_len, 0)) {
        for (DWORD i = 0; i < hash_len; ++i) {
            ss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(hash_bytes[i]);
        }
    }

    CryptDestroyHash(hHash);
    CryptReleaseContext(hProv, 0);
    return ss.str();
#else
    // Fallback simple hash for cross-platform builds
    uint64_t hash = 14695981039346656037ULL;
    char buffer[4096];
    while (file.read(buffer, sizeof(buffer)) || file.gcount() > 0) {
        for (std::streamsize i = 0; i < file.gcount(); ++i) {
            hash ^= static_cast<uint8_t>(buffer[i]);
            hash *= 1099511628211ULL;
        }
        if (file.eof()) break;
    }
    std::ostringstream ss;
    ss << std::hex << hash;
    return ss.str();
#endif
}

bool USVFSEngine::VerifyPristineDiskState(const std::wstring& executable_path, const std::string& expected_sha256) {
    std::string current_hash = CalculateDiskExecutableHash(executable_path);
    if (current_hash.empty()) return false;

    // Case-insensitive hex string compare
    if (current_hash.length() != expected_sha256.length()) return false;
    for (size_t i = 0; i < current_hash.length(); ++i) {
        if (::tolower(current_hash[i]) != ::tolower(expected_sha256[i])) {
            return false;
        }
    }
    return true;
}

size_t USVFSEngine::GetRedirectCount() const {
    std::lock_guard<std::mutex> lock(vfs_lock_);
    return virtual_table_.size();
}

void USVFSEngine::ClearAllRedirects() {
    std::lock_guard<std::mutex> lock(vfs_lock_);
    virtual_table_.clear();
    mounted_directories_.clear();
}

} // namespace duoverse::vfs
