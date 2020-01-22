#!/bin/bash

set -e
cd "$(dirname "$0")"/third_party/dawn/
cp scripts/standalone.gclient .gclient
gclient sync
gn gen out/Release --args='dawn_complete_static_libs=true'
ninja -C out/Release
