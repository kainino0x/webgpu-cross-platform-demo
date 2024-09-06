#!/bin/bash
set -euo pipefail

source ./third_party/emsdk/emsdk_env.sh

mkdir -p out/webdbg-sanitizers
cd out/webdbg-sanitizers
emcmake cmake ../../ -DCMAKE_BUILD_TYPE=Debug -DDEMO_USE_SANITIZERS=ON
make -j8
