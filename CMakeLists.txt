cmake_minimum_required(VERSION 3.13)
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

project(hello)

#
# Set all global stuff
#

set(CMAKE_CXX_STANDARD 20)

if (NOT EMSCRIPTEN)
    # Set Dawn's config variables before including Dawn.
    set(DAWN_ENABLE_PIC        ON  CACHE INTERNAL "")
    set(DAWN_ENABLE_DESKTOP_GL OFF CACHE INTERNAL "")
    set(DAWN_ENABLE_OPENGLES   OFF CACHE INTERNAL "")
    set(DAWN_BUILD_SAMPLES     OFF CACHE INTERNAL "")
    set(TINT_BUILD_SAMPLES     OFF CACHE INTERNAL "")
    set(TINT_BUILD_TESTS       OFF CACHE INTERNAL "")
    set(TINT_BUILD_GLSL_WRITER OFF CACHE INTERNAL "")

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
    # "error: MEMORY64 does not yet work with ASAN"
    if (NOT DEMO_USE_WASM_MEMORY64)
        add_compile_options("-fsanitize=address")
        add_link_options("-fsanitize=address")
    endif()
    add_compile_options("-fsanitize=undefined")
    add_link_options("-fsanitize=undefined")
endif()

option(DEMO_USE_ASYNCIFY "Set -sASYNCIFY to 0 (off), 1 (asyncify), or 2 (JSPI)" 1)
if (DEMO_USE_ASYNCIFY EQUAL 2)
    add_compile_definitions(DEMO_USE_JSPI=1)
endif()

option(DEMO_USE_WASM_4GB "Use Wasm 4GB (triggers CAN_ADDRESS_2GB for Memory32 builds)" OFF)
option(DEMO_USE_WASM_BIGINT "Set -sWASM_BIGINT=1" OFF)
option(DEMO_USE_WASM_MEMORY64 "Use Wasm Memory64" OFF)
if (DEMO_USE_WASM_MEMORY64)
    add_compile_options("-sMEMORY64=1")
endif()

if (EMSCRIPTEN)
    add_compile_options(
        "-Wall"
        "-Wextra"
        #"-Weverything"
        )
endif()

#
# Include Dawn after setting all global settings
#

add_subdirectory("third_party/dawn" EXCLUDE_FROM_ALL)

#
# Set up target
#

add_executable(hello
    "main.cpp"
    )
target_compile_definitions(hello
    PRIVATE
        DEMO_USE_ASYNCIFY=${DEMO_USE_ASYNCIFY}
    )

if (EMSCRIPTEN)
    target_link_libraries(hello
        # Depending on this will build all the necessary files in Dawn and
        # set all the appropriate link flags to point at them.
        emdawnwebgpu_cpp
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
