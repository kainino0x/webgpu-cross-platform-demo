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

**Please note the `webgpu.h` API (implemented by Dawn/wgpu-native/Emscripten) and `webgpu_cpp.h` bindings (from Dawn) are not yet stabilized.**

## Open pre-installed VSCode in Browser
[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/kainino0x/webgpu-cross-platform-demo)

## Building

Instructions are for Linux/Mac; they will need to be adapted to work on Windows.

This setup step is always required for native builds.
For web builds, it is only strictly needed if you need to rebuild `emdawnwebgpu_pkg_snapshot` (but
without it, you'll need to build manually with your own emsdk, because `build_all.sh` uses Dawn's).

```sh
./setup_build.sh
```

### Native build

Build has been tested on Linux/Mac/Win10.

For a quick build, use:

```sh
npm run build-native  # using Make
# or
npm run ninja-native  # using Ninja
```

Detailed steps:

```sh
mkdir -p out/native
cd out/native

# Using Make:
cmake ../..  # Add -DCMAKE_BUILD_TYPE=Release, -DDEMO_USE_GLFW=OFF, etc. here as desired
make -j4 clean all

# Or, to use Ninja instead of Make:
cmake -GNinja ../..  # Add flags here as desired
ninja
```

Note: If you want to have window displayed, make sure to have glfw available.

<details>
  <summary>How to config glfw package on each platform?</summary>

  - Linux
    ```sh
    apt-get install libglfw3-dev
    ```
  - macOS
    ```sh
    brew install glfw
    ```
  - Win
    - Manually
        - Download glfw source package and windows pre-compiled binaries from [here](https://www.glfw.org/download)
        - Unzip (e.g. version 3.3.8) `glfw-3.3.8.zip` to `C:/Program Files (x86)/glfw/`
        - Unzip (e.g. version 3.3.8) `glfw-3.3.8.bin.WIN64.zip` and put `lib-vc2022` to `C:/Program Files (x86)/glfw/lib-vc2022` (assume you are using Visual Studio 2022 to build)
        - You are done. `cmake/modules/Findglfw3.cmake` is used to find them (You can edit the path it uses)
    - vcpkg
        - Here is a fork that uses vcpkg to manage glfw: [link](https://github.com/bitsauce/webgpu-cross-platform-demo)
</details>


Alternatively, you can disable using glfw and window display by

```sh
cmake ../.. -DDEMO_USE_GLFW=OFF
```

### Web build

This has been mainly tested with Chrome Canary on Mac, but should work on
Chrome/Edge/Firefox on any platform with support (modulo compatibility differences due to
pre-release spec changes).

```sh
./build_all.sh --parallel=0
```
