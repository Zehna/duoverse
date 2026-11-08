#pragma once

#include <string>
#include <unordered_map>
#include <memory>

namespace duoverse::vfs {

// The Virtual File System (VFS) redirection layer intercepts Windows file I/O APIs
// (such as CreateFileW, NtOpenFile, NtCreateFile) to redirect file access away from disk
// or towards isolated Duoverse mod layers without overwriting game files on disk.

class VFSRedirector {
public:
    static VFSRedirector& Instance();

    // Register a file redirection mapping:
    // When the game requests `virtual_target_path`, serve `actual_source_path` instead.
    bool AddFileRedirect(const std::wstring& virtual_target_path, const std::wstring& actual_source_path);

    // Register a memory buffer redirection mapping:
    // When the game requests `virtual_target_path`, serve contents from memory buffer.
    bool AddMemoryRedirect(const std::wstring& virtual_target_path, const void* buffer, size_t size);

    // Initialize in-process API hooks (e.g., Detours / MinHook on kernel32!CreateFileW)
    bool InstallHooks();

    // Remove all file hooks and restore original API pointers
    bool UninstallHooks();

    // Resolve an intercepted file path to its redirected equivalent
    bool ResolvePath(const std::wstring& input_path, std::wstring* out_resolved_path);

private:
    VFSRedirector() = default;
    ~VFSRedirector() = default;

    std::unordered_map<std::wstring, std::wstring> file_redirects_;
};

} // namespace duoverse::vfs
