#!/bin/bash
set -euo pipefail

if [ ! -f "build_helper.sh" ] ; then
    echo "build_helper.sh must be called from project root"
    exit 1
fi
project_dir="$PWD"

if [ $# -lt 2 ] ; then
    echo "Usage: ./build_helper.sh BUILD_DIR CMAKE_FLAGS..."
    exit 1
fi

build_dir="$1"
shift
cmake_args=("$@")

source ./third_party/emsdk/emsdk_env.sh

mkdir -p "$build_dir"
cd "$build_dir"
emcmake cmake "$project_dir" "${cmake_args[@]}"
make clean
make -j2
