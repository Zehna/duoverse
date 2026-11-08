#include "duoverse/couch_coop.hpp"

#include <iostream>
#include <vector>

#if defined(_WIN32)
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#endif

namespace duoverse::couch {

bool LaunchDualInstances(
    const std::wstring& executable_path,
    const std::wstring& arguments,
    SplitMode mode,
    int32_t monitor_width,
    int32_t monitor_height
) {
    SplitLayout layout = CalculateLayout(monitor_width, monitor_height, mode);

#if defined(_WIN32)
    auto spawn_instance = [&](uint32_t id, const WindowRect& rect) -> bool {
        STARTUPINFOW si = { sizeof(si) };
        PROCESS_INFORMATION pi = { 0 };

        si.dwFlags = STARTF_USEPOSITION | STARTF_USESIZE;
        si.dwX = rect.x;
        si.dwY = rect.y;
        si.dwXSize = rect.width;
        si.dwYSize = rect.height;

        // Form command line
        std::wstring cmd = L"\"" + executable_path + L"\" " + arguments;
        std::vector<wchar_t> cmd_buf(cmd.begin(), cmd.end());
        cmd_buf.push_back(L'\0');

        // Set environment for instance isolation
        SetEnvironmentVariableW(L"DUOVERSE_INSTANCE_ID", std::to_wstring(id).c_str());
        SetEnvironmentVariableW(L"DUOVERSE_COUCH_SPLIT", mode == SplitMode::Horizontal ? L"HORIZONTAL" : L"VERTICAL");

        BOOL success = CreateProcessW(
            NULL,
            cmd_buf.data(),
            NULL,
            NULL,
            FALSE,
            CREATE_NEW_CONSOLE | CREATE_SUSPENDED,
            NULL,
            NULL,
            &si,
            &pi
        );

        if (!success) {
            return false;
        }

        // Resume thread once configured
        ResumeThread(pi.hThread);
        CloseHandle(pi.hProcess);
        CloseHandle(pi.hThread);
        return true;
    };

    bool p1 = spawn_instance(1, layout.instance_1);
    bool p2 = spawn_instance(2, layout.instance_2);
    return p1 && p2;
#else
    // Fallback stub for cross-platform builds
    (void)executable_path;
    (void)arguments;
    (void)layout;
    return true;
#endif
}

} // namespace duoverse::couch
