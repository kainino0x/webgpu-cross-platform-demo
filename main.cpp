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

#undef NDEBUG
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
static const size_t size = sizeof(testData);

static dawn::Device device;
static dawn::Queue queue;
static dawn::Buffer readBuffer, writeBuffer;
static bool done = false;

void readCallback(DawnBufferMapAsyncStatus status, const void* ptr, uint64_t size, void*) {
    assert(status == DAWN_BUFFER_MAP_ASYNC_STATUS_SUCCESS);
    assert(size == size);
    printf("mapped read %p\n", ptr);
    int32_t readback = static_cast<const int32_t*>(ptr)[0];
    readBuffer.Unmap();
    printf("unmapped\n");

    printf("Got %d, expected %d\n", readback, testData);
    assert(readback == testData);
    if (readback != testData) {
        abort();
    }

    done = true;
};

void writeCallback(DawnBufferMapAsyncStatus status, void* ptr, uint64_t size, void*) {
    assert(status == DAWN_BUFFER_MAP_ASYNC_STATUS_SUCCESS);
    assert(size == size);
    printf("mapped write %p\n", ptr);
    static_cast<int32_t*>(ptr)[0] = testData;
    writeBuffer.Unmap();
    printf("unmapped\n");

    dawn::CommandEncoder enc = device.CreateCommandEncoder();
    enc.CopyBufferToBuffer(writeBuffer, 0, readBuffer, 0, size);
    dawn::CommandBuffer cb = enc.Finish();
    queue.Submit(1, &cb);

    printf("mapping read...\n");
    readBuffer.MapReadAsync(readCallback, nullptr);
}

void init() {
    device = CreateCppDawnDevice();
    queue = device.CreateQueue();

    {
        dawn::BufferDescriptor descriptor;
        descriptor.size = size;
        descriptor.usage = dawn::BufferUsage::CopyDst | dawn::BufferUsage::MapRead;

        readBuffer = device.CreateBuffer(&descriptor);
    }
    {
        dawn::BufferDescriptor descriptor;
        descriptor.size = size;
        descriptor.usage = dawn::BufferUsage::CopySrc | dawn::BufferUsage::MapWrite;

        writeBuffer = device.CreateBuffer(&descriptor);
    }

    printf("mapping write...\n");
    writeBuffer.MapWriteAsync(writeCallback, nullptr);
}

int main() {
    init();

#ifndef __EMSCRIPTEN__
    while (!done) {
        device.Tick();
    }
#endif
}
