# Copyright 2025 The Dawn & Tint Authors
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are met:
#
# 1. Redistributions of source code must retain the above copyright notice, this
#    list of conditions and the following disclaimer.
#
# 2. Redistributions in binary form must reproduce the above copyright notice,
#    this list of conditions and the following disclaimer in the documentation
#    and/or other materials provided with the distribution.
#
# 3. Neither the name of the copyright holder nor the names of its
#    contributors may be used to endorse or promote products derived from
#    this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
# AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
# IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
# DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
# FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
# DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
# SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
# CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
# OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

# Emscripten port file for webgpu and webgpu_cpp. See README for how to use.
#
# Style note: Variables starting with _ are local. The rest are part of the
# Python module interface for Emscripten ports.

import os
import zlib
from typing import Union, Dict, Optional

# User options, e.g. --use-port=path/to/emdawnwebgpu.port.py:cpp_bindings=false
OPTIONS = {
    'cpp_bindings':
    'Add the include path for <webgpu/webgpu_cpp.h> C++ bindings. Enabled by default.',
}

_VALID_OPTION_VALUES = {
    'cpp_bindings': ['true', 'false'],
}
_opts: Dict[str, Union[Optional[str], bool]] = {
    'cpp_bindings': True,
}


def _walk(path):
    for (dirpath, dirnames, filenames) in os.walk(path):
        for filename in filenames:
            yield os.path.join(dirpath, filename)


_pkg_dir = os.path.dirname(os.path.realpath(__file__))
_c_include_dir = os.path.join(_pkg_dir, 'webgpu', 'include')
_cpp_include_dir = os.path.join(_pkg_dir, 'webgpu_cpp', 'include')
_src_dir = os.path.join(_pkg_dir, 'webgpu', 'src')
_srcs = [
    os.path.join(_src_dir, 'webgpu.cpp'),
]
_files_affecting_port_build = sorted([
    __file__,
    *_srcs,
    *_walk(_c_include_dir),
])

# Hooks that affect compiler invocations


def _check_option(option, value, error_handler):
    if value not in _VALID_OPTION_VALUES[option]:
        error_handler(
            f'[{option}] can be {list(_VALID_OPTION_VALUES[option])}, got [{value}]'
        )
    if isinstance(_opts[option], bool):
        value = value == 'true'
    return value


def handle_options(options, error_handler):
    for option, value in options.items():
        value = value.lower()
        _opts[option] = _check_option(option, value, error_handler)


def process_args(ports):
    # It's important that these take precedent over Emscripten's builtin
    # system/include/, which also currently has webgpu headers.
    args = ['-isystem', _c_include_dir]
    if _opts['cpp_bindings']:
        args += ['-isystem', _cpp_include_dir]
    return args


# Hooks that affect linker invocations


# Derive the compile flags for webgpu.cpp based on the linker flags of the
# invocation that called --use-port.
def _compute_flags(settings):
    debug = f'-g{settings.DEBUG_LEVEL}'

    if settings.SHRINK_LEVEL == 2:
        opt = '-Oz'
    elif settings.SHRINK_LEVEL == 1:
        opt = '-Os'
    else:
        opt = f'-O{settings.OPT_LEVEL}'

    if settings.LTO == 'full':
        lto = ['-flto=full']
    elif settings.LTO == 'thin':
        lto = ['-flto=thin']
    else:
        lto = []

    return [debug, opt] + lto


# Create a unique lib name for this version of the port and compile flags.
def _get_lib_name(flags):
    # Compute a hash from all of the inputs to ports.build_port() so that
    # Emscripten knows when it needs to recompile.
    hash_value = 0

    def add(x):
        nonlocal hash_value
        hash_value = zlib.adler32(x, hash_value)

    for filename in _files_affecting_port_build:
        add(open(filename, 'rb').read())

    return f'lib_emdawnwebgpu-{hash_value:08x}{"".join(flags)}.a'


def linker_setup(ports, settings):
    if settings.USE_WEBGPU:
        raise Exception('emdawnwebgpu may not be used with -sUSE_WEBGPU=1')

    settings.JS_LIBRARIES += [
        os.path.join(_src_dir, 'library_webgpu_enum_tables.js'),
        os.path.join(_src_dir, 'library_webgpu_generated_struct_info.js'),
        os.path.join(_src_dir, 'library_webgpu_generated_sig_info.js'),
        os.path.join(_src_dir, 'library_webgpu.js'),
    ]
    # TODO(crbug.com/371024051): Emscripten needs a way for us to pass
    # --closure-args too.


def get(ports, settings, shared):
    if settings.allowed_settings:
        # This is the compile phase. We don't need to create the port until linking.
        return []

    computed_flags = _compute_flags(settings)

    def create(final):
        # Note we don't use ports.install_header; instead we directly add the
        # include path via process_args(). The only thing we cache is the
        # compiled webgpu.cpp (which also includes webgpu/webgpu.h).
        includes = [_c_include_dir]
        flags = ['-std=c++17', '-fno-exceptions'] + computed_flags
        # TODO(crbug.com/371024051): Need to support -O and -g options.
        # Is there a way to inherit these from the linker invocation?

        # IMPORTANT: Keep `_files_affecting_port_build` in sync with this.
        ports.build_port(
            '',  # src_dir is unused; we pass explicit srcs with absolute paths
            final,
            'emdawnwebgpu',
            includes=includes,
            flags=flags,
            srcs=_srcs)

    lib_name = _get_lib_name(computed_flags)
    return [shared.cache.get_lib(lib_name, create, what='port')]


def clear(ports, settings, shared):
    computed_flags = _compute_flags(settings)
    shared.cache.erase_lib(_get_lib_name(computed_flags))
