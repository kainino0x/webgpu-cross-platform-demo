#!/bin/bash
set -euo pipefail

dawn_revision=4b580a7fff5d8cc652e7c58d1e105bed31c67100

function usage {
    echo "Usage:"
    echo "  $0 --checkout=1"
    echo "  $0 --checkout=0"
    exit 1
}

if [ $# != 1 ] ; then
    usage
fi

third_party="$(dirname "$0")"/third_party
mkdir -p "$third_party"
cd "$third_party"
third_party=$PWD

if [ ! -e dawn ] ; then
    mkdir dawn
    cd dawn
    git init
    git remote add origin https://dawn.googlesource.com/dawn
else
    cd dawn
fi
if [ "$1" == "--checkout=1" ] ; then
    git checkout --detach $dawn_revision -- || ( git fetch --depth=1 origin $dawn_revision && git checkout --detach FETCH_HEAD )

    # Set up the repo for a build, needed regardless of build system, both for
    # native and for rebuilding emdawnwebgpu_pkg.
    git submodule update --init --depth=1 third_party/depot_tools
    cp scripts/standalone-with-wasm.gclient .gclient
    third_party/depot_tools/gclient sync -D

    rm -rf out/wasm/
elif [ "$1" == "--checkout=0" ] ; then
    rm -rf out/wasm/emdawnwebgpu_pkg/
else
    usage
fi

# Dawn provides a copy of emsdk already. Note you don't have to use this specific one,
# we just use it because it's already set up.
emsdk="$third_party/dawn/third_party/emsdk"
emscripten="$emsdk/upstream/emscripten"

# Generate the WebGPU bindings for Emscripten.
mkdir -p out/wasm
cd out/wasm

"$emscripten/emcmake" cmake ../..
make clean
make -j4 emdawnwebgpu_pkg
rsync -av --delete emdawnwebgpu_pkg/ ../../../../emdawnwebgpu_pkg/
