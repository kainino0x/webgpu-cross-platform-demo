cmake_minimum_required(VERSION 3.13)
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

project(hello)
set(CMAKE_CXX_STANDARD 20)

if (NOT EMSCRIPTEN)
    # Turning off OpenGL for Dawn
    set(DAWN_ENABLE_PIC        ON CACHE BOOL "Position-Independent-Code")
    set(DAWN_ENABLE_DESKTOP_GL OFF CACHE BOOL "OpenGL backend")
    set(DAWN_ENABLE_OPENGLES   OFF CACHE BOOL "OpenGL ES backend")
    set(DAWN_BUILD_SAMPLES     OFF CACHE BOOL "Dawn examples")
    set(TINT_BUILD_SAMPLES     OFF CACHE BOOL "Tint examples")
    set(TINT_BUILD_TESTS       OFF CACHE BOOL "Tint tests")
    set(TINT_BUILD_GLSL_WRITER OFF CACHE BOOL "OpenGL SL writer")

    # Use GLFW for native window support
    if (NOT DEFINED DEMO_USE_GLFW)
        option(DEMO_USE_GLFW "Demo use glfw for native window platform" ON)
    endif()

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

add_compile_options(
    "-fno-exceptions"
    "$<$<CONFIG:Release>:-flto>"
    )
add_link_options(
    "-fno-exceptions"
    "$<$<CONFIG:Release>:-flto>"
    )

option(DEMO_USE_SANITIZERS "Enable ASan/UBSan" OFF)
if (DEMO_USE_SANITIZERS)
    add_compile_options(
        "-fsanitize=address"
        "-fsanitize=undefined"
        )
    add_link_options(
        "-fsanitize=address"
        "-fsanitize=undefined"
        )
endif()

option(DEMO_USE_JSPI "Use JSPI (if off, uses ASYNCIFY=1 instead)" OFF)
if (DEMO_USE_JSPI)
    add_compile_definitions(DEMO_USE_JSPI=1)
endif()

if (EMSCRIPTEN)
    add_compile_options(
        "-Wall"
        "-Wextra"
        #"-Weverything"
        )
    include_directories(BEFORE
        "third_party/dawn/out/wasm/gen/src/emdawnwebgpu/include"
        )
endif()

add_executable(hello
    "main.cpp"
    )

if (EMSCRIPTEN)
    add_library(webgpu_layer
        "third_party/dawn/third_party/emdawnwebgpu/webgpu.cpp"
        )
    target_link_libraries(hello
        webgpu_layer
        )

    set_target_properties(hello PROPERTIES
        SUFFIX ".html")
    target_link_options(hello
        PRIVATE
            # DWARF symbols are enabled by default (-g). To use, follow:
            # https://developer.chrome.com/blog/wasm-debugging-2020/
            # Or, switch to -gsource-map for more basic debugging.
            #"$<$<CONFIG:Debug>:-gsource-map>"
            # Use this to adjust the source map's relative URLs to source files.
            #"$<$<CONFIG:Debug>:--source-map-base=./>"

            # We are using Dawn-generated bindings, not built-in ones
            "-sUSE_WEBGPU=0"
            # The JS libraries needed for bindings
            "--js-library=${CMAKE_SOURCE_DIR}/third_party/dawn/out/wasm/gen/src/emdawnwebgpu/library_webgpu_enum_tables.js"
            "--js-library=${CMAKE_SOURCE_DIR}/third_party/dawn/out/wasm/gen/src/emdawnwebgpu/library_webgpu_generated_struct_info.js"
            "--js-library=${CMAKE_SOURCE_DIR}/third_party/dawn/out/wasm/gen/src/emdawnwebgpu/library_webgpu_generated_sig_info.js"
            "--js-library=${CMAKE_SOURCE_DIR}/third_party/dawn/third_party/emdawnwebgpu/library_webgpu.js"
            "--closure-args=--externs=${CMAKE_SOURCE_DIR}/third_party/emscripten/src/closure-externs/webgpu-externs.js"

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
    if (DEMO_USE_JSPI)
        target_link_options(hello
            PRIVATE
                "-sJSPI=1"
                "-sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=$getWasmTableEntry"
                )
    else()
        target_link_options(hello
            PRIVATE
                "-sASYNCIFY=1"
                "-sASYNCIFY_STACK_SIZE=65536"
                "-sEXPORTED_RUNTIME_METHODS=ccall"
                )
    endif()
else()
    target_link_libraries(hello
        dawn_headers
        dawncpp_headers
        dawncpp
        dawn_native
        dawn_proc
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
