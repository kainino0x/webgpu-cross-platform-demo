This is a small test app that uses WebGPU's
[`webgpu.h` header](https://github.com/webgpu-native/webgpu-headers/blob/main/webgpu.h)
as a platform-agnostic hardware abstraction layer.
It uses a C++ layer over `webgpu.h`, called `webgpu_cpp.h`.

On native platforms, this project can be built against
[Dawn](https://dawn.googlesource.com/dawn/), Chromium's native WebGPU implementation.

On the Web, this project can be built against Emscripten, using Dawn's "emdawnwebgpu"
implementation of `webgpu.h` on top of the browser's own WebGPU JavaScript API.

It currently hasn't been set up to build against
[wgpu-native](https://github.com/gfx-rs/wgpu-native)'s `webgpu.h` implementation,
but that is a goal.

**Check the [issues](https://github.com/kainino0x/webgpu-cross-platform-demo/issues) tab for known issues.**

**Please note the `webgpu.h` API (implemented by Dawn/wgpu-native/Emscripten) and `webgpu_cpp.h` bindings (from Dawn) are not yet stabilized.**

## Open pre-installed VSCode in Browser
[![Open in Gitpod](https://gitpod.io/button/open-in-gitpod.svg)](https://gitpod.io/#https://github.com/kainino0x/webgpu-cross-platform-demo)

## Building

Instructions are for Linux/Mac; Windows builds should work, but you need to
adjust the command syntax accordingly.

This setup step is always required for native builds.
For web builds, it is only strictly needed if you need to rebuild `emdawnwebgpu_pkg` (but
without it, you'll need to build manually with your own emsdk, because `build_all.sh` uses Dawn's).

### Web build

The web build has been mainly tested with Chrome Canary on Mac, but it should
work on any conformant browser and supported platform.

Once you have an [Emscripten SDK](https://emscripten.org/docs/tools_reference/emsdk.html), you can
simply build it using `emcmake`. This will use the snapshot of `emdawnwebgpu` in this repository.
You can also get newer releases of `emdawnwebgpu` from <https://github.com/google/dawn/releases>.

```sh
mkdir out/web
cd out/web
path/to/emcmake cmake ../.. -DDEMO_USE_ASYNCIFY=1  # Add other flags here as desired
make -j4
```

For development of emdawnwebgpu, there's a script that will build a bunch of
different variants. To use this, set up the Dawn dependency, which regenerates
`emdawnwebgpu_pkg`, and then run this script (which uses Dawn's copy of emsdk):

```sh
./setup_build.sh --checkout=1
./build_web_many_configs.sh --parallel=0
```

### Native build

Build has been tested on Linux/Mac/Win10 (though may be broken on some platforms).

```sh
mkdir -p out/native
cd out/native

# Using Make:
cmake ../..  # Add -DCMAKE_BUILD_TYPE=Release, -DDEMO_USE_GLFW=OFF, etc. here as desired
make clean
make -j4 all

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
