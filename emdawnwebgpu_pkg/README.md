# emdawnwebgpu

emdawnwebgpu is Dawn's implementation of webgpu.h for Emscripten (on top of the
WebGPU JS API). This package includes all of the necessary files to use
<webgpu/webgpu.h> and Dawn's <webgpu/webgpu_cpp.h> in Emscripten.

(Note, this is meant only to be used from a pre-built package directory.
It won't work if included directly from Dawn's source tree.)

Find new versions of this package at <https://github.com/google/dawn/releases>.
Report issues at <https://crbug.com/new?component=1570785&noWizard=True>.

## How to use this package

To add the include path for `<webgpu/webgpu.h>` and `<webgpu/webgpu_cpp.h>`,
pass this emcc compile flag:

    --use-port=path/to/emdawnwebgpu_pkg/emdawnwebgpu.port.py

And to link the implementation, pass these emcc link flags:

    --use-port=path/to/emdawnwebgpu_pkg/emdawnwebgpu.port.py
    --closure-args=--externs=path/to/emdawnwebgpu_pkg/webgpu/src/webgpu-externs.js

## C++ bindings

By default, C++ bindings are provided in the include path. Note that unlike
`webgpu.h`, these are not intended to be fully stable. If you don't want these
for any reason (you have custom bindings, you're using a pinned snapshot of
`webgpu_cpp.h`, etc.), you can set the option `cpp_bindings=false`:

    --use-port=path/to/emdawnwebgpu_pkg/emdawnwebgpu.port.py:cpp_bindings=false
