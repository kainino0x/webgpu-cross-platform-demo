#!/bin/bash
set -euo pipefail

THIRD_PARTY="$(dirname "$0")"/third_party

EMSCRIPTEN_RELEASE=4.0.3 # This the emsdk tag, the emscripten tag, and the emsdk install target
NODE_RELEASE=20.18.0_64bit # Must match the Node release used in this Emscripten release

DAWN_REVISION=aee4ecdc1827c2904a4d64b87af6071086c4a552

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
)

ln -f dawn/out/wasm/gen/src/emdawnwebgpu/{include/webgpu/webgpu{,_cpp}.h,library_webgpu_{enum_tables,generated_{sig,struct}_info}.js} ../dawn_gen_snapshots/
