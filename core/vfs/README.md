# Duoverse User-Space Virtual File System (USVFS)

The `core/vfs` module provides user-space file system interception and memory staging for game modifications.

## Key Architecture
1. **Zero-Disk Modification Guarantee**: Base game executables and data archives remain 100% byte-for-byte identical on physical storage (verified via SHA256 integrity checks).
2. **I/O Redirection**:
   - `CreateFileW`
   - `GetFileAttributesW`
   - `FindFirstFileW` / `FindNextFileW`
3. **RAM Staging**: Injects virtual payloads directly from memory buffers or isolated cache staging directories without overwriting disk contents.
