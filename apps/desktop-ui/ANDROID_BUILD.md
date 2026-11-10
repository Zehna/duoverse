# Duoverse Android — build rilis yang benar (v0.2.1)

## Gejala (v0.2.0 di HP)

Aplikasi terbuka hitam dengan teks:

> Failed to request https://tauri.localhost/
> error sending request for url (https://tauri.localhost/)

## Akar masalah (terverifikasi dari APK v0.2.0)

1. **APK v0.2.0 adalah build DEBUG, bukan release.**
   - Penandatangan: `CN=Android Debug`, SHA-256 `ac6bc7bc…`,
     `apksigner verify` lolos v2/v3 tapi dengan kunci debug.
   - String `Failed to request ` ada di dalam
     `lib/arm64-v8a/libduoverse_launcher_lib.so`. String itu hanya
     dikompilasi Tauri 2.12.5 pada build **dev** (`cfg(all(dev, mobile))`,
     `protocol/tauri.rs` → `proxy_dev_request`). Build release tidak
     mengandung kode itu.
2. **`tauri.android.conf.json` dulu berisi `"devUrl": null`.**
   Pada build dev, Tauri Android mem-proxy semua request ke dev server
   (`get_app_url()`). Karena `devUrl` di-override jadi `null`,
   URL-nya jatuh kembali ke `https://tauri.localhost/` — aplikasi
   mencoba mengambil frontend dari dirinya sendiri lewat reqwest,
   dan pasti gagal di HP. Inilah persis pesan di screenshot.
   Perbaikan: kunci `devUrl` dihapus dari `tauri.android.conf.json`
   (v0.2.1). Dev Android sekarang memakai `devUrl` dari
   `tauri.conf.json` (`http://localhost:5173`), release memakai
   `frontendDist: ../dist` yang di-embed ke `.so` Rust.
3. **Salinan `dist/` di `gen/android/app/src/main/assets/` adalah
   file mati.** Tauri tidak pernah memanggil `with_asset_loader`,
   jadi `Rust.assetLoaderDomain()` selalu `null` dan
   `WebViewAssetLoader` tidak pernah dipakai — file-file itu tidak
   pernah disajikan ke WebView, hanya menggemukkan APK ±470 KB.
   Dihapus di v0.2.1. Frontend yang benar di-embed oleh
   `tauri_build::build()` dari `apps/desktop-ui/dist/`.
4. **`vite.config.ts` sekarang memakai `base: './'`.**
   Aset relatif, bukan absolut `/assets/...`, supaya tetap ketemu
   di bawah skema kustom `https://tauri.localhost/`.

Yang **bukan** penyebab: `usesCleartextTraffic=true` sudah benar di
manifest, `useHttpsScheme: true` sudah benar, dan file `dist/` di
APK v0.2.0 itu sendiri utuh (md5 sama dengan repo).

## Cara build APK rilis (Windows, jalankan di PC)

```powershell
cd apps\desktop-ui
npm install
npm run build
# Perintah ini build RELEASE (bukan debug). Jangan pakai --debug,
# jangan build lewat tombol Run/Debug Android Studio, jangan
# assembleDebug, dan jangan rename APK debug jadi "release".
npm run tauri android build -- --apk --target aarch64
```

Output: `src-tauri/gen/android/app/build/outputs/apk/aarch64/release/app-aarch64-release.apk`
(atau `.../apk/universal/release/` bila tanpa `--target`).

Untuk dev di HP (bukan untuk dibagikan):

```powershell
npm run tauri android dev -- --host
# lalu di HP yang sama Wi-Fi-nya, atau: adb reverse tcp:5173 tcp:5173
```

## Cara verifikasi sebelum dibagikan

```powershell
# 1. Bukan kunci debug lagi:
apksigner verify --print-certs app-aarch64-release.apk
#    Jangan ada "CN=Android Debug".

# 2. Bukan build dev lagi (butuh alat strings):
#    libduoverse_launcher_lib.so TIDAK boleh mengandung
#    "Failed to request ".

# 3. Di HP: hapus Duoverse lama dulu (kunci debug v0.2.0 beda
#    dengan kunci rilis — Android menolak update beda tanda tangan),
#    lalu instal APK baru. Yang harus tampil: launcher Duoverse,
#    bukan halaman error tauri.localhost.
```

## Catatan

- `gen/android/app/src/main/assets/` di-ignore — jangan commit
  salinan `dist/` ke sana lagi.
- `RustWebViewClient.kt` di `gen/` adalah file auto-generated
  (wry 0.57.1) yang sempat diedit tangan; jangan diedit lagi,
  CLI Tauri akan menimpanya. Jalur serving yang benar adalah
  `Rust.handleRequest` → aset ter-embed, bukan file itu.
