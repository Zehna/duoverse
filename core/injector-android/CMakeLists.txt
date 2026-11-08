cmake_minimum_required(VERSION 3.20)
project(duoverse_injector_android VERSION 0.1.0 LANGUAGES CXX)

set(CMAKE_CXX_STANDARD 20)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

include_directories(include)

add_library(duoverse_injector_android SHARED
    src/il2cpp_hook.cpp
    src/jni_bridge.cpp
)

target_include_directories(duoverse_injector_android PUBLIC
    $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
    $<INSTALL_INTERFACE:include>
)

if (ANDROID)
    target_link_libraries(duoverse_injector_android PRIVATE
        log
        android
    )
endif()
