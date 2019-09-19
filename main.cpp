// Copyright 2019 The Dawn Authors
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

#include <dawn/dawncpp.h>

#include <cassert>
#include <cstdio>
#include <cstdlib>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/html5.h>

dawn::Device CreateCppDawnDevice() {
    return dawn::Device::Acquire(emscripten_webgpu_get_device());
}
#else
#include <dawn_native/DawnNative.h>
#include <memory>

static std::unique_ptr<dawn_native::Instance> instance;

dawn::Device CreateCppDawnDevice() {
    instance = std::make_unique<dawn_native::Instance>();
    instance->DiscoverDefaultAdapters();

    // Get an adapter for the backend to use, and create the device.
    dawn_native::Adapter backendAdapter = instance->GetAdapters()[0];
    assert(backendAdapter.GetBackendType() == dawn_native::BackendType::Metal);

    dawn::Device device = dawn::Device::Acquire(backendAdapter.CreateDevice());
    DawnProcTable procs = dawn_native::GetProcs();

    dawnSetProcs(&procs);
    return device;
}
#endif

static const uint32_t testData = 1337;

static dawn::Device device;
static bool done = false;

void callback(DawnBufferMapAsyncStatus status, const void* ptr, uint64_t size, void* userdata) {
    assert(status == DAWN_BUFFER_MAP_ASYNC_STATUS_SUCCESS);
    assert(size == sizeof(int32_t));
    int32_t readback = static_cast<const int32_t*>(ptr)[0];
    printf("Got %d, expected %d\n", readback, testData);
    assert(readback == testData);
    if (readback != testData) {
        abort();
    }
    *static_cast<bool*>(userdata) = true;
};

void init() {
    device = CreateCppDawnDevice();

    dawn::Buffer buffer;
    {
        dawn::BufferDescriptor descriptor;
        descriptor.size = sizeof(testData);
        descriptor.usage = dawn::BufferUsage::CopyDst | dawn::BufferUsage::MapRead;

        buffer = device.CreateBuffer(&descriptor);
        buffer.SetSubData(0, sizeof(testData), &testData);
    }
    buffer.MapReadAsync(callback, &done);
}

int main() {
    init();

#ifndef __EMSCRIPTEN__
    while (!done) {
        device.Tick();
    }
#endif
}
