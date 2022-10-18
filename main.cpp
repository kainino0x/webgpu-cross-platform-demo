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

#ifdef __EMSCRIPTEN__
#include <webgpu/webgpu_cpp.h>
#else
#include <dawn/webgpu_cpp.h>
#endif

#undef NDEBUG

#include <algorithm>
#include <cassert>
#include <cstdio>
#include <cstdlib>
#include <memory>

#ifdef __EMSCRIPTEN__
#include <emscripten.h>
#include <emscripten/html5.h>
#include <emscripten/html5_webgpu.h>

void GetDevice(void (*callback)(wgpu::Device)) {
    // Left as null (until supported in Emscripten)
    static const WGPUInstance instance = nullptr;

    wgpuInstanceRequestAdapter(instance, nullptr, [](WGPURequestAdapterStatus status, WGPUAdapter adapter, const char* message, void* userdata) {
        if (message) {
            printf("wgpuInstanceRequestAdapter: %s\n", message);
        }
        if (status == WGPURequestAdapterStatus_Unavailable) {
            printf("WebGPU unavailable; exiting cleanly\n");
            // exit(0) (rather than emscripten_force_exit(0)) ensures there is no dangling keepalive.
            exit(0);
        }
        assert(status == WGPURequestAdapterStatus_Success);

        wgpuAdapterRequestDevice(adapter, nullptr, [](WGPURequestDeviceStatus status, WGPUDevice dev, const char* message, void* userdata) {
            if (message) {
                printf("wgpuAdapterRequestDevice: %s\n", message);
            }
            assert(status == WGPURequestDeviceStatus_Success);

            wgpu::Device device = wgpu::Device::Acquire(dev);
            reinterpret_cast<void (*)(wgpu::Device)>(userdata)(device);
        }, userdata);
    }, reinterpret_cast<void*>(callback));
}
#else  // __EMSCRIPTEN__
#include <dawn/dawn_proc.h>
#include <dawn/native/DawnNative.h>

static std::unique_ptr<dawn::native::Instance> instance;

// Return backend select priority, smaller number means higher priority.
int GetBackendPriority(wgpu::BackendType t) {
  switch (t) {
    case wgpu::BackendType::Null:
      return 9999;
    case wgpu::BackendType::D3D12:
    case wgpu::BackendType::Metal:
    case wgpu::BackendType::Vulkan:
      return 0;
    case wgpu::BackendType::WebGPU:
      return 5;
    case wgpu::BackendType::D3D11:
    case wgpu::BackendType::OpenGLES:
      return 10;
  }
  return 100;
}

const char* BackendTypeName(wgpu::BackendType t)
{
  switch (t) {
    case wgpu::BackendType::Null:
      return "Null";
    case wgpu::BackendType::WebGPU:
      return "WebGPU";
    case wgpu::BackendType::D3D11:
      return "D3D11";
    case wgpu::BackendType::D3D12:
      return "D3D12";
    case wgpu::BackendType::Metal:
      return "Metal";
    case wgpu::BackendType::Vulkan:
      return "Vulkan";
    case wgpu::BackendType::OpenGL:
      return "OpenGL";
    case wgpu::BackendType::OpenGLES:
      return "OpenGL ES";
  }
  return "?";
}

const char* AdapterTypeName(wgpu::AdapterType t)
{
  switch (t) {
    case wgpu::AdapterType::DiscreteGPU:
      return "Discrete GPU";
    case wgpu::AdapterType::IntegratedGPU:
      return "Integrated GPU";
    case wgpu::AdapterType::CPU:
      return "CPU";
    case wgpu::AdapterType::Unknown:
      return "Unknown";
  }
  return "?";
}

void GetDevice(void (*callback)(wgpu::Device)) {
    instance = std::make_unique<dawn::native::Instance>();
    instance->DiscoverDefaultAdapters();

    auto adapters = instance->GetAdapters();

    // Sort adapters by adapterType, 
    std::sort(adapters.begin(), adapters.end(), [](const dawn::native::Adapter& a, const dawn::native::Adapter& b){
        wgpu::AdapterProperties pa, pb;
        a.GetProperties(&pa);
        b.GetProperties(&pb);
        
        if (pa.adapterType != pb.adapterType) {
            // Put GPU adapter (D3D, Vulkan, Metal) at front and CPU adapter at back.
            return pa.adapterType < pb.adapterType;
        }

        return GetBackendPriority(pa.backendType) < GetBackendPriority(pb.backendType);
    });
    // Simply pick the first adapter in the sorted list.
    dawn::native::Adapter backendAdapter = adapters[0];

    printf("Available adapters sorted by their Adapter type, with GPU adapters listed at front and preferred:\n\n");
    printf(" [Selected] -> ");
    for (auto&& a : adapters) {
        wgpu::AdapterProperties p;
        a.GetProperties(&p);
        printf(
            "* %s (%s)\n"
            "    deviceID=%u, vendorID=0x%x, BackendType::%s, AdapterType::%s\n",
        p.name, p.driverDescription, p.deviceID, p.vendorID,
        BackendTypeName(p.backendType), AdapterTypeName(p.adapterType));
    }
    printf("\n\n");

    
    wgpu::Device device = wgpu::Device::Acquire(backendAdapter.CreateDevice());
    DawnProcTable procs = dawn::native::GetProcs();

    dawnProcSetProcs(&procs);
    callback(device);
}
#endif  // __EMSCRIPTEN__

static const char shaderCode[] = R"(
    @stage(vertex)
    fn main_v(@builtin(vertex_index) idx: u32) -> @builtin(position) vec4<f32> {
        var pos = array<vec2<f32>, 3>(
            vec2<f32>(0.0, 0.5), vec2<f32>(-0.5, -0.5), vec2<f32>(0.5, -0.5));
        return vec4<f32>(pos[idx], 0.0, 1.0);
    }
    @stage(fragment)
    fn main_f() -> @location(0) vec4<f32> {
        return vec4<f32>(0.0, 0.502, 1.0, 1.0); // 0x80/0xff ~= 0.502
    }
)";

static wgpu::Device device;
static wgpu::Queue queue;
static wgpu::Buffer readbackBuffer;
static wgpu::RenderPipeline pipeline;
static int testsCompleted = 0;

void init() {
    device.SetUncapturedErrorCallback(
        [](WGPUErrorType errorType, const char* message, void*) {
            printf("%d: %s\n", errorType, message);
        }, nullptr);

    queue = device.GetQueue();

    wgpu::ShaderModule shaderModule{};
    {
        wgpu::ShaderModuleWGSLDescriptor wgslDesc{};
        wgslDesc.source = shaderCode;

        wgpu::ShaderModuleDescriptor descriptor{};
        descriptor.nextInChain = &wgslDesc;
        shaderModule = device.CreateShaderModule(&descriptor);
    }

    {
        wgpu::BindGroupLayoutDescriptor bglDesc{};
        auto bgl = device.CreateBindGroupLayout(&bglDesc);
        wgpu::BindGroupDescriptor desc{};
        desc.layout = bgl;
        desc.entryCount = 0;
        desc.entries = nullptr;
        device.CreateBindGroup(&desc);
    }

    {
        wgpu::PipelineLayoutDescriptor pl{};
        pl.bindGroupLayoutCount = 0;
        pl.bindGroupLayouts = nullptr;

        wgpu::ColorTargetState colorTargetState{};
        colorTargetState.format = wgpu::TextureFormat::BGRA8Unorm;

        wgpu::FragmentState fragmentState{};
        fragmentState.module = shaderModule;
        fragmentState.entryPoint = "main_f";
        fragmentState.targetCount = 1;
        fragmentState.targets = &colorTargetState;

        wgpu::DepthStencilState depthStencilState{};
        depthStencilState.format = wgpu::TextureFormat::Depth32Float;

        wgpu::RenderPipelineDescriptor descriptor{};
        descriptor.layout = device.CreatePipelineLayout(&pl);
        descriptor.vertex.module = shaderModule;
        descriptor.vertex.entryPoint = "main_v";
        descriptor.fragment = &fragmentState;
        descriptor.primitive.topology = wgpu::PrimitiveTopology::TriangleList;
        descriptor.depthStencil = &depthStencilState;
        pipeline = device.CreateRenderPipeline(&descriptor);
    }
}

// The depth stencil attachment isn't really needed to draw the triangle
// and doesn't really affect the render result.
// But having one should give us a slightly better test coverage for the compile of the depth stencil descriptor.
void render(wgpu::TextureView view, wgpu::TextureView depthStencilView) {
    wgpu::RenderPassColorAttachment attachment{};
    attachment.view = view;
    attachment.loadOp = wgpu::LoadOp::Clear;
    attachment.storeOp = wgpu::StoreOp::Store;
    attachment.clearValue = {0, 0, 0, 1};

    wgpu::RenderPassDescriptor renderpass{};
    renderpass.colorAttachmentCount = 1;
    renderpass.colorAttachments = &attachment;

    wgpu::RenderPassDepthStencilAttachment depthStencilAttachment = {};
    depthStencilAttachment.view = depthStencilView;
    depthStencilAttachment.depthClearValue = 0;
    depthStencilAttachment.depthLoadOp = wgpu::LoadOp::Clear;
    depthStencilAttachment.depthStoreOp = wgpu::StoreOp::Store;

    renderpass.depthStencilAttachment = &depthStencilAttachment;

    wgpu::CommandBuffer commands;
    {
        wgpu::CommandEncoder encoder = device.CreateCommandEncoder();
        {
            wgpu::RenderPassEncoder pass = encoder.BeginRenderPass(&renderpass);
            pass.SetPipeline(pipeline);
            pass.Draw(3);
            pass.End();
        }
        commands = encoder.Finish();
    }

    queue.Submit(1, &commands);
}

void issueContentsCheck(const char* functionName,
        wgpu::Buffer readbackBuffer, uint32_t expectData) {
    struct UserData {
        const char* functionName;
        wgpu::Buffer readbackBuffer;
        uint32_t expectData;
    };

    UserData* userdata = new UserData;
    userdata->functionName = functionName;
    userdata->readbackBuffer = readbackBuffer;
    userdata->expectData = expectData;

    readbackBuffer.MapAsync(
        wgpu::MapMode::Read, 0, 4,
        [](WGPUBufferMapAsyncStatus status, void* vp_userdata) {
            assert(status == WGPUBufferMapAsyncStatus_Success);
            std::unique_ptr<UserData> userdata(reinterpret_cast<UserData*>(vp_userdata));

            const void* ptr = userdata->readbackBuffer.GetConstMappedRange();

            printf("%s: readback -> %p%s\n", userdata->functionName,
                    ptr, ptr ? "" : " <------- FAILED");
            assert(ptr != nullptr);
            uint32_t readback = static_cast<const uint32_t*>(ptr)[0];
            printf("  got %08x, expected %08x%s\n",
                readback, userdata->expectData,
                readback == userdata->expectData ? "" : " <------- FAILED");
            userdata->readbackBuffer.Unmap();

            testsCompleted++;
        }, userdata);
}

void doCopyTestMappedAtCreation(bool useRange) {
    static constexpr uint32_t kValue = 0x05060708;
    size_t size = useRange ? 12 : 4;
    wgpu::Buffer src;
    {
        wgpu::BufferDescriptor descriptor{};
        descriptor.size = size;
        descriptor.usage = wgpu::BufferUsage::CopySrc;
        descriptor.mappedAtCreation = true;
        src = device.CreateBuffer(&descriptor);
    }
    size_t offset = useRange ? 8 : 0;
    uint32_t* ptr = static_cast<uint32_t*>(useRange ?
            src.GetMappedRange(offset, 4) :
            src.GetMappedRange());
    printf("%s: getMappedRange -> %p%s\n", __FUNCTION__,
            ptr, ptr ? "" : " <------- FAILED");
    assert(ptr != nullptr);
    *ptr = kValue;
    src.Unmap();

    wgpu::Buffer dst;
    {
        wgpu::BufferDescriptor descriptor{};
        descriptor.size = 4;
        descriptor.usage = wgpu::BufferUsage::CopyDst | wgpu::BufferUsage::MapRead;
        dst = device.CreateBuffer(&descriptor);
    }

    wgpu::CommandBuffer commands;
    {
        wgpu::CommandEncoder encoder = device.CreateCommandEncoder();
        encoder.CopyBufferToBuffer(src, offset, dst, 0, 4);
        commands = encoder.Finish();
    }
    queue.Submit(1, &commands);

    issueContentsCheck(__FUNCTION__, dst, kValue);
}

void doCopyTestMapAsync(bool useRange) {
    static constexpr uint32_t kValue = 0x01020304;
    size_t size = useRange ? 12 : 4;
    wgpu::Buffer src;
    {
        wgpu::BufferDescriptor descriptor{};
        descriptor.size = size;
        descriptor.usage = wgpu::BufferUsage::MapWrite | wgpu::BufferUsage::CopySrc;
        src = device.CreateBuffer(&descriptor);
    }
    size_t offset = useRange ? 8 : 0;

    struct UserData {
        const char* functionName;
        bool useRange;
        size_t offset;
        wgpu::Buffer src;
    };

    UserData* userdata = new UserData;
    userdata->functionName = __FUNCTION__;
    userdata->useRange = useRange;
    userdata->offset = offset;
    userdata->src = src;

    src.MapAsync(wgpu::MapMode::Write, offset, 4,
        [](WGPUBufferMapAsyncStatus status, void* vp_userdata) {
            assert(status == WGPUBufferMapAsyncStatus_Success);
            std::unique_ptr<UserData> userdata(reinterpret_cast<UserData*>(vp_userdata));

            uint32_t* ptr = static_cast<uint32_t*>(userdata->useRange ?
                    userdata->src.GetMappedRange(userdata->offset, 4) :
                    userdata->src.GetMappedRange());
            printf("%s: getMappedRange -> %p%s\n", userdata->functionName,
                    ptr, ptr ? "" : " <------- FAILED");
            assert(ptr != nullptr);
            *ptr = kValue;
            userdata->src.Unmap();

            wgpu::Buffer dst;
            {
                wgpu::BufferDescriptor descriptor{};
                descriptor.size = 4;
                descriptor.usage = wgpu::BufferUsage::CopyDst | wgpu::BufferUsage::MapRead;
                dst = device.CreateBuffer(&descriptor);
            }

            wgpu::CommandBuffer commands;
            {
                wgpu::CommandEncoder encoder = device.CreateCommandEncoder();
                encoder.CopyBufferToBuffer(userdata->src, userdata->offset, dst, 0, 4);
                commands = encoder.Finish();
            }
            queue.Submit(1, &commands);

            issueContentsCheck(userdata->functionName, dst, kValue);
        }, userdata);
}

void doRenderTest() {
    wgpu::Texture readbackTexture;
    {
        wgpu::TextureDescriptor descriptor{};
        descriptor.usage = wgpu::TextureUsage::RenderAttachment | wgpu::TextureUsage::CopySrc;
        descriptor.size = {1, 1, 1};
        descriptor.format = wgpu::TextureFormat::BGRA8Unorm;
        readbackTexture = device.CreateTexture(&descriptor);
    }
    wgpu::Texture depthTexture;
    {
        wgpu::TextureDescriptor descriptor{};
        descriptor.usage = wgpu::TextureUsage::RenderAttachment;
        descriptor.size = {1, 1, 1};
        descriptor.format = wgpu::TextureFormat::Depth32Float;
        depthTexture = device.CreateTexture(&descriptor);
    }
    render(readbackTexture.CreateView(), depthTexture.CreateView());

    {
        wgpu::BufferDescriptor descriptor{};
        descriptor.size = 4;
        descriptor.usage = wgpu::BufferUsage::CopyDst | wgpu::BufferUsage::MapRead;

        readbackBuffer = device.CreateBuffer(&descriptor);
    }

    wgpu::CommandBuffer commands;
    {
        wgpu::CommandEncoder encoder = device.CreateCommandEncoder();
        wgpu::ImageCopyTexture src{};
        src.texture = readbackTexture;
        src.origin = {0, 0, 0};
        wgpu::ImageCopyBuffer dst{};
        dst.buffer = readbackBuffer;
        dst.layout.bytesPerRow = 256;
        wgpu::Extent3D extent = {1, 1, 1};
        encoder.CopyTextureToBuffer(&src, &dst, &extent);
        commands = encoder.Finish();
    }
    queue.Submit(1, &commands);

    // Check the color value encoded in the shader makes it out correctly.
    static const uint32_t expectData = 0xff0080ff;
    issueContentsCheck(__FUNCTION__, readbackBuffer, expectData);
}

wgpu::SwapChain swapChain;
wgpu::TextureView canvasDepthStencilView;
const uint32_t kWidth = 300;
const uint32_t kHeight = 150;

void frame() {
    wgpu::TextureView backbuffer = swapChain.GetCurrentTextureView();
    render(backbuffer, canvasDepthStencilView);

    // TODO: Read back from the canvas with drawImage() (or something) and
    // check the result.

#ifdef __EMSCRIPTEN__
    emscripten_cancel_main_loop();

    // exit(0) (rather than emscripten_force_exit(0)) ensures there is no dangling keepalive.
    exit(0);
#endif

}

void run() {
    init();

    static constexpr int kNumTests = 5;
    doCopyTestMappedAtCreation(false);
    doCopyTestMappedAtCreation(true);
    doCopyTestMapAsync(false);
    doCopyTestMapAsync(true);
    doRenderTest();

#ifdef __EMSCRIPTEN__
    {
        wgpu::SurfaceDescriptorFromCanvasHTMLSelector canvasDesc{};
        canvasDesc.selector = "#canvas";

        wgpu::SurfaceDescriptor surfDesc{};
        surfDesc.nextInChain = &canvasDesc;
        wgpu::Instance instance{};  // null instance
        wgpu::Surface surface = instance.CreateSurface(&surfDesc);

        wgpu::SwapChainDescriptor scDesc{};
        scDesc.usage = wgpu::TextureUsage::RenderAttachment;
        scDesc.format = wgpu::TextureFormat::BGRA8Unorm;
        scDesc.width = kWidth;
        scDesc.height = kHeight;
        scDesc.presentMode = wgpu::PresentMode::Fifo;
        swapChain = device.CreateSwapChain(surface, &scDesc);

        {
            wgpu::TextureDescriptor descriptor{};
            descriptor.usage = wgpu::TextureUsage::RenderAttachment;
            descriptor.size = {kWidth, kHeight, 1};
            descriptor.format = wgpu::TextureFormat::Depth32Float;
            canvasDepthStencilView = device.CreateTexture(&descriptor).CreateView();
        }
    }
    emscripten_set_main_loop(frame, 0, false);
#else
    while (testsCompleted < kNumTests) {
        device.Tick();
    }
#endif
}

int main() {
    GetDevice([](wgpu::Device dev) {
        device = dev;
        run();
    });

#ifdef __EMSCRIPTEN__
    // The test result will be reported when the main_loop completes.
    // emscripten_exit_with_live_runtime isn't needed because the WebGPU
    // callbacks should all automatically keep the runtime alive until
    // emscripten_set_main_loop, and that should keep it alive until
    // emscripten_cancel_main_loop.
    //
    // This code is returned when the runtime exits unless something else sets it, like exit(0).
    return 99;
#else
    return 0;
#endif
}