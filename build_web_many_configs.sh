#!/bin/bash

if [ ! -f "build_web_many_configs.sh" ] ; then
    echo "build_web_many_configs.sh must be called from project root"
    exit 1
fi

function usage {
    echo "Usage:"
    echo "  $0 --parallel=0"
    echo "  $0 --parallel=1"
    exit 1
}

if [ $# != 1 ] ; then
    usage
fi

project_dir="$PWD"
emsdk="$project_dir/third_party/dawn/third_party/emsdk"
emscripten="$emsdk/upstream/emscripten"

# build_one BUILD_DIR CMAKE_FLAGS...
function build_one {
    build_dir="$1"
    shift
    cmake_args=("$@")

    mkdir -p "$build_dir"
    cd "$build_dir"
    "$emscripten/emcmake" cmake "$project_dir" "${cmake_args[@]}"
    make clean
    make -j2
}

pids=()
if [ "$1" == "--parallel=0" ] ; then
    function build {
        build_one "$@"
        echo "<li><a href="$1/hello.html">$1</a></h1>" >> index.html
    }
    function cleanup {
        true
    }
elif [ "$1" == "--parallel=1" ] ; then
    function build {
        build_one "$@" & pids+=($!)
        echo "<li><a href="$1/hello.html">$1</a></li>" >> index.html
    }
    function cleanup {
        wait "${pids[@]}"
    }

    function stop {
        kill "${pids[@]}"
        cleanup
        exit 1
    }
    trap stop SIGHUP SIGINT SIGTERM
else
    usage
fi

set -euo pipefail

cat > index.html <<EOF
<!DOCTYPE html>
<html>
  <head>
    <meta charset=utf-8>
    <title>webgpu-cross-platform-demo</title>
  </head>
  <body>
    <ul>
EOF

for buildtype in Debug Release ; do
    # TODO make asyncify=0 work
    for asyncify in 1 2 ; do
        for sanitizers in ON OFF ; do
            if [ $sanitizers == ON ] ; then
                sanitizers_label32=-ubsan-asan
                sanitizers_label64=-ubsan
            else
                sanitizers_label32=
                sanitizers_label64=
            fi
            build out/web-${buildtype:0:3}-asyncify${asyncify}${sanitizers_label32}            -DDEMO_USE_ASYNCIFY=$asyncify -DCMAKE_BUILD_TYPE=$buildtype -DDEMO_USE_SANITIZERS=$sanitizers
            build out/web-${buildtype:0:3}-asyncify${asyncify}-bigint${sanitizers_label32}     -DDEMO_USE_ASYNCIFY=$asyncify -DCMAKE_BUILD_TYPE=$buildtype -DDEMO_USE_SANITIZERS=$sanitizers -DDEMO_USE_WASM_BIGINT=ON
            build out/web-${buildtype:0:3}-asyncify${asyncify}-4gb${sanitizers_label32}        -DDEMO_USE_ASYNCIFY=$asyncify -DCMAKE_BUILD_TYPE=$buildtype -DDEMO_USE_SANITIZERS=$sanitizers -DDEMO_USE_WASM_4GB=ON
            build out/web-${buildtype:0:3}-asyncify${asyncify}-4gb-bigint${sanitizers_label32} -DDEMO_USE_ASYNCIFY=$asyncify -DCMAKE_BUILD_TYPE=$buildtype -DDEMO_USE_SANITIZERS=$sanitizers -DDEMO_USE_WASM_4GB=ON -DDEMO_USE_WASM_BIGINT=ON
            build out/web-${buildtype:0:3}-asyncify${asyncify}-memory64${sanitizers_label64}   -DDEMO_USE_ASYNCIFY=$asyncify -DCMAKE_BUILD_TYPE=$buildtype -DDEMO_USE_SANITIZERS=$sanitizers -DDEMO_USE_WASM_MEMORY64=ON
        done
    done
done

cleanup
