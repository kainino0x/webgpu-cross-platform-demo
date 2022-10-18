cmake_minimum_required(VERSION 3.10)
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

project(hello)
set(CMAKE_CXX_STANDARD 14)

if(NOT EMSCRIPTEN)
    add_subdirectory("third_party/dawn" EXCLUDE_FROM_ALL)
endif()

if(EMSCRIPTEN)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -g")
endif()

add_executable(hello
    "main.cpp"
    )

if(EMSCRIPTEN)
    set_target_properties(hello PROPERTIES
        SUFFIX ".html")
    target_link_options(hello
        PRIVATE "SHELL:-gsource-map"
        PRIVATE "SHELL:--source-map-base https://kai.graphics/webgpu-cross-platform-demo/out/web/"
        PRIVATE "SHELL:-s USE_WEBGPU=1"
        PRIVATE "SHELL:-s ASSERTIONS=1"
        PRIVATE "SHELL:-s SAFE_HEAP=1"
        #PRIVATE "SHELL:--closure 1"
        #PRIVATE "SHELL:-s VERBOSE=1"
        )
else()
    target_link_libraries(hello
        dawn_headers
        dawncpp
        dawn_native
        dawn_proc
        )
    target_link_options(hello
        PRIVATE "LINKER:--copy-dt-needed-entries")
endif()
