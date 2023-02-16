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

#ifdef DEMO_USE_GLFW
#include "window.h"
#endif

#endif

#undef NDEBUG

#include <algorithm>
#include <cassert>
#include <cstdio>
#include <cstdlib>
#include <memory>
#include <cstring>

static wgpu::Device device;
static wgpu::Queue queue;
static wgpu::Buffer readbackBuffer;
static wgpu::RenderPipeline pipeline;
static int testsCompleted = 0;

wgpu::SwapChain swapChain;
wgpu::TextureView canvasDepthStencilView;
const uint32_t kWidth = 300;
const uint32_t kHeight = 150;

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

#ifdef DEMO_USE_GLFW

// Native window related

static wgpu::Surface surface;
static window_t* native_window;

#define UNUSED_VAR(x) ((void)(x))
#define UNUSED_FUNCTION(x) ((void)(x))

#define GET_DEFAULT_IF_ZERO(value, default_value)                              \
  (value != NULL) ? value : default_value

static std::unique_ptr<wgpu::ChainedStruct> SurfaceDescriptor(void* display,
                                                              void* window)
{
#if defined(WIN32)
  std::unique_ptr<wgpu::SurfaceDescriptorFromWindowsHWND> desc
    = std::make_unique<wgpu::SurfaceDescriptorFromWindowsHWND>();
  desc->hwnd      = window;
  desc->hinstance = GetModuleHandle(nullptr);
  return std::move(desc);
#elif defined(__linux__) // X11
  std::unique_ptr<wgpu::SurfaceDescriptorFromXlibWindow> desc
    = std::make_unique<wgpu::SurfaceDescriptorFromXlibWindow>();
  desc->display = display;
  desc->window  = *((uint32_t*)window);
  return std::move(desc);
#elif defined(__APPLE__) // Cocoa
  // Not used
#endif

  assert(0);
  return nullptr;
}

wgpu::Surface CreateSurface(wgpu::Instance instance, void* display, void* window)
{
  std::unique_ptr<wgpu::ChainedStruct> sd = SurfaceDescriptor(display, window);
  wgpu::SurfaceDescriptor descriptor;
  descriptor.nextInChain = sd.get();
  surface = instance.CreateSurface(&descriptor);
  return surface;
}

/* Function prototypes */
static void surface_update_framebuffer_size(window_t* window) {
  if (window) {
    float yscale = 1.0;
    glfwGetFramebufferSize(window->handle, (int*)&(window->surface.width),
                           (int*)&window->surface.height);
    glfwGetWindowContentScale(window->handle, &window->surface.dpscale,
                              &yscale);
  }
}
static void glfw_window_error_callback(int error, const char* description) {
  fprintf(stderr, "GLFW Error occured, Error id: %i, Description: %s\n", error,
          description);
}
static void glfw_window_size_callback(GLFWwindow* src_window, int width,
                                      int height) {
  UNUSED_VAR(width);
  UNUSED_VAR(height);

  surface_update_framebuffer_size(
    (window_t*)glfwGetWindowUserPointer(src_window));
}

window_t* window_create(window_config_t* config)
{
  if (!config) {
    return NULL;
  }

  window_t* window = new window_t{};
  window->mouse_scroll_scale_factor = 1.0f;

  /* Initialize error handling */
  glfwSetErrorCallback(glfw_window_error_callback);

  /* Initialize the library */
  if (!glfwInit()) {
    /* Handle initialization failure */
    fprintf(stderr, "Failed to initialize GLFW\n");
    fflush(stderr);
    return window;
  }

  glfwWindowHint(GLFW_CLIENT_API, GLFW_NO_API);
  glfwWindowHint(GLFW_RESIZABLE, config->resizable ? GLFW_TRUE : GLFW_FALSE);
  glfwWindowHint(GLFW_COCOA_RETINA_FRAMEBUFFER, GLFW_FALSE);

  /* Create GLFW window */
  window->handle = glfwCreateWindow(config->width, config->height,
                                    config->title, NULL, NULL);

  /* Confirm that GLFW window was created successfully */
  if (!window->handle) {
    glfwTerminate();
    fprintf(stderr, "Failed to create window\n");
    fflush(stderr);
    return window;
  }

  surface_update_framebuffer_size(window);

  /* Set user pointer to window class */
  glfwSetWindowUserPointer(window->handle, (void*)window);

  /* -- Setup callbacks -- */
  glfwSetWindowSizeCallback(window->handle, glfw_window_size_callback);

  /* Change the state of the window to intialized */
  window->intialized = 1;

  return window;
}

void window_destroy(window_t* window)
{
  /* Cleanup window(s) */
  if (window) {
    if (window->handle) {
      glfwDestroyWindow(window->handle);
      window->handle = NULL;

      /* Terminate GLFW */
      glfwTerminate();
    }

    /* Free allocated memory */
    free(window);
    window = NULL;
  }
}

int window_should_close(window_t* window)
{
  return glfwWindowShouldClose(window->handle);
}

void window_set_title(window_t* window, const char* title)
{
  glfwSetWindowTitle(window->handle, title);
}

void window_set_userdata(window_t* window, void* userdata)
{
  window->userdata = userdata;
}

void* window_get_userdata(window_t* window)
{
  return window->userdata;
}

#if defined(WIN32)
wgpu::Surface window_init_surface(wgpu::Instance instance, window_t* window) {
  uint32_t windowHandle  = glfwGetWin32Window(window->handle);
  return window->surface.handle = CreateSurface(instance, nullptr, &windowHandle);
}
#elif defined(__linux__) /* X11 */
wgpu::Surface window_init_surface(wgpu::Instance instance, window_t* window) {
  void* display          = glfwGetX11Display();
  uint32_t windowHandle  = glfwGetX11Window(window->handle);
  return window->surface.handle = CreateSurface(instance, display, &windowHandle);
}
#elif defined(__APPLE__) /* Cocoa */
// Defined in window_macos.m
#endif

void window_get_size(window_t* window, uint32_t* width, uint32_t* height)
{
  *width  = window->surface.width;
  *height = window->surface.height;
}

void window_get_aspect_ratio(window_t* window, float* aspect_ratio)
{
  *aspect_ratio = (float)window->surface.width / (float)window->surface.height;
}

static void setup_window()
{
  char window_title[] = "WebGPU Native Window";
    window_config_t config = {
      .title     = static_cast<const char*>(window_title),
      .width     = kWidth,
      .height    = kHeight,
      .resizable = false,
    };
    native_window = window_create(&config);
}

void wgpu_setup_swap_chain()
{
    wgpu::SwapChainDescriptor scDesc{};
    scDesc.usage = wgpu::TextureUsage::RenderAttachment;
    scDesc.format = wgpu::TextureFormat::BGRA8Unorm;
    scDesc.width = kWidth;
    scDesc.height = kHeight;
    scDesc.presentMode = wgpu::PresentMode::Fifo;
    swapChain = device.CreateSwapChain(surface, &scDesc);
}

#endif // DEMO_USE_GLFW

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
    case wgpu::BackendType::OpenGL:
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
    @vertex
    fn main_v(@builtin(vertex_index) idx: u32) -> @builtin(position) vec4<f32> {
        var pos = array<vec2<f32>, 3>(
            vec2<f32>(0.0, 0.5), vec2<f32>(-0.5, -0.5), vec2<f32>(0.5, -0.5));
        return vec4<f32>(pos[idx], 0.0, 1.0);
    }
    @fragment
    fn main_f() -> @location(0) vec4<f32> {
        return vec4<f32>(0.0, 0.502, 1.0, 1.0); // 0x80/0xff ~= 0.502
    }
)";

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

void frame() {
    wgpu::TextureView backbuffer = swapChain.GetCurrentTextureView();
    render(backbuffer, canvasDepthStencilView);

    // TODO: Read back from the canvas with drawImage() (or something) and
    // check the result.

#if defined(__EMSCRIPTEN__)
    emscripten_cancel_main_loop();

    // exit(0) (rather than emscripten_force_exit(0)) ensures there is no dangling keepalive.
    exit(0);
#elif defined(DEMO_USE_GLFW)
    // Submit frame
    swapChain.Present();
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

    {
      wgpu::TextureDescriptor descriptor{};
      descriptor.usage = wgpu::TextureUsage::RenderAttachment;
      descriptor.size = {kWidth, kHeight, 1};
      descriptor.format = wgpu::TextureFormat::Depth32Float;
      canvasDepthStencilView = device.CreateTexture(&descriptor).CreateView();
    }

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
    }
    emscripten_set_main_loop(frame, 0, false);
#elif defined(DEMO_USE_GLFW)
    setup_window();
    surface = window_init_surface(instance->Get(), native_window);
    wgpu_setup_swap_chain();
    while (!window_should_close(native_window)) {
      glfwPollEvents();
      frame();
    }
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
