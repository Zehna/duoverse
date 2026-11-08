cmake_minimum_required(VERSION 3.16)
project(duoverse_overlay CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(
    include
    ${CMAKE_CURRENT_SOURCE_DIR}/include
)

add_library(duoverse_overlay STATIC
    src/kiero_bridge.cpp
    src/overlay_renderer.cpp
)

target_include_directories(duoverse_overlay PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)
