cmake_minimum_required(VERSION 3.13)
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

project(hello)
set(CMAKE_CXX_STANDARD 20)

if(NOT EMSCRIPTEN)
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

if(EMSCRIPTEN)
    add_compile_options(
        "-Wall"
        "-Wextra"
        "$<$<CONFIG:Release>:-flto>"
        )
endif()

add_executable(hello
    "main.cpp"
    )

if(EMSCRIPTEN)
    set_target_properties(hello PROPERTIES
        SUFFIX ".html")
    target_link_options(hello
        PRIVATE
            # To enable DWARF debugging, remove -gsource-map and follow:
            # https://developer.chrome.com/blog/wasm-debugging-2020/
            "$<$<CONFIG:Debug>:-gsource-map>"
            #"$<$<CONFIG:Debug>:--source-map-base=./>"

            "-sUSE_WEBGPU=1"

            "$<$<CONFIG:Debug>:-sASSERTIONS=1>"
            "$<$<CONFIG:Debug>:-sSAFE_HEAP=1>"
            "$<$<CONFIG:Release>:-flto>"
            "$<$<CONFIG:Release>:--closure=1>"

            # Verbose compilation output
            #"-sVERBOSE=1"
        )
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
