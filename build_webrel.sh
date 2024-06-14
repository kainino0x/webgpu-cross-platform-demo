#!/bin/bash
set -euo pipefail

source ./third_party/emsdk/emsdk_env.sh

mkdir -p out/webrel
cd out/webrel
emcmake cmake ../../ -DCMAKE_BUILD_TYPE=Release
make -j8
