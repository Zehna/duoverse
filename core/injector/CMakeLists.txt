cmake_minimum_required(VERSION 3.20)
project(duoverse_injector VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

add_library(duoverse_injector_core STATIC
    include/duoverse/anti_cheat.hpp
    include/duoverse/hook_engine.hpp
    include/duoverse/pe_analyzer.hpp
    include/duoverse/vfs_redirector.hpp
)

target_include_directories(duoverse_injector_core PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)

if (WIN32)
    target_link_libraries(duoverse_injector_core PRIVATE kernel32 user32 ntdll)
endif()
