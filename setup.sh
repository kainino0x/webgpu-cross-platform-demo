#!/bin/bash

set -e
cd "$(dirname "$0")"/third_party/dawn/
cp scripts/standalone.gclient .gclient
gclient sync
