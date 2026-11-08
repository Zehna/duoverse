# Duoverse Save Game & Quest Progress Sync (`core/save-sync`)

Automated save game detection, delta synchronization, and story progress preservation based on the Ludusavi manifest schema.

---

## Key Mechanisms

1. **Automatic Save Discovery**:
   * Evaluates Ludusavi manifest path expressions (`<home>`, `<appdata>`, `<localappdata>`, `<winSavedGames>`).
   * Scans `%USERPROFILE%\AppData\Local`, `LocalLow`, `Roaming`, and `Saved Games` by Game Title and Steam AppID.

2. **Pre-Session Zero-Risk Backup (`.duo_backup`)**:
   * Before launching co-op session, Duoverse creates a clean, atomic snapshot of the host's original save files.

3. **Post-Session Delta Packaging (`DuoversePacket::SaveSync`)**:
   * Analyzes file modification timestamps and checksums.
   * Compresses all changed and newly created quest/character progress files into a portable binary buffer.
   * Transmits the buffer to clients so both players retain achievements, inventory, and quest completion.
