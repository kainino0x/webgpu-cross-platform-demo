#!/bin/bash

set -e
THIRD_PARTY="$(dirname "$0")"/third_party/

mkdir -p "$THIRD_PARTY"
git clone https://dawn.googlesource.com/dawn "$THIRD_PARTY/dawn"

cd "$THIRD_PARTY/dawn"
git checkout --detach 2aee6eef7f07528d95047d04e9fd4fe359590b23 --

cp scripts/standalone.gclient .gclient
gclient sync
