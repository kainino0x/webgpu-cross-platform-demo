#!/bin/bash
set -euo pipefail

source ./third_party/emsdk/emsdk_env.sh

mkdir -p out/webrel-sanitizers
cd out/webrel-sanitizers
emcmake cmake ../../ -DCMAKE_BUILD_TYPE=Release -DDEMO_USE_SANITIZERS=ON
make -j8
