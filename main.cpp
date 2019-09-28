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

static const uint32_t vsCode[] = {
    119734787, 65536, 851975, 38, 0, 131089, 1, 393227, 1, 1280527431, 1685353262, 808793134, 0, 196622, 0, 1, 458767, 0, 4, 1852399981, 0, 10, 24, 196611, 1, 310, 655364, 1197427783, 1279741775, 1885560645, 1953718128, 1600482425, 1701734764, 1919509599, 1769235301, 25974, 524292, 1197427783, 1279741775, 1852399429, 1685417059, 1768185701, 1952671090, 6649449, 262149, 4, 1852399981, 0, 393221, 8, 1348430951, 1700164197, 2019914866, 0, 393222, 8, 0, 1348430951, 1953067887, 7237481, 458758, 8, 1, 1348430951, 1953393007, 1702521171, 0, 196613, 10, 0, 393221, 24, 1449094247, 1702130277, 1684949368, 30821, 327685, 27, 1701080681, 1818386808, 101, 327752, 8, 0, 11, 0, 327752, 8, 1, 11, 1, 196679, 8, 2, 262215, 24, 11, 42, 131091, 2, 196641, 3, 2, 196630, 6, 32, 262167, 7, 6, 4, 262174, 8, 7, 6, 262176, 9, 3, 8, 262203, 9, 10, 3, 262165, 11, 32, 1, 262187, 11, 12, 0, 262167, 13, 6, 2, 262165, 14, 32, 0, 262187, 14, 15, 3, 262172, 16, 13, 15, 262187, 6, 17, 3212836864, 327724, 13, 18, 17, 17, 262187, 6, 19, 1073741824, 327724, 13, 20, 17, 19, 327724, 13, 21, 19, 17, 393260, 16, 22, 18, 20, 21, 262176, 23, 1, 11, 262203, 23, 24, 1, 262176, 26, 7, 16, 262176, 28, 7, 13, 262187, 6, 31, 0, 262187, 6, 32, 1065353216, 262176, 36, 3, 7, 327734, 2, 4, 0, 3, 131320, 5, 262203, 26, 27, 7, 262205, 11, 25, 24, 196670, 27, 22, 327745, 28, 29, 27, 25, 262205, 13, 30, 29, 327761, 6, 33, 30, 0, 327761, 6, 34, 30, 1, 458832, 7, 35, 33, 34, 31, 32, 327745, 36, 37, 10, 12, 196670, 37, 35, 65789, 65592
};
static const uint32_t fsCode[] = {
    119734787, 65536, 851975, 14, 0, 131089, 1, 393227, 1, 1280527431, 1685353262, 808793134, 0, 196622, 0, 1, 393231, 4, 4, 1852399981, 0, 9, 196624, 4, 7, 196611, 1, 310, 655364, 1197427783, 1279741775, 1885560645, 1953718128, 1600482425, 1701734764, 1919509599, 1769235301, 25974, 524292, 1197427783, 1279741775, 1852399429, 1685417059, 1768185701, 1952671090, 6649449, 262149, 4, 1852399981, 0, 327685, 9, 1734439526, 1869377347, 114, 196679, 9, 0, 262215, 9, 30, 0, 131091, 2, 196641, 3, 2, 196630, 6, 32, 262167, 7, 6, 4, 262176, 8, 3, 7, 262203, 8, 9, 3, 262187, 6, 10, 0, 262187, 6, 11, 1056964608, 262187, 6, 12, 1065353216, 458796, 7, 13, 10, 11, 10, 12, 327734, 2, 4, 0, 3, 131320, 5, 196670, 9, 13, 65789, 65592
};
static const uint32_t expectData = 0xff008000;

static dawn::Device device;
static dawn::Queue queue;
static dawn::Buffer buffer;
static dawn::RenderPipeline pipeline;
static dawn::Texture texture;
static bool done = false;

void readCallback(DawnBufferMapAsyncStatus status, const void* ptr, uint64_t size, void*) {
    assert(status == DAWN_BUFFER_MAP_ASYNC_STATUS_SUCCESS);
    printf("mapped read %p\n", ptr);
    uint32_t readback = static_cast<const uint32_t*>(ptr)[0];
    buffer.Unmap();
    printf("unmapped\n");

    printf("Got %08x, expected %08x\n", readback, expectData);
    assert(readback == expectData);
    if (readback != expectData) {
        abort();
    }

    done = true;
};

void printDeviceError(DawnErrorType errorType, const char* message, void*) {
    printf("%d: %s\n", errorType, message);
}

void init() {
    {
        device = CreateCppDawnDevice();
        device.SetUncapturedErrorCallback(printDeviceError, nullptr);
    }

    queue = device.CreateQueue();

    {
        dawn::TextureDescriptor descriptor = {};
        descriptor.usage = dawn::TextureUsage::OutputAttachment | dawn::TextureUsage::CopySrc;
        descriptor.size = {1, 1, 1};
        descriptor.format = dawn::TextureFormat::RGBA8Unorm;
        texture = device.CreateTexture(&descriptor);
    }

    {
        dawn::BufferDescriptor descriptor = {};
        descriptor.size = 4;
        descriptor.usage = dawn::BufferUsage::CopyDst | dawn::BufferUsage::MapRead;

        buffer = device.CreateBuffer(&descriptor);
    }

    dawn::ShaderModule vsModule = {};
    {
        dawn::ShaderModuleDescriptor descriptor = {};
        descriptor.codeSize = sizeof(vsCode) / sizeof(uint32_t);
        descriptor.code = vsCode;
        vsModule = device.CreateShaderModule(&descriptor);
    }

    dawn::ShaderModule fsModule = {};
    {
        dawn::ShaderModuleDescriptor descriptor = {};
        descriptor.codeSize = sizeof(fsCode) / sizeof(uint32_t);
        descriptor.code = fsCode;
        fsModule = device.CreateShaderModule(&descriptor);
    }

    {
        dawn::PipelineStageDescriptor fragmentStage = {};
        fragmentStage.module = fsModule;
        fragmentStage.entryPoint = "main";

        dawn::ColorStateDescriptor colorStateDescriptor = {};
        colorStateDescriptor.format = dawn::TextureFormat::RGBA8Unorm;

        dawn::ColorStateDescriptor* colorStates[] = {&colorStateDescriptor};

        dawn::PipelineLayoutDescriptor pl = {};
        pl.bindGroupLayoutCount = 0;
        pl.bindGroupLayouts = nullptr;

        dawn::RenderPipelineDescriptor descriptor = {};
        descriptor.layout = device.CreatePipelineLayout(&pl);
        descriptor.vertexStage.module = vsModule;
        descriptor.vertexStage.entryPoint = "main";
        descriptor.fragmentStage = &fragmentStage;
        descriptor.colorStateCount = 1;
        descriptor.colorStates = colorStates;
        descriptor.primitiveTopology = dawn::PrimitiveTopology::TriangleList;
        pipeline = device.CreateRenderPipeline(&descriptor);
    }
}

void render() {
    dawn::RenderPassColorAttachmentDescriptor attachment = {};
    attachment.attachment = texture.CreateView();
    attachment.loadOp = dawn::LoadOp::Clear;
    attachment.storeOp = dawn::StoreOp::Store;
    attachment.clearColor = {0, 0, 0, 1};

    dawn::RenderPassColorAttachmentDescriptor* attachments[1] = {&attachment};

    dawn::RenderPassDescriptor renderpass = {};
    renderpass.colorAttachmentCount = 1;
    renderpass.colorAttachments = attachments;

    dawn::CommandBuffer commands;
    {
        dawn::CommandEncoder encoder = device.CreateCommandEncoder();
        {
            dawn::RenderPassEncoder pass = encoder.BeginRenderPass(&renderpass);
            pass.SetPipeline(pipeline);
            pass.Draw(3, 1, 0, 0);
            pass.EndPass();
        }
        {
            dawn::TextureCopyView tcv = {};
            tcv.texture = texture;
            tcv.origin = {0, 0, 0};
            dawn::BufferCopyView bcv = {};
            bcv.buffer = buffer;
            bcv.rowPitch = 256;
            bcv.imageHeight = 256;
            dawn::Extent3D extent = {1, 1, 1};
            encoder.CopyTextureToBuffer(&tcv, &bcv, &extent);
        }
        commands = encoder.Finish();
    }

    queue.Submit(1, &commands);
    buffer.MapReadAsync(readCallback, nullptr);
}

int main() {
    init();
    render();

#ifndef __EMSCRIPTEN__
    while (!done) {
        device.Tick();
    }
#endif
}
