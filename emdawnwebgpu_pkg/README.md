# emdawnwebgpu

emdawnwebgpu is Dawn's implementation of webgpu.h for Emscripten (on top of the
WebGPU JS API). This package includes all of the necessary files to use
<webgpu/webgpu.h> and Dawn's <webgpu/webgpu_cpp.h> in Emscripten.

Find new versions of this package at <https://github.com/google/dawn/releases>.

(Note, this is meant only to be used from a pre-built package directory.
It won't work if included directly from Dawn's source tree.)

## C to JS Bindings

To add the include path for <webgpu/webgpu.h>, pass this emcc compile flag:

    --use-port=path/to/emdawnwebgpu_pkg/emdawnwebgpu.port.py

And to link the implementation, pass these emcc link flags:

    --use-port=path/to/emdawnwebgpu_pkg/emdawnwebgpu.port.py
    --closure-args=--externs=path/to/emdawnwebgpu_pkg/webgpu/src/webgpu-externs.js

## C++ to C Bindings

This package also includes Dawn's C++ bindings <webgpu/webgpu_cpp.h>, which are
recommended for easier C++ development. These are generated for Emscripten
specifically, so use this instead of the Dawn native version of webgpu_cpp.h.

To add the include path for <webgpu/webgpu_cpp.h>, pass this emcc compile flag
*in addition* to the one above.

    --use-port=path/to/emdawnwebgpu_pkg/emdawnwebgpu_cpp.port.py

Do note that these C++ bindings are *not* intended to be fully stable. If you
really want a stable C++ API, you can snapshot the C++ files from this package
(though you won't get future improvements and future API additions). The C++
bindings are implemented on top of <webgpu/webgpu.h>, which *is* intended to be
stable, so older C++ bindings should generally work with newer emdawnwebgpu
packages.
