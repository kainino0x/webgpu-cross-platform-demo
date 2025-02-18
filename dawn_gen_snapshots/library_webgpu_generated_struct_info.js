{{{

const structInfo32 = (
{
    "defines": {},
    "structs": {
        "WGPUAdapterInfo": {
            "__size__": 64,
            "adapterType": 40,
            "architecture": 12,
            "backendType": 36,
            "compatibilityMode": 60,
            "description": 28,
            "device": 20,
            "deviceID": 48,
            "nextInChain": 0,
            "subgroupMaxSize": 56,
            "subgroupMinSize": 52,
            "vendor": 4,
            "vendorID": 44
        },
        "WGPUAdapterPropertiesSubgroups": {
            "__size__": 16,
            "chain": 0,
            "subgroupMaxSize": 12,
            "subgroupMinSize": 8
        },
        "WGPUBindGroupDescriptor": {
            "__size__": 24,
            "entries": 20,
            "entryCount": 16,
            "label": 4,
            "layout": 12,
            "nextInChain": 0
        },
        "WGPUBindGroupEntry": {
            "__size__": 40,
            "binding": 4,
            "buffer": 8,
            "nextInChain": 0,
            "offset": 16,
            "sampler": 32,
            "size": 24,
            "textureView": 36
        },
        "WGPUBindGroupLayoutDescriptor": {
            "__size__": 20,
            "entries": 16,
            "entryCount": 12,
            "label": 4,
            "nextInChain": 0
        },
        "WGPUBindGroupLayoutEntry": {
            "__size__": 80,
            "binding": 4,
            "buffer": 16,
            "nextInChain": 0,
            "sampler": 40,
            "storageTexture": 64,
            "texture": 48,
            "visibility": 8
        },
        "WGPUBlendComponent": {
            "__size__": 12,
            "dstFactor": 8,
            "operation": 0,
            "srcFactor": 4
        },
        "WGPUBlendState": {
            "__size__": 24,
            "alpha": 12,
            "color": 0
        },
        "WGPUBufferBindingLayout": {
            "__size__": 24,
            "hasDynamicOffset": 8,
            "minBindingSize": 16,
            "nextInChain": 0,
            "type": 4
        },
        "WGPUBufferDescriptor": {
            "__size__": 40,
            "label": 4,
            "mappedAtCreation": 32,
            "nextInChain": 0,
            "size": 24,
            "usage": 16
        },
        "WGPUChainedStruct": {
            "__size__": 8,
            "next": 0,
            "sType": 4
        },
        "WGPUColor": {
            "__size__": 32,
            "a": 24,
            "b": 16,
            "g": 8,
            "r": 0
        },
        "WGPUColorTargetState": {
            "__size__": 24,
            "blend": 8,
            "format": 4,
            "nextInChain": 0,
            "writeMask": 16
        },
        "WGPUCommandBufferDescriptor": {
            "__size__": 12,
            "label": 4,
            "nextInChain": 0
        },
        "WGPUCommandEncoderDescriptor": {
            "__size__": 12,
            "label": 4,
            "nextInChain": 0
        },
        "WGPUCompilationInfo": {
            "__size__": 12,
            "messageCount": 4,
            "messages": 8,
            "nextInChain": 0
        },
        "WGPUCompilationMessage": {
            "__size__": 72,
            "length": 40,
            "lineNum": 16,
            "linePos": 24,
            "message": 4,
            "nextInChain": 0,
            "offset": 32,
            "type": 12,
            "utf16Length": 64,
            "utf16LinePos": 48,
            "utf16Offset": 56
        },
        "WGPUComputePassDescriptor": {
            "__size__": 16,
            "label": 4,
            "nextInChain": 0,
            "timestampWrites": 12
        },
        "WGPUComputePipelineDescriptor": {
            "__size__": 40,
            "compute": 16,
            "label": 4,
            "layout": 12,
            "nextInChain": 0
        },
        "WGPUComputeState": {
            "__size__": 24,
            "constantCount": 16,
            "constants": 20,
            "entryPoint": 8,
            "module": 4,
            "nextInChain": 0
        },
        "WGPUConstantEntry": {
            "__size__": 24,
            "key": 4,
            "nextInChain": 0,
            "value": 16
        },
        "WGPUDepthStencilState": {
            "__size__": 68,
            "depthBias": 56,
            "depthBiasClamp": 64,
            "depthBiasSlopeScale": 60,
            "depthCompare": 12,
            "depthWriteEnabled": 8,
            "format": 4,
            "nextInChain": 0,
            "stencilBack": 32,
            "stencilFront": 16,
            "stencilReadMask": 48,
            "stencilWriteMask": 52
        },
        "WGPUDeviceDescriptor": {
            "__size__": 72,
            "defaultQueue": 24,
            "deviceLostCallbackInfo": 36,
            "label": 4,
            "nextInChain": 0,
            "requiredFeatureCount": 12,
            "requiredFeatures": 16,
            "requiredLimits": 20,
            "uncapturedErrorCallbackInfo": 56
        },
        "WGPUEmscriptenSurfaceSourceCanvasHTMLSelector": {
            "__size__": 16,
            "chain": 0,
            "selector": 8
        },
        "WGPUExtent3D": {
            "__size__": 12,
            "depthOrArrayLayers": 8,
            "height": 4,
            "width": 0
        },
        "WGPUFragmentState": {
            "__size__": 32,
            "constantCount": 16,
            "constants": 20,
            "entryPoint": 8,
            "module": 4,
            "nextInChain": 0,
            "targetCount": 24,
            "targets": 28
        },
        "WGPUFuture": {
            "__size__": 8,
            "id": 0
        },
        "WGPUFutureWaitInfo": {
            "__size__": 16,
            "completed": 8,
            "future": 0
        },
        "WGPUINTERNAL_HAVE_EMDAWNWEBGPU_HEADER": {
            "__size__": 4,
            "unused": 0
        },
        "WGPUInstanceCapabilities": {
            "__size__": 12,
            "nextInChain": 0,
            "timedWaitAnyEnable": 4,
            "timedWaitAnyMaxCount": 8
        },
        "WGPUInstanceDescriptor": {
            "__size__": 16,
            "capabilities": 4,
            "nextInChain": 0
        },
        "WGPULimits": {
            "__size__": 160,
            "maxBindGroups": 16,
            "maxBindGroupsPlusVertexBuffers": 20,
            "maxBindingsPerBindGroup": 24,
            "maxBufferSize": 88,
            "maxColorAttachmentBytesPerSample": 116,
            "maxColorAttachments": 112,
            "maxComputeInvocationsPerWorkgroup": 124,
            "maxComputeWorkgroupSizeX": 128,
            "maxComputeWorkgroupSizeY": 132,
            "maxComputeWorkgroupSizeZ": 136,
            "maxComputeWorkgroupStorageSize": 120,
            "maxComputeWorkgroupsPerDimension": 140,
            "maxDynamicStorageBuffersPerPipelineLayout": 32,
            "maxDynamicUniformBuffersPerPipelineLayout": 28,
            "maxInterStageShaderComponents": 104,
            "maxInterStageShaderVariables": 108,
            "maxSampledTexturesPerShaderStage": 36,
            "maxSamplersPerShaderStage": 40,
            "maxStorageBufferBindingSize": 64,
            "maxStorageBuffersInFragmentStage": 152,
            "maxStorageBuffersInVertexStage": 144,
            "maxStorageBuffersPerShaderStage": 44,
            "maxStorageTexturesInFragmentStage": 156,
            "maxStorageTexturesInVertexStage": 148,
            "maxStorageTexturesPerShaderStage": 48,
            "maxTextureArrayLayers": 12,
            "maxTextureDimension1D": 0,
            "maxTextureDimension2D": 4,
            "maxTextureDimension3D": 8,
            "maxUniformBufferBindingSize": 56,
            "maxUniformBuffersPerShaderStage": 52,
            "maxVertexAttributes": 96,
            "maxVertexBufferArrayStride": 100,
            "maxVertexBuffers": 80,
            "minStorageBufferOffsetAlignment": 76,
            "minUniformBufferOffsetAlignment": 72
        },
        "WGPUMultisampleState": {
            "__size__": 16,
            "alphaToCoverageEnabled": 12,
            "count": 4,
            "mask": 8,
            "nextInChain": 0
        },
        "WGPUOrigin3D": {
            "__size__": 12,
            "x": 0,
            "y": 4,
            "z": 8
        },
        "WGPUPassTimestampWrites": {
            "__size__": 16,
            "beginningOfPassWriteIndex": 8,
            "endOfPassWriteIndex": 12,
            "nextInChain": 0,
            "querySet": 4
        },
        "WGPUPipelineLayoutDescriptor": {
            "__size__": 24,
            "bindGroupLayoutCount": 12,
            "bindGroupLayouts": 16,
            "immediateDataRangeByteSize": 20,
            "label": 4,
            "nextInChain": 0
        },
        "WGPUPrimitiveState": {
            "__size__": 24,
            "cullMode": 16,
            "frontFace": 12,
            "nextInChain": 0,
            "stripIndexFormat": 8,
            "topology": 4,
            "unclippedDepth": 20
        },
        "WGPUQuerySetDescriptor": {
            "__size__": 20,
            "count": 16,
            "label": 4,
            "nextInChain": 0,
            "type": 12
        },
        "WGPUQueueDescriptor": {
            "__size__": 12,
            "label": 4,
            "nextInChain": 0
        },
        "WGPURenderBundleDescriptor": {
            "__size__": 12,
            "label": 4,
            "nextInChain": 0
        },
        "WGPURenderBundleEncoderDescriptor": {
            "__size__": 36,
            "colorFormatCount": 12,
            "colorFormats": 16,
            "depthReadOnly": 28,
            "depthStencilFormat": 20,
            "label": 4,
            "nextInChain": 0,
            "sampleCount": 24,
            "stencilReadOnly": 32
        },
        "WGPURenderPassColorAttachment": {
            "__size__": 56,
            "clearValue": 24,
            "depthSlice": 8,
            "loadOp": 16,
            "nextInChain": 0,
            "resolveTarget": 12,
            "storeOp": 20,
            "view": 4
        },
        "WGPURenderPassDepthStencilAttachment": {
            "__size__": 40,
            "depthClearValue": 16,
            "depthLoadOp": 8,
            "depthReadOnly": 20,
            "depthStoreOp": 12,
            "nextInChain": 0,
            "stencilClearValue": 32,
            "stencilLoadOp": 24,
            "stencilReadOnly": 36,
            "stencilStoreOp": 28,
            "view": 4
        },
        "WGPURenderPassDescriptor": {
            "__size__": 32,
            "colorAttachmentCount": 12,
            "colorAttachments": 16,
            "depthStencilAttachment": 20,
            "label": 4,
            "nextInChain": 0,
            "occlusionQuerySet": 24,
            "timestampWrites": 28
        },
        "WGPURenderPassMaxDrawCount": {
            "__size__": 16,
            "chain": 0,
            "maxDrawCount": 8
        },
        "WGPURenderPipelineDescriptor": {
            "__size__": 96,
            "depthStencil": 72,
            "fragment": 92,
            "label": 4,
            "layout": 12,
            "multisample": 76,
            "nextInChain": 0,
            "primitive": 48,
            "vertex": 16
        },
        "WGPURequestAdapterOptions": {
            "__size__": 24,
            "backendType": 16,
            "compatibleSurface": 4,
            "featureLevel": 8,
            "forceFallbackAdapter": 20,
            "nextInChain": 0,
            "powerPreference": 12
        },
        "WGPURequiredLimits": {
            "__size__": 168,
            "limits": 8,
            "nextInChain": 0
        },
        "WGPUSamplerBindingLayout": {
            "__size__": 8,
            "nextInChain": 0,
            "type": 4
        },
        "WGPUSamplerDescriptor": {
            "__size__": 52,
            "addressModeU": 12,
            "addressModeV": 16,
            "addressModeW": 20,
            "compare": 44,
            "label": 4,
            "lodMaxClamp": 40,
            "lodMinClamp": 36,
            "magFilter": 24,
            "maxAnisotropy": 48,
            "minFilter": 28,
            "mipmapFilter": 32,
            "nextInChain": 0
        },
        "WGPUShaderModuleDescriptor": {
            "__size__": 12,
            "label": 4,
            "nextInChain": 0
        },
        "WGPUShaderSourceSPIRV": {
            "__size__": 16,
            "chain": 0,
            "code": 12,
            "codeSize": 8
        },
        "WGPUShaderSourceWGSL": {
            "__size__": 16,
            "chain": 0,
            "code": 8
        },
        "WGPUStencilFaceState": {
            "__size__": 16,
            "compare": 0,
            "depthFailOp": 8,
            "failOp": 4,
            "passOp": 12
        },
        "WGPUStorageTextureBindingLayout": {
            "__size__": 16,
            "access": 4,
            "format": 8,
            "nextInChain": 0,
            "viewDimension": 12
        },
        "WGPUStringView": {
            "__size__": 8,
            "data": 0,
            "length": 4
        },
        "WGPUSupportedFeatures": {
            "__size__": 8,
            "featureCount": 0,
            "features": 4
        },
        "WGPUSupportedLimits": {
            "__size__": 168,
            "limits": 8,
            "nextInChain": 0
        },
        "WGPUSupportedWGSLLanguageFeatures": {
            "__size__": 8,
            "featureCount": 0,
            "features": 4
        },
        "WGPUSurfaceCapabilities": {
            "__size__": 40,
            "alphaModeCount": 32,
            "alphaModes": 36,
            "formatCount": 16,
            "formats": 20,
            "nextInChain": 0,
            "presentModeCount": 24,
            "presentModes": 28,
            "usages": 8
        },
        "WGPUSurfaceConfiguration": {
            "__size__": 48,
            "alphaMode": 32,
            "device": 4,
            "format": 8,
            "height": 40,
            "nextInChain": 0,
            "presentMode": 44,
            "usage": 16,
            "viewFormatCount": 24,
            "viewFormats": 28,
            "width": 36
        },
        "WGPUSurfaceDescriptor": {
            "__size__": 12,
            "label": 4,
            "nextInChain": 0
        },
        "WGPUSurfaceTexture": {
            "__size__": 12,
            "status": 8,
            "suboptimal": 4,
            "texture": 0
        },
        "WGPUTexelCopyBufferInfo": {
            "__size__": 24,
            "buffer": 16,
            "layout": 0
        },
        "WGPUTexelCopyBufferLayout": {
            "__size__": 16,
            "bytesPerRow": 8,
            "offset": 0,
            "rowsPerImage": 12
        },
        "WGPUTexelCopyTextureInfo": {
            "__size__": 24,
            "aspect": 20,
            "mipLevel": 4,
            "origin": 8,
            "texture": 0
        },
        "WGPUTextureBindingLayout": {
            "__size__": 16,
            "multisampled": 12,
            "nextInChain": 0,
            "sampleType": 4,
            "viewDimension": 8
        },
        "WGPUTextureBindingViewDimensionDescriptor": {
            "__size__": 12,
            "chain": 0,
            "textureBindingViewDimension": 8
        },
        "WGPUTextureDescriptor": {
            "__size__": 64,
            "dimension": 24,
            "format": 40,
            "label": 4,
            "mipLevelCount": 44,
            "nextInChain": 0,
            "sampleCount": 48,
            "size": 28,
            "usage": 16,
            "viewFormatCount": 52,
            "viewFormats": 56
        },
        "WGPUTextureViewDescriptor": {
            "__size__": 48,
            "arrayLayerCount": 32,
            "aspect": 36,
            "baseArrayLayer": 28,
            "baseMipLevel": 20,
            "dimension": 16,
            "format": 12,
            "label": 4,
            "mipLevelCount": 24,
            "nextInChain": 0,
            "usage": 40
        },
        "WGPUVertexAttribute": {
            "__size__": 24,
            "format": 4,
            "nextInChain": 0,
            "offset": 8,
            "shaderLocation": 16
        },
        "WGPUVertexBufferLayout": {
            "__size__": 32,
            "arrayStride": 8,
            "attributeCount": 20,
            "attributes": 24,
            "nextInChain": 0,
            "stepMode": 16
        },
        "WGPUVertexState": {
            "__size__": 32,
            "bufferCount": 24,
            "buffers": 28,
            "constantCount": 16,
            "constants": 20,
            "entryPoint": 8,
            "module": 4,
            "nextInChain": 0
        }
    }
}
);

const structInfo64 = (
{
    "defines": {},
    "structs": {
        "WGPUAdapterInfo": {
            "__size__": 104,
            "adapterType": 76,
            "architecture": 24,
            "backendType": 72,
            "compatibilityMode": 96,
            "description": 56,
            "device": 40,
            "deviceID": 84,
            "nextInChain": 0,
            "subgroupMaxSize": 92,
            "subgroupMinSize": 88,
            "vendor": 8,
            "vendorID": 80
        },
        "WGPUAdapterPropertiesSubgroups": {
            "__size__": 24,
            "chain": 0,
            "subgroupMaxSize": 20,
            "subgroupMinSize": 16
        },
        "WGPUBindGroupDescriptor": {
            "__size__": 48,
            "entries": 40,
            "entryCount": 32,
            "label": 8,
            "layout": 24,
            "nextInChain": 0
        },
        "WGPUBindGroupEntry": {
            "__size__": 56,
            "binding": 8,
            "buffer": 16,
            "nextInChain": 0,
            "offset": 24,
            "sampler": 40,
            "size": 32,
            "textureView": 48
        },
        "WGPUBindGroupLayoutDescriptor": {
            "__size__": 40,
            "entries": 32,
            "entryCount": 24,
            "label": 8,
            "nextInChain": 0
        },
        "WGPUBindGroupLayoutEntry": {
            "__size__": 112,
            "binding": 8,
            "buffer": 24,
            "nextInChain": 0,
            "sampler": 48,
            "storageTexture": 88,
            "texture": 64,
            "visibility": 16
        },
        "WGPUBlendComponent": {
            "__size__": 12,
            "dstFactor": 8,
            "operation": 0,
            "srcFactor": 4
        },
        "WGPUBlendState": {
            "__size__": 24,
            "alpha": 12,
            "color": 0
        },
        "WGPUBufferBindingLayout": {
            "__size__": 24,
            "hasDynamicOffset": 12,
            "minBindingSize": 16,
            "nextInChain": 0,
            "type": 8
        },
        "WGPUBufferDescriptor": {
            "__size__": 48,
            "label": 8,
            "mappedAtCreation": 40,
            "nextInChain": 0,
            "size": 32,
            "usage": 24
        },
        "WGPUChainedStruct": {
            "__size__": 16,
            "next": 0,
            "sType": 8
        },
        "WGPUColor": {
            "__size__": 32,
            "a": 24,
            "b": 16,
            "g": 8,
            "r": 0
        },
        "WGPUColorTargetState": {
            "__size__": 32,
            "blend": 16,
            "format": 8,
            "nextInChain": 0,
            "writeMask": 24
        },
        "WGPUCommandBufferDescriptor": {
            "__size__": 24,
            "label": 8,
            "nextInChain": 0
        },
        "WGPUCommandEncoderDescriptor": {
            "__size__": 24,
            "label": 8,
            "nextInChain": 0
        },
        "WGPUCompilationInfo": {
            "__size__": 24,
            "messageCount": 8,
            "messages": 16,
            "nextInChain": 0
        },
        "WGPUCompilationMessage": {
            "__size__": 88,
            "length": 56,
            "lineNum": 32,
            "linePos": 40,
            "message": 8,
            "nextInChain": 0,
            "offset": 48,
            "type": 24,
            "utf16Length": 80,
            "utf16LinePos": 64,
            "utf16Offset": 72
        },
        "WGPUComputePassDescriptor": {
            "__size__": 32,
            "label": 8,
            "nextInChain": 0,
            "timestampWrites": 24
        },
        "WGPUComputePipelineDescriptor": {
            "__size__": 80,
            "compute": 32,
            "label": 8,
            "layout": 24,
            "nextInChain": 0
        },
        "WGPUComputeState": {
            "__size__": 48,
            "constantCount": 32,
            "constants": 40,
            "entryPoint": 16,
            "module": 8,
            "nextInChain": 0
        },
        "WGPUConstantEntry": {
            "__size__": 32,
            "key": 8,
            "nextInChain": 0,
            "value": 24
        },
        "WGPUDepthStencilState": {
            "__size__": 72,
            "depthBias": 60,
            "depthBiasClamp": 68,
            "depthBiasSlopeScale": 64,
            "depthCompare": 16,
            "depthWriteEnabled": 12,
            "format": 8,
            "nextInChain": 0,
            "stencilBack": 36,
            "stencilFront": 20,
            "stencilReadMask": 52,
            "stencilWriteMask": 56
        },
        "WGPUDeviceDescriptor": {
            "__size__": 144,
            "defaultQueue": 48,
            "deviceLostCallbackInfo": 72,
            "label": 8,
            "nextInChain": 0,
            "requiredFeatureCount": 24,
            "requiredFeatures": 32,
            "requiredLimits": 40,
            "uncapturedErrorCallbackInfo": 112
        },
        "WGPUEmscriptenSurfaceSourceCanvasHTMLSelector": {
            "__size__": 32,
            "chain": 0,
            "selector": 16
        },
        "WGPUExtent3D": {
            "__size__": 12,
            "depthOrArrayLayers": 8,
            "height": 4,
            "width": 0
        },
        "WGPUFragmentState": {
            "__size__": 64,
            "constantCount": 32,
            "constants": 40,
            "entryPoint": 16,
            "module": 8,
            "nextInChain": 0,
            "targetCount": 48,
            "targets": 56
        },
        "WGPUFuture": {
            "__size__": 8,
            "id": 0
        },
        "WGPUFutureWaitInfo": {
            "__size__": 16,
            "completed": 8,
            "future": 0
        },
        "WGPUINTERNAL_HAVE_EMDAWNWEBGPU_HEADER": {
            "__size__": 4,
            "unused": 0
        },
        "WGPUInstanceCapabilities": {
            "__size__": 24,
            "nextInChain": 0,
            "timedWaitAnyEnable": 8,
            "timedWaitAnyMaxCount": 16
        },
        "WGPUInstanceDescriptor": {
            "__size__": 32,
            "capabilities": 8,
            "nextInChain": 0
        },
        "WGPULimits": {
            "__size__": 160,
            "maxBindGroups": 16,
            "maxBindGroupsPlusVertexBuffers": 20,
            "maxBindingsPerBindGroup": 24,
            "maxBufferSize": 88,
            "maxColorAttachmentBytesPerSample": 116,
            "maxColorAttachments": 112,
            "maxComputeInvocationsPerWorkgroup": 124,
            "maxComputeWorkgroupSizeX": 128,
            "maxComputeWorkgroupSizeY": 132,
            "maxComputeWorkgroupSizeZ": 136,
            "maxComputeWorkgroupStorageSize": 120,
            "maxComputeWorkgroupsPerDimension": 140,
            "maxDynamicStorageBuffersPerPipelineLayout": 32,
            "maxDynamicUniformBuffersPerPipelineLayout": 28,
            "maxInterStageShaderComponents": 104,
            "maxInterStageShaderVariables": 108,
            "maxSampledTexturesPerShaderStage": 36,
            "maxSamplersPerShaderStage": 40,
            "maxStorageBufferBindingSize": 64,
            "maxStorageBuffersInFragmentStage": 152,
            "maxStorageBuffersInVertexStage": 144,
            "maxStorageBuffersPerShaderStage": 44,
            "maxStorageTexturesInFragmentStage": 156,
            "maxStorageTexturesInVertexStage": 148,
            "maxStorageTexturesPerShaderStage": 48,
            "maxTextureArrayLayers": 12,
            "maxTextureDimension1D": 0,
            "maxTextureDimension2D": 4,
            "maxTextureDimension3D": 8,
            "maxUniformBufferBindingSize": 56,
            "maxUniformBuffersPerShaderStage": 52,
            "maxVertexAttributes": 96,
            "maxVertexBufferArrayStride": 100,
            "maxVertexBuffers": 80,
            "minStorageBufferOffsetAlignment": 76,
            "minUniformBufferOffsetAlignment": 72
        },
        "WGPUMultisampleState": {
            "__size__": 24,
            "alphaToCoverageEnabled": 16,
            "count": 8,
            "mask": 12,
            "nextInChain": 0
        },
        "WGPUOrigin3D": {
            "__size__": 12,
            "x": 0,
            "y": 4,
            "z": 8
        },
        "WGPUPassTimestampWrites": {
            "__size__": 24,
            "beginningOfPassWriteIndex": 16,
            "endOfPassWriteIndex": 20,
            "nextInChain": 0,
            "querySet": 8
        },
        "WGPUPipelineLayoutDescriptor": {
            "__size__": 48,
            "bindGroupLayoutCount": 24,
            "bindGroupLayouts": 32,
            "immediateDataRangeByteSize": 40,
            "label": 8,
            "nextInChain": 0
        },
        "WGPUPrimitiveState": {
            "__size__": 32,
            "cullMode": 20,
            "frontFace": 16,
            "nextInChain": 0,
            "stripIndexFormat": 12,
            "topology": 8,
            "unclippedDepth": 24
        },
        "WGPUQuerySetDescriptor": {
            "__size__": 32,
            "count": 28,
            "label": 8,
            "nextInChain": 0,
            "type": 24
        },
        "WGPUQueueDescriptor": {
            "__size__": 24,
            "label": 8,
            "nextInChain": 0
        },
        "WGPURenderBundleDescriptor": {
            "__size__": 24,
            "label": 8,
            "nextInChain": 0
        },
        "WGPURenderBundleEncoderDescriptor": {
            "__size__": 56,
            "colorFormatCount": 24,
            "colorFormats": 32,
            "depthReadOnly": 48,
            "depthStencilFormat": 40,
            "label": 8,
            "nextInChain": 0,
            "sampleCount": 44,
            "stencilReadOnly": 52
        },
        "WGPURenderPassColorAttachment": {
            "__size__": 72,
            "clearValue": 40,
            "depthSlice": 16,
            "loadOp": 32,
            "nextInChain": 0,
            "resolveTarget": 24,
            "storeOp": 36,
            "view": 8
        },
        "WGPURenderPassDepthStencilAttachment": {
            "__size__": 48,
            "depthClearValue": 24,
            "depthLoadOp": 16,
            "depthReadOnly": 28,
            "depthStoreOp": 20,
            "nextInChain": 0,
            "stencilClearValue": 40,
            "stencilLoadOp": 32,
            "stencilReadOnly": 44,
            "stencilStoreOp": 36,
            "view": 8
        },
        "WGPURenderPassDescriptor": {
            "__size__": 64,
            "colorAttachmentCount": 24,
            "colorAttachments": 32,
            "depthStencilAttachment": 40,
            "label": 8,
            "nextInChain": 0,
            "occlusionQuerySet": 48,
            "timestampWrites": 56
        },
        "WGPURenderPassMaxDrawCount": {
            "__size__": 24,
            "chain": 0,
            "maxDrawCount": 16
        },
        "WGPURenderPipelineDescriptor": {
            "__size__": 168,
            "depthStencil": 128,
            "fragment": 160,
            "label": 8,
            "layout": 24,
            "multisample": 136,
            "nextInChain": 0,
            "primitive": 96,
            "vertex": 32
        },
        "WGPURequestAdapterOptions": {
            "__size__": 32,
            "backendType": 24,
            "compatibleSurface": 8,
            "featureLevel": 16,
            "forceFallbackAdapter": 28,
            "nextInChain": 0,
            "powerPreference": 20
        },
        "WGPURequiredLimits": {
            "__size__": 168,
            "limits": 8,
            "nextInChain": 0
        },
        "WGPUSamplerBindingLayout": {
            "__size__": 16,
            "nextInChain": 0,
            "type": 8
        },
        "WGPUSamplerDescriptor": {
            "__size__": 64,
            "addressModeU": 24,
            "addressModeV": 28,
            "addressModeW": 32,
            "compare": 56,
            "label": 8,
            "lodMaxClamp": 52,
            "lodMinClamp": 48,
            "magFilter": 36,
            "maxAnisotropy": 60,
            "minFilter": 40,
            "mipmapFilter": 44,
            "nextInChain": 0
        },
        "WGPUShaderModuleDescriptor": {
            "__size__": 24,
            "label": 8,
            "nextInChain": 0
        },
        "WGPUShaderSourceSPIRV": {
            "__size__": 32,
            "chain": 0,
            "code": 24,
            "codeSize": 16
        },
        "WGPUShaderSourceWGSL": {
            "__size__": 32,
            "chain": 0,
            "code": 16
        },
        "WGPUStencilFaceState": {
            "__size__": 16,
            "compare": 0,
            "depthFailOp": 8,
            "failOp": 4,
            "passOp": 12
        },
        "WGPUStorageTextureBindingLayout": {
            "__size__": 24,
            "access": 8,
            "format": 12,
            "nextInChain": 0,
            "viewDimension": 16
        },
        "WGPUStringView": {
            "__size__": 16,
            "data": 0,
            "length": 8
        },
        "WGPUSupportedFeatures": {
            "__size__": 16,
            "featureCount": 0,
            "features": 8
        },
        "WGPUSupportedLimits": {
            "__size__": 168,
            "limits": 8,
            "nextInChain": 0
        },
        "WGPUSupportedWGSLLanguageFeatures": {
            "__size__": 16,
            "featureCount": 0,
            "features": 8
        },
        "WGPUSurfaceCapabilities": {
            "__size__": 64,
            "alphaModeCount": 48,
            "alphaModes": 56,
            "formatCount": 16,
            "formats": 24,
            "nextInChain": 0,
            "presentModeCount": 32,
            "presentModes": 40,
            "usages": 8
        },
        "WGPUSurfaceConfiguration": {
            "__size__": 64,
            "alphaMode": 48,
            "device": 8,
            "format": 16,
            "height": 56,
            "nextInChain": 0,
            "presentMode": 60,
            "usage": 24,
            "viewFormatCount": 32,
            "viewFormats": 40,
            "width": 52
        },
        "WGPUSurfaceDescriptor": {
            "__size__": 24,
            "label": 8,
            "nextInChain": 0
        },
        "WGPUSurfaceTexture": {
            "__size__": 16,
            "status": 12,
            "suboptimal": 8,
            "texture": 0
        },
        "WGPUTexelCopyBufferInfo": {
            "__size__": 24,
            "buffer": 16,
            "layout": 0
        },
        "WGPUTexelCopyBufferLayout": {
            "__size__": 16,
            "bytesPerRow": 8,
            "offset": 0,
            "rowsPerImage": 12
        },
        "WGPUTexelCopyTextureInfo": {
            "__size__": 32,
            "aspect": 24,
            "mipLevel": 8,
            "origin": 12,
            "texture": 0
        },
        "WGPUTextureBindingLayout": {
            "__size__": 24,
            "multisampled": 16,
            "nextInChain": 0,
            "sampleType": 8,
            "viewDimension": 12
        },
        "WGPUTextureBindingViewDimensionDescriptor": {
            "__size__": 24,
            "chain": 0,
            "textureBindingViewDimension": 16
        },
        "WGPUTextureDescriptor": {
            "__size__": 80,
            "dimension": 32,
            "format": 48,
            "label": 8,
            "mipLevelCount": 52,
            "nextInChain": 0,
            "sampleCount": 56,
            "size": 36,
            "usage": 24,
            "viewFormatCount": 64,
            "viewFormats": 72
        },
        "WGPUTextureViewDescriptor": {
            "__size__": 64,
            "arrayLayerCount": 44,
            "aspect": 48,
            "baseArrayLayer": 40,
            "baseMipLevel": 32,
            "dimension": 28,
            "format": 24,
            "label": 8,
            "mipLevelCount": 36,
            "nextInChain": 0,
            "usage": 56
        },
        "WGPUVertexAttribute": {
            "__size__": 32,
            "format": 8,
            "nextInChain": 0,
            "offset": 16,
            "shaderLocation": 24
        },
        "WGPUVertexBufferLayout": {
            "__size__": 40,
            "arrayStride": 8,
            "attributeCount": 24,
            "attributes": 32,
            "nextInChain": 0,
            "stepMode": 16
        },
        "WGPUVertexState": {
            "__size__": 64,
            "bufferCount": 48,
            "buffers": 56,
            "constantCount": 32,
            "constants": 40,
            "entryPoint": 16,
            "module": 8,
            "nextInChain": 0
        }
    }
}
);

// Double check that the struct info was generated from the right header.
// (The include directory option of gen_struct_info.py affects this.)
if (!('WGPUINTERNAL_HAVE_EMDAWNWEBGPU_HEADER' in structInfo32.structs)) {
    throw new Error('struct_info32 generation error - need webgpu.h from Dawn, got it from Emscripten');
}
if (!('WGPUINTERNAL_HAVE_EMDAWNWEBGPU_HEADER' in structInfo64.structs)) {
    throw new Error('struct_info64 generation error - need webgpu.h from Dawn, got it from Emscripten');
}

// Make sure we aren't inheriting any of the webgpu.h struct info from
// Emscripten's copy.
for (const k of Object.keys(C_STRUCTS)) {
    if (k.startsWith('WGPU')) {
        delete C_STRUCTS[k];
    }
}

const WGPU_STRUCTS = (MEMORY64 ? structInfo64 : structInfo32).structs;
for (const [k, v] of Object.entries(WGPU_STRUCTS)) {
    C_STRUCTS[k] = v;
}
globalThis.__HAVE_EMDAWNWEBGPU_STRUCT_INFO = true;

null;
}}}
