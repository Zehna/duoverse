cmake_minimum_required(VERSION 3.20)
project(duoverse_netcode VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

set(SOURCES
    src/crossplay.cpp
    include/duoverse/export.hpp
    include/duoverse/crossplay.hpp
    include/duoverse/lobby.hpp
    include/duoverse/packet.hpp
    include/duoverse/sdr_transport.hpp
)

# 1. Static library (internal linking)
add_library(duoverse_netcode_static STATIC ${SOURCES})
target_include_directories(duoverse_netcode_static PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)

# 2. Shared library (.dll on Windows, .so on Android/Linux)
add_library(duoverse_netcode SHARED ${SOURCES})
target_include_directories(duoverse_netcode PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)
target_compile_definitions(duoverse_netcode PRIVATE DUOVERSE_NETCODE_EXPORTS)

# Platform-specific link libraries
if (WIN32)
    target_link_libraries(duoverse_netcode PRIVATE ws2_32)
elseif (ANDROID)
    target_link_libraries(duoverse_netcode PRIVATE log)
endif()
