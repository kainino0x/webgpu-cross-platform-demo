#!/bin/bash
set -euo pipefail

source ./third_party/emsdk/emsdk_env.sh

mkdir -p out/webdbg4gb
cd out/webdbg4gb
emcmake cmake ../../ -DCMAKE_BUILD_TYPE=Debug -DDEMO_USE_JSPI=ON -DDEMO_USE_WASM_4GB=ON
make clean
make -j8
