cmake_minimum_required(VERSION 3.20)
project(duoverse_couch_coop LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(duoverse_couch_coop STATIC
    src/window_tiler.cpp
    src/xinput_isolation.cpp
    src/couch_spawner.cpp
)

target_include_directories(duoverse_couch_coop PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)
