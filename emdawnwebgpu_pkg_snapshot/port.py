# Copyright 2025 The Emscripten Authors.  All rights reserved.
# Emscripten is available under two separate licenses, the MIT license and the
# University of Illinois/NCSA Open Source License.  Both these licenses can be
# found in the LICENSE file.

import os
import zlib


def walk(dir):
    for (dirpath, dirnames, filenames) in os.walk(include_c):
        for filename in filenames:
            yield os.path.join(dirpath, filename)


# FIXME: restore deleted upstream headers and try again to ensure include order
pkg_dir = os.path.dirname(os.path.realpath(__file__))
include_c = os.path.join(pkg_dir, 'include_c')
include_cpp = os.path.join(pkg_dir, 'include_cpp')
src_dir = os.path.join(pkg_dir, 'src')
srcs = [
    os.path.join(src_dir, 'webgpu.cpp'),
]
files_affecting_port_build = sorted([
    __file__,
    *srcs,
    *walk(include_c),
])


def get_lib_name(settings):
    # Compute a hash from all of the inputs to ports.build_port() so that
    # Emscripten knows when it needs to recompile.
    hash_value = 0

    def add(x):
        nonlocal hash_value
        hash_value = zlib.adler32(x, hash_value)

    for filename in files_affecting_port_build:
        add(open(filename, 'rb').read())

    return f'lib_emdawnwebgpu-{hash_value:08x}.a'


def linker_setup(ports, settings):
    if settings.USE_WEBGPU:
        raise Exception('emdawnwebgpu may not be used with -sUSE_WEBGPU=1')

    settings.JS_LIBRARIES += [
        os.path.join(src_dir, 'library_webgpu_enum_tables.js'),
        os.path.join(src_dir, 'library_webgpu_generated_struct_info.js'),
        os.path.join(src_dir, 'library_webgpu_generated_sig_info.js'),
        os.path.join(src_dir, 'library_webgpu.js'),
    ]
    # TODO(crbug.com/371024051): Figure out how to pass --closure-args too.


def process_args(ports):
    # It's important that these take precedent over Emscripten's builtin
    # system/include/, which also currently has webgpu headers.
    return [
        '-isystem',
        include_c,
        '-isystem',
        include_cpp,
    ]


def get(ports, settings, shared):

    def create(final):
        # Note we don't use ports.install_header; instead we directly add the
        # include path via process_args(). The only thing we cache is the
        # compiled webgpu.cpp (which also includes webgpu/webgpu.h).
        includes = [include_c]
        flags = ['-std=c++17', '-fno-exceptions']

        # IMPORTANT: Keep `files_affecting_port_build` in sync with this.
        ports.build_port(src_dir,
                         final,
                         'emdawnwebgpu',
                         includes=includes,
                         flags=flags,
                         srcs=srcs)

    return [shared.cache.get_lib(get_lib_name(settings), create, what='port')]


def clear(ports, settings, shared):
    shared.cache.erase_lib(get_lib_name(settings))
