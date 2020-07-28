cmake_minimum_required(VERSION 3.10)
set_property(GLOBAL PROPERTY USE_FOLDERS ON)

project(hello)
set(CMAKE_CXX_STANDARD 14)

if(NOT EMSCRIPTEN)
    add_subdirectory("third_party/dawn" EXCLUDE_FROM_ALL)
endif()

add_executable(hello
    "main.cpp"
    )

if(EMSCRIPTEN)
    target_link_options(hello
        PRIVATE "SHELL:-g3"
        PRIVATE "SHELL:-s USE_WEBGPU=1"
        PRIVATE "SHELL:-s ASSERTIONS=1"
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
endif()
