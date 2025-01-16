#!/bin/bash
set -euo pipefail

source ./third_party/emsdk/emsdk_env.sh

mkdir -p out/webdbgbigint
cd out/webdbgbigint
emcmake cmake ../../ -DCMAKE_BUILD_TYPE=Debug -DDEMO_USE_JSPI=ON -DDEMO_USE_WASM_BIGINT=ON
make clean
make -j8
