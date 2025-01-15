#!/bin/bash
set -euo pipefail

source ./third_party/emsdk/emsdk_env.sh

mkdir -p out/webrel64-sanitizers
cd out/webrel64-sanitizers
emcmake cmake ../../ -DCMAKE_BUILD_TYPE=Release -DDEMO_USE_SANITIZERS=ON -DDEMO_USE_JSPI=ON -DDEMO_USE_WASM_MEMORY64=ON
make clean
make -j8
