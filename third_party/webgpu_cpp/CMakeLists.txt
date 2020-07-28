cmake_minimum_required(VERSION 2.8)
project(webgpu_cpp)

add_library(webgpu_cpp
    "webgpu/webgpu_cpp.h"
    "webgpu/webgpu_cpp.cpp"
    )
target_include_directories(webgpu_cpp
    INTERFACE "."
    )
