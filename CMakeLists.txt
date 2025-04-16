cmake_minimum_required(VERSION 3.13)
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

project(hello)

#
# Configurable options
#

# Options for all builds
option(DEMO_USE_SANITIZERS "Enable ASan/UBSan" OFF)

# Options for native build (ignored otherwise)
option(DEMO_USE_GLFW "Demo use glfw for native window platform" ON)

# Options for Emscripten build (ignored otherwise)
set(DEMO_USE_ASYNCIFY 1 CACHE STRING "Set -sASYNCIFY to 0 (off), 1 (classic Asyncify), or 2 (JSPI)")
option(DEMO_USE_WASM_4GB "Use Wasm 4GB (triggers CAN_ADDRESS_2GB for Memory32 builds)" OFF)
option(DEMO_USE_WASM_BIGINT "Set -sWASM_BIGINT=1" OFF)
option(DEMO_USE_WASM_MEMORY64 "Use Wasm Memory64" OFF)

#
# Set all global stuff
#

set(CMAKE_CXX_STANDARD 20)

add_compile_options(
    "-fno-exceptions"
    "$<$<CONFIG:Release>:-flto>"
    )
add_link_options(
    "-fno-exceptions"
    "$<$<CONFIG:Release>:-flto>"
    )

if (DEMO_USE_SANITIZERS)
    # "error: MEMORY64 does not yet work with ASAN"
    if (EMSCRIPTEN AND NOT DEMO_USE_WASM_MEMORY64)
        add_compile_options("-fsanitize=address")
        add_link_options("-fsanitize=address")
    endif()
    add_compile_options("-fsanitize=undefined")
    add_link_options("-fsanitize=undefined")
endif()

if (EMSCRIPTEN)
    add_compile_options(
        # Use ports at compile time, to set include paths.
        "--use-port=${PROJECT_SOURCE_DIR}/emdawnwebgpu_pkg/emdawnwebgpu.port.py:cpp_bindings=true"
        "-Wall"
        "-Wextra"
        #"-Weverything"
        )

    if (DEMO_USE_WASM_MEMORY64)
        add_compile_options("-sMEMORY64=1")
    endif()
    if (DEMO_USE_ASYNCIFY EQUAL 2)
        add_compile_definitions(DEMO_USE_JSPI=1)
    endif()
endif()

#
# Include Dawn after setting all global settings
#

if (NOT EMSCRIPTEN)
    # Set Dawn's config variables before including Dawn.
    set(DAWN_ENABLE_PIC        ON  CACHE INTERNAL "")
    set(DAWN_ENABLE_DESKTOP_GL OFF CACHE INTERNAL "")
    set(DAWN_ENABLE_OPENGLES   OFF CACHE INTERNAL "")
    set(DAWN_BUILD_SAMPLES     OFF CACHE INTERNAL "")
    set(TINT_BUILD_SAMPLES     OFF CACHE INTERNAL "")
    set(TINT_BUILD_TESTS       OFF CACHE INTERNAL "")
    set(TINT_BUILD_GLSL_WRITER OFF CACHE INTERNAL "")

    if (DEMO_USE_GLFW)
        message("Demo use glfw for native window platform is turned on. If glfw is not found try `apt-get install libglfw3-dev` or `brew install glfw`")
        set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} ${PROJECT_SOURCE_DIR}/cmake/modules)
        find_package(glfw3 REQUIRED)
        if (UNIX AND NOT APPLE)
            set(DAWN_USE_X11 ON CACHE BOOL "Dawn use X11")
        else()
            set(DAWN_USE_X11 OFF CACHE BOOL "Dawn use X11")
        endif()
    endif()

    add_subdirectory("third_party/dawn" EXCLUDE_FROM_ALL)
endif()

#
# Set up target
#

add_executable(hello
    "main.cpp"
    )

if (EMSCRIPTEN)
    target_compile_definitions(hello
        PRIVATE
            DEMO_USE_ASYNCIFY=${DEMO_USE_ASYNCIFY}
        )

    set_target_properties(hello PROPERTIES
        SUFFIX ".html")
    target_link_options(hello
        PRIVATE
            # Link to the webgpu.h implementation.
            "--use-port=${PROJECT_SOURCE_DIR}/emdawnwebgpu_pkg/emdawnwebgpu.port.py"
            "--closure-args=--externs=${PROJECT_SOURCE_DIR}/emdawnwebgpu_pkg/webgpu/src/webgpu-externs.js"

            # DWARF symbols are enabled by default (-g). To use, follow:
            # https://developer.chrome.com/blog/wasm-debugging-2020/
            # Or, switch to -gsource-map for more basic debugging.
            #"$<$<CONFIG:Debug>:-gsource-map>"
            # Use this to adjust the source map's relative URLs to source files.
            #"$<$<CONFIG:Debug>:--source-map-base=./>"

            "-sEXIT_RUNTIME=0"
            #"$<$<CONFIG:Debug>:-sEXIT_RUNTIME=1>"
            "$<$<CONFIG:Debug>:-sASSERTIONS=1>"
            "$<$<CONFIG:Debug>:-Wno-limited-postlink-optimizations>"
            "$<$<CONFIG:Release>:--closure=1>"

            # Verbose compilation output
            #"-sVERBOSE=1"
            )
    if (NOT DEMO_USE_SANITIZERS)
        target_link_options(hello
            PRIVATE
                "$<$<CONFIG:Debug>:-sSAFE_HEAP=1>" # Incompatible with ASan
                )
    endif()
    if (DEMO_USE_ASYNCIFY EQUAL 2)
        target_link_options(hello
            PRIVATE
                "-sJSPI=1"
                "-sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=$getWasmTableEntry"
                )
    elseif (DEMO_USE_ASYNCIFY EQUAL 1)
        target_link_options(hello
            PRIVATE
                "-sASYNCIFY=1"
                "-sASYNCIFY_STACK_SIZE=65536"
                "-sEXPORTED_RUNTIME_METHODS=ccall"
                )
    endif()
    if (DEMO_USE_WASM_4GB)
        target_link_options(hello PRIVATE "-sALLOW_MEMORY_GROWTH=1" "-sMAXIMUM_MEMORY=4GB")
    endif()
    if (DEMO_USE_WASM_BIGINT)
        target_link_options(hello PRIVATE "-sWASM_BIGINT=1")
    endif()
    if (DEMO_USE_WASM_MEMORY64)
        target_link_options(hello PRIVATE "-sMEMORY64=1")
    endif()
else()
    target_link_libraries(hello
        webgpu_cpp
        webgpu_dawn
        )
    if (DEMO_USE_GLFW)
        target_sources(hello PRIVATE "window.h")
        if (APPLE)
            target_sources(hello PRIVATE "window_macos.mm")
        endif()
        target_compile_definitions(hello PRIVATE DEMO_USE_GLFW)
        target_link_libraries(hello
            webgpu_glfw
            glfw
            )
    endif()
endif()
