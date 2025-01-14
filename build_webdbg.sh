#!/bin/bash
set -euo pipefail

source ./third_party/emsdk/emsdk_env.sh

mkdir -p out/webdbg
cd out/webdbg
emcmake cmake ../../ -DCMAKE_BUILD_TYPE=Debug -DDEMO_USE_JSPI=ON
make clean
make -j8
