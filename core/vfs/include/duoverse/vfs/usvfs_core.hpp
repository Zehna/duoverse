#pragma once

#include <string>
#include <unordered_map>
#include <vector>
#include <memory>
#include <mutex>

namespace duoverse::vfs {

struct VirtualFileEntry {
    std::wstring virtual_path;     // Path the game expects (e.g. C:\Game\Assembly-CSharp.dll)
    std::wstring physical_target;  // Staged mod file path in RAM/cache
    const void* memory_buffer;     // Optional in-memory buffer
    size_t memory_size;            // Size of memory buffer
    bool is_in_memory;             // True if served strictly from memory
    uint32_t attributes;           // Windows file attributes (e.g., FILE_ATTRIBUTE_NORMAL)
};

// Advanced User-Space Virtual File System (USVFS) Hooking Engine
// Intercepts CreateFileW, GetFileAttributesW, FindFirstFileW / FindNextFileW
class USVFSEngine {
public:
    static USVFSEngine& Instance();

    // Configuration & Staging Registration
    bool MountStagingDirectory(const std::wstring& virtual_game_root, const std::wstring& staging_dir);
    bool AddVirtualRedirect(const std::wstring& virtual_path, const std::wstring& target_path);
    bool AddMemoryFile(const std::wstring& virtual_path, const void* buffer, size_t size);

    // API Interception Resolution
    bool ResolveFile(const wchar_t* lpFileName, std::wstring* out_resolved_path, const VirtualFileEntry** out_entry);
    bool GetVirtualAttributes(const wchar_t* lpFileName, uint32_t* out_attributes);

    // Hook Management (MinHook / Detours)
    bool InstallFileSystemHooks();
    bool UninstallFileSystemHooks();
    bool AreHooksActive() const { return hooks_active_; }

    // Zero-Disk Modification Guarantee: Computes and verifies pristine SHA256 of base game executable
    std::string CalculateDiskExecutableHash(const std::wstring& executable_path);
    bool VerifyPristineDiskState(const std::wstring& executable_path, const std::string& expected_sha256);

    // Query stats
    size_t GetRedirectCount() const;
    void ClearAllRedirects();

private:
    USVFSEngine() = default;
    ~USVFSEngine() { UninstallFileSystemHooks(); }

    std::wstring NormalizePath(const std::wstring& path) const;

    mutable std::mutex vfs_lock_;
    bool hooks_active_ = false;
    std::unordered_map<std::wstring, VirtualFileEntry> virtual_table_;
    std::vector<std::pair<std::wstring, std::wstring>> mounted_directories_;
};

} // namespace duoverse::vfs
