This is a small test app that uses WebGPU's unofficial
[`webgpu.h` header](https://github.com/webgpu-native/webgpu-headers/blob/main/webgpu.h)
as a platform-agnostic hardware abstraction layer.
It uses a C++ layer over `webgpu.h`, called `webgpu_cpp.h`.
On native platforms, this project can be built against
[Dawn](https://dawn.googlesource.com/dawn/), Chromium's native WebGPU implementation.
On the Web, this project can be built against Emscripten, which implements `webgpu.h`
on top of the browser's own WebGPU JavaScript API (if
[enabled](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status)).
It currently hasn't been set up to build against
[wgpu-native](https://github.com/gfx-rs/wgpu-native)'s `webgpu.h` implementation,
but that is a goal.

**Check the [issues](https://github.com/kainino0x/webgpu-cross-platform-demo/issues) tab for known issues.**

## Building

Instructions are for Linux/Mac; they will need to be adapted to work on Windows.

### Native build

Build has only been tested on Linux/Mac.

```sh
./setup_native_build.sh
mkdir -p out/native
cd out/native
cmake ../..
make clean all
```

### Web build

This has been mainly tested with Chrome Canary on Mac, but should work on
Chrome/Edge/Firefox on any platform with support.
Requires `chrome://flags/#enable-unsafe-webgpu` on Chrome/Edge.

**Note:** To build, the active Emscripten version must be at least 2.0.0.

```sh
# Make sure Emscripten tools are in the path.
pushd path/to/emsdk
source emsdk_env.sh
popd

mkdir -p out/web
cd out/web
emcmake cmake ../..
make clean all
```
