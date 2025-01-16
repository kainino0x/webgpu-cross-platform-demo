#!/bin/bash
set -euo pipefail

THIRD_PARTY="$(dirname "$0")"/third_party

EMSCRIPTEN_RELEASE=3.1.74 # This the emsdk tag, the emscripten tag, and the emsdk install target
NODE_RELEASE=20.18.0_64bit # Must match the Node release used in this Emscripten release

DAWN_REVISION=d419d935d22b314552558e85fd6b5da93991cbee

mkdir -p "$THIRD_PARTY"
cd "$THIRD_PARTY"
THIRD_PARTY=$PWD

(
    if [ ! -e emsdk ] ; then
        mkdir emsdk
        cd emsdk
        git init
        git remote add origin https://github.com/emscripten-core/emsdk.git
    else
        cd emsdk
    fi
    git checkout --detach $EMSCRIPTEN_RELEASE -- || ( git fetch --tags --depth 1 origin $EMSCRIPTEN_RELEASE && git checkout --detach FETCH_HEAD )

    ./emsdk install $EMSCRIPTEN_RELEASE
    ./emsdk activate $EMSCRIPTEN_RELEASE
)

(
    # Copy of Emscripten used only for gen_struct_info.py
    if [ ! -e emscripten ] ; then
        mkdir emscripten
        cd emscripten
        git init
        git remote add origin https://github.com/emscripten-core/emscripten.git
    else
        cd emscripten
    fi
    git checkout --detach $EMSCRIPTEN_RELEASE -- || ( git fetch --tags --depth 1 origin $EMSCRIPTEN_RELEASE && git checkout --detach FETCH_HEAD )

    cat >.emscripten << EOF
LLVM_ROOT = '${THIRD_PARTY}/emsdk/upstream/bin'
BINARYEN_ROOT = '${THIRD_PARTY}/emsdk/upstream'
NODE_JS = '${THIRD_PARTY}/emsdk/node/${NODE_RELEASE}/bin/node'
JAVA = 'java'
EOF
    ./bootstrap
)

source emsdk/emsdk_env.sh
emcc --clear-cache

(
    if [ ! -e dawn ] ; then
        mkdir dawn
        cd dawn
        git init
        git remote add origin https://dawn.googlesource.com/dawn
    else
        cd dawn
    fi
    git checkout --detach $DAWN_REVISION -- || ( git fetch --tags --depth 1 origin $DAWN_REVISION && git checkout --detach FETCH_HEAD )

    # Set up the repo for a build, needed both for cmake and gn builds
    cp scripts/standalone.gclient .gclient
    gclient sync -D

    # Use a gn build to generate the WebGPU bindings for Emscripten
    mkdir -p out/wasm
    cd out/wasm
    # TODO: It should be unnecessary to build this with emscripten; can just build normally but dawn's CMake disables some of the targets if we do that
    source ../../../emsdk/emsdk_env.sh
    emcmake cmake -GNinja \
        -DDAWN_EMSCRIPTEN_TOOLCHAIN="${THIRD_PARTY}/emscripten" \
        ../..
    ninja emdawnwebgpu_headers_gen emdawnwebgpu_js_gen webgpu_generated_struct_info_js
)
