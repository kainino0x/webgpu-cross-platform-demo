## emdawnwebgpu ##

emdawnwebgpu is Dawn's implementation of webgpu.h for Emscripten (on top of the
WebGPU JS API). This package includes all of the necessary files to use the
<webgpu/webgpu.h> in Emscripten.

Use emdawnwebgpu by passing the following emcc compile flags:
  --use-port=path/to/emdawnwebgpu_pkg/port.py
and link flags:
  --use-port=path/to/emdawnwebgpu_pkg/port.py
  --closure-args=--externs=path/to/emdawnwebgpu_pkg/src/webgpu-externs.js
(Note, this is meant only to be used from the output package directory. It
won't work if included directly from Dawn's third_party/emdawnwebgpu/.)

## C++ Bindings ##

This package also includes Dawn's C++ bindings <webgpu/webgpu_cpp.h>. Note these
C++ bindings are not intended to be stable. If you really want a stable C++ API,
you can snapshot the C++ files from this package. They are implemented on top of
<webgpu/webgpu.h>, which is intended to be stable, so older C++ bindings should
work with newer emdawnwebgpu implementations.
