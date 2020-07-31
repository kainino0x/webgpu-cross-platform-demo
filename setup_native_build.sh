#!/bin/bash

set -e
THIRD_PARTY="$(dirname "$0")"/third_party/

mkdir -p "$THIRD_PARTY"
git clone https://dawn.googlesource.com/dawn "$THIRD_PARTY/dawn"

cd "$THIRD_PARTY/dawn"
git checkout --detach 05863e62f3dc20abb3673ce2df77ca3fbe1d6e13 --

cp scripts/standalone.gclient .gclient
gclient sync
