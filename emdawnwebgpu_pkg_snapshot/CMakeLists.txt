# Copyright 2025 The Dawn & Tint Authors
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#
# 1. Redistributions of source code must retain the above copyright notice, this
#    list of conditions and the following disclaimer.
#
# 2. Redistributions in binary form must reproduce the above copyright notice,
#    this list of conditions and the following disclaimer in the documentation
#    and/or other materials provided with the distribution.
#
# 3. Neither the name of the copyright holder nor the names of its
#    contributors may be used to endorse or promote products derived from
#    this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
# FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
# DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
# SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
# OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

# This CMakeLists can be used via add_subdirectory() to add webgpu.h bindings to
# an Emscripten-based project. It also serves as a reference for the build flags
# needed for building in other environments.
#
# This file is distributed along with emdawnwebgpu_pkg. It should NOT be included
# by Dawn. It SHOULD be kept in sync with Dawn's corresponding CMakeLists.txt.

cmake_minimum_required(VERSION 3.13)

project(emdawnwebgpu)

if (NOT EMSCRIPTEN)
    message(FATAL_ERROR "This project must be built using `emcmake cmake`.")
endif()

add_library(emdawnwebgpu_config INTERFACE)
target_include_directories(emdawnwebgpu_config BEFORE INTERFACE
    "${PROJECT_SOURCE_DIR}/include"
)
target_link_options(emdawnwebgpu_config INTERFACE
    # We are using Dawn-generated bindings, not built-in ones
    "-sUSE_WEBGPU=0"
    # The JS libraries needed for bindings
    "--js-library=${PROJECT_SOURCE_DIR}/library_webgpu_enum_tables.js"
    "--js-library=${PROJECT_SOURCE_DIR}/library_webgpu_generated_struct_info.js"
    "--js-library=${PROJECT_SOURCE_DIR}/library_webgpu_generated_sig_info.js"
    "--js-library=${PROJECT_SOURCE_DIR}/library_webgpu.js"
    "--closure-args=--externs=${PROJECT_SOURCE_DIR}/webgpu-externs.js"
)

add_library(emdawnwebgpu_c STATIC
    "${PROJECT_SOURCE_DIR}/include/webgpu/webgpu.h"
    "${PROJECT_SOURCE_DIR}/webgpu.cpp"
)
target_link_libraries(emdawnwebgpu_c
    PUBLIC
        emdawnwebgpu_config
)

add_library(emdawnwebgpu_cpp INTERFACE
    "${PROJECT_SOURCE_DIR}/include/dawn/webgpu_cpp_print.h"
    "${PROJECT_SOURCE_DIR}/include/webgpu/webgpu_cpp.h"
    "${PROJECT_SOURCE_DIR}/include/webgpu/webgpu_cpp_chained_struct.h"
    "${PROJECT_SOURCE_DIR}/include/webgpu/webgpu_enum_class_bitmasks.h"
)
target_link_libraries(emdawnwebgpu_cpp
    INTERFACE
        emdawnwebgpu_c
)

