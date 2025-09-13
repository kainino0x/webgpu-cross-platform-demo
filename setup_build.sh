#!/bin/bash
set -euo pipefail

dawn_revision=e1d6e12337080cf9f6d8726209e86df449bc6e9a

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
pushd "$third_party"
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
    rm -rf out/wasm/
elif [ "$1" == "--checkout=0" ] ; then
    rm -rf out/wasm/emdawnwebgpu_pkg/
else
    usage
fi

# Dawn provides a copy of emsdk already. Note you don't have to use this specific one,
# we just use it because it's already there.
git submodule update --init --depth=1 third_party/emsdk
python3 tools/activate-emsdk
emsdk="$third_party/dawn/third_party/emsdk"
emscripten="$emsdk/upstream/emscripten"

# Generate the WebGPU bindings for Emscripten.
mkdir -p out/wasm
cd out/wasm

"$emscripten/emcmake" cmake ../.. -DDAWN_WERROR=1 -DDAWN_FETCH_DEPENDENCIES=ON
make clean
make -j4 emdawnwebgpu_pkg

popd
rsync -av --delete third_party/dawn/out/wasm/emdawnwebgpu_pkg/ emdawnwebgpu_pkg/
