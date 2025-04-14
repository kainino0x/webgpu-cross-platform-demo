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

import os
import zlib


def walk(path):
    for (dirpath, dirnames, filenames) in os.walk(path):
        for filename in filenames:
            yield os.path.join(dirpath, filename)


port_dir = os.path.join(os.path.dirname(os.path.realpath(__file__)), 'webgpu')
include = os.path.join(port_dir, 'include')
src_dir = os.path.join(port_dir, 'src')
srcs = [
    os.path.join(src_dir, 'webgpu.cpp'),
]
files_affecting_port_build = sorted([
    __file__,
    *srcs,
    *walk(include),
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


def process_args(ports):
    # It's important that these take precedent over Emscripten's builtin
    # system/include/, which also currently has webgpu headers.
    return ['-isystem', include]


def linker_setup(ports, settings):
    if settings.USE_WEBGPU:
        raise Exception('emdawnwebgpu may not be used with -sUSE_WEBGPU=1')

    settings.JS_LIBRARIES += [
        os.path.join(src_dir, 'library_webgpu_enum_tables.js'),
        os.path.join(src_dir, 'library_webgpu_generated_struct_info.js'),
        os.path.join(src_dir, 'library_webgpu_generated_sig_info.js'),
        os.path.join(src_dir, 'library_webgpu.js'),
    ]
    # TODO(crbug.com/371024051): Emscripten needs a way for us to pass
    # --closure-args too.


def get(ports, settings, shared):

    def create(final):
        # Note we don't use ports.install_header; instead we directly add the
        # include path via process_args(). The only thing we cache is the
        # compiled webgpu.cpp (which also includes webgpu/webgpu.h).
        includes = [include]
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
