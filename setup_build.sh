#!/bin/bash
set -euo pipefail

dawn_revision=a83c16ba042361f2a6dd0a0210d3ecbb32f0d727

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
git checkout --detach $dawn_revision -- || ( git fetch --tags --depth 1 origin $dawn_revision && git checkout --detach FETCH_HEAD )

# Set up the repo for a build, needed regardless of native vs. wasm or gn vs. cmake.
cp scripts/standalone-with-wasm.gclient .gclient
gclient sync -D

# Dawn provides a copy of emsdk already. Note you don't have to use this specific one,
# we just use it because it's already set up.
emscripten="$third_party/dawn/third_party/emsdk/upstream/emscripten"

# Generate the WebGPU bindings for Emscripten.
rm -rf out/wasm
mkdir -p out/wasm
cd out/wasm

"$emscripten/emcmake" cmake ../..
make clean
make -j4 emdawnwebgpu_pkg
rsync -av --delete emdawnwebgpu_pkg/ ../../../../emdawnwebgpu_pkg_snapshot/
