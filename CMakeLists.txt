cmake_minimum_required(VERSION 2.8)
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

project(hello)
set(CMAKE_CXX_STANDARD 14)

if(NOT EMSCRIPTEN)
    set(DAWN_SOURCE_DIR "${PROJECT_SOURCE_DIR}/third_party/dawn")
    if(NOT EXISTS "${DAWN_SOURCE_DIR}")
        message(FATAL_ERROR "Dawn not found in third_party/dawn. Have you run git submodule update --init?")
    endif()

    set(DAWN_BUILD_DIR "${PROJECT_SOURCE_DIR}/third_party/dawn/out/Release")
    if(NOT EXISTS "${DAWN_BUILD_DIR}")
        message(FATAL_ERROR "No build found in ${DAWN_BUILD_DIR}. Have you run ./setup.sh?")
    endif()

    add_definitions(-DDAWN_ENABLE_BACKEND_METAL)
endif()

add_executable(hello
    "${PROJECT_SOURCE_DIR}/main.cpp"
    "${PROJECT_SOURCE_DIR}/third_party/webgpu_cpp/webgpu/webgpu_cpp.cpp"
    )

target_include_directories(hello
    PRIVATE "${PROJECT_SOURCE_DIR}/third_party/webgpu_cpp"
    )

if(EMSCRIPTEN)
    target_link_options(hello
        PRIVATE "SHELL:-g1"
        PRIVATE "SHELL:-s USE_WEBGPU=1"
        PRIVATE "SHELL:-s ASSERTIONS=1"
        #PRIVATE "SHELL:--closure 1"
        #PRIVATE "SHELL:-s VERBOSE=1"
        )
else()
    target_include_directories(hello
        PRIVATE "${DAWN_SOURCE_DIR}/src/include"
        PRIVATE "${DAWN_BUILD_DIR}/gen/src/include"
        )
    target_link_libraries(hello
        "${DAWN_BUILD_DIR}/obj/libdawn_native.a"
        "${DAWN_BUILD_DIR}/obj/libdawn_utils.a"
        "${DAWN_BUILD_DIR}/obj/src/dawn/libdawn_proc.a"
        "${DAWN_BUILD_DIR}/obj/third_party/shaderc/libshaderc_spvc/spvc.o"
        "${DAWN_BUILD_DIR}/obj/third_party/shaderc/libshaderc_spvc/spvc_private.o"
        "${DAWN_BUILD_DIR}/obj/third_party/shaderc/libshaderc_spvc/spvcir_pass.o"
        "${DAWN_BUILD_DIR}/obj/third_party/SPIRV-Tools/libspvtools_opt.a"
        "-framework Cocoa"
        "-framework IOKit"
        "-framework IOSurface"
        "-framework Metal"
        "-framework QuartzCore"
        )
endif()