#include "window.h"

#include <cassert>
#import <QuartzCore/CAMetalLayer.h>

wgpu::Surface window_init_surface(wgpu::Instance instance, window_t* window) {
  NSWindow* nsWindow = glfwGetCocoaWindow(window->handle);
  NSView* view = [nsWindow contentView];
  [view setWantsLayer:YES];
  [view setLayer:[CAMetalLayer layer]];

  [[view layer] setContentsScale:[nsWindow backingScaleFactor]];

  wgpu::SurfaceDescriptorFromMetalLayer sd{};
  sd.layer = [view layer];

  wgpu::SurfaceDescriptor descriptor{};
  descriptor.nextInChain = &sd;
  wgpu::Surface surface = instance.CreateSurface(&descriptor);
  assert(surface);

  window->surface.handle = surface;
  return surface;
}
