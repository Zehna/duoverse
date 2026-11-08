#pragma once

#if defined(_WIN32) || defined(__CYGWIN__)
    #if defined(DUOVERSE_NETCODE_EXPORTS)
        #define DUOVERSE_API __declspec(dllexport)
    #else
        #define DUOVERSE_API __declspec(dllimport)
    #endif
#else
    #if __GNUC__ >= 4 || defined(__clang__)
        #define DUOVERSE_API __attribute__((visibility("default")))
    #else
        #define DUOVERSE_API
    #endif
#endif
