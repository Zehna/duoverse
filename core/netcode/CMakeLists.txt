cmake_minimum_required(VERSION 3.20)
project(duoverse_netcode VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

add_library(duoverse_netcode_core STATIC
    include/duoverse/lobby.hpp
    include/duoverse/packet.hpp
    include/duoverse/sdr_transport.hpp
)

target_include_directories(duoverse_netcode_core PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)
