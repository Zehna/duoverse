cmake_minimum_required(VERSION 3.20)
project(duoverse_vfs LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

add_library(duoverse_vfs STATIC
    src/usvfs_core.cpp
)

target_include_directories(duoverse_vfs PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)

if (WIN32)
    target_link_libraries(duoverse_vfs PUBLIC advapi32)
endif()
