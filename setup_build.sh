#!/bin/bash
set -euo pipefail

THIRD_PARTY="$(dirname "$0")"/third_party

EMSCRIPTEN_RELEASE=3.1.61 # This the emsdk tag, the emscripten tag, and the emsdk install target
NODE_RELEASE=18.20.3_64bit # Must match the Node release used in this Emscripten release

DAWN_REVISION=18a0d23d9fd740b39e8d4d78d3b9f883ad04c79c

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
)

(
    if [ ! -e emscripten ] ; then
        mkdir emscripten
        cd emscripten
        git init
        git remote add origin https://github.com/emscripten-core/emscripten.git
    else
        cd emscripten
    fi
    git checkout --detach $EMSCRIPTEN_RELEASE -- || ( git fetch --tags --depth 1 origin $EMSCRIPTEN_RELEASE && git checkout --detach FETCH_HEAD )

    ./bootstrap
    cat >.emscripten << EOF
LLVM_ROOT = '${THIRD_PARTY}/emsdk/upstream/bin'
BINARYEN_ROOT = '${THIRD_PARTY}/emsdk/upstream'
NODE_JS = '${THIRD_PARTY}/emsdk/node/${NODE_RELEASE}/bin/node'
JAVA = 'java'
EOF
)

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
    gclient sync

    # Use a gn build to generate the WebGPU bindings for Emscripten
    mkdir -p out/wasm
    gn gen out/wasm --args='dawn_emscripten_dir="../../../emscripten"'
    ninja -C out/wasm emdawnwebgpu
)
