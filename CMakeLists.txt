cmake_minimum_required(VERSION 2.8)
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

project(hello)
set(CMAKE_CXX_STANDARD 14)

set(DAWN_SOURCE_DIR "${PROJECT_SOURCE_DIR}/third_party/dawn")
if(NOT EXISTS "${DAWN_SOURCE_DIR}")
    message(FATAL_ERROR "Dawn not found in third_party/dawn")
endif()

set(DAWN_BUILD_DIR "${PROJECT_SOURCE_DIR}/third_party/dawn/out/Release")
if(NOT EXISTS "${DAWN_BUILD_DIR}")
    message(FATAL_ERROR "No build found in ${DAWN_BUILD_DIR}. Create it and be sure to build with dawn_complete_static_libs = true")
endif()

if(NOT EMSCRIPTEN)
    add_definitions(-DDAWN_ENABLE_BACKEND_METAL)
endif()

set(HELLO_SOURCES
    "${PROJECT_SOURCE_DIR}/main.cpp"
    )
if(EMSCRIPTEN)
    set(HELLO_SOURCES ${HELLO_SOURCES}
        "${DAWN_BUILD_DIR}/gen/src/dawn/dawn/dawncpp.cpp"
        )
endif()

add_executable(hello ${HELLO_SOURCES})

target_include_directories(hello
    PRIVATE "${DAWN_BUILD_DIR}/gen"
    PRIVATE "${DAWN_SOURCE_DIR}/src/include"
    )

if(EMSCRIPTEN)
    target_link_options(hello
        PRIVATE "SHELL:-g1"
        PRIVATE "SHELL:-s USE_WEBGPU=1"
        PRIVATE "SHELL:-s ASSERTIONS=1"
        #PRIVATE "SHELL:-s ERROR_ON_UNDEFINED_SYMBOLS=0"
        #PRIVATE "SHELL:--closure 1"
        #PRIVATE "SHELL:-s VERBOSE=1"
        )
else()
    target_link_libraries(hello
        "${DAWN_BUILD_DIR}/obj/libdawn_native.a"
        "${DAWN_BUILD_DIR}/obj/src/dawn/libdawn.a"
        "-framework Cocoa"
        "-framework IOKit"
        "-framework IOSurface"
        "-framework Metal"
        )
endif()
