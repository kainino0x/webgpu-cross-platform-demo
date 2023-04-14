#!/bin/bash

set -e
THIRD_PARTY="$(dirname "$0")"/third_party/

mkdir -p "$THIRD_PARTY"
cd "$THIRD_PARTY"
if [ ! -e dawn/ ] ; then
    git clone https://dawn.googlesource.com/dawn dawn/
    cd dawn/
else
    cd dawn/
    git fetch origin
fi

git checkout --detach 4489109c86c64330dc7005cc9d279370cce7a71a --

cp scripts/standalone.gclient .gclient
gclient sync
