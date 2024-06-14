var Module = typeof Module != "undefined" ? Module : {};

var ENVIRONMENT_IS_WEB = typeof window == "object";

var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";

var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";

var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (Module["ENVIRONMENT"]) {
  throw new Error("Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)");
}

if (ENVIRONMENT_IS_NODE) {}

var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];

var thisProgram = "./this.program";

var quit_ = (status, toThrow) => {
  throw toThrow;
};

var scriptDirectory = "";

function locateFile(path) {
  if (Module["locateFile"]) {
    return Module["locateFile"](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

var read_, readAsync, readBinary;

if (ENVIRONMENT_IS_NODE) {
  if (typeof process == "undefined" || !process.release || process.release.name !== "node") throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
  var nodeVersion = process.versions.node;
  var numericVersion = nodeVersion.split(".").slice(0, 3);
  numericVersion = (numericVersion[0] * 1e4) + (numericVersion[1] * 100) + (numericVersion[2].split("-")[0] * 1);
  var minVersion = 16e4;
  if (numericVersion < 16e4) {
    throw new Error("This emscripten-generated code requires node v16.0.0 (detected v" + nodeVersion + ")");
  }
  var fs = require("fs");
  var nodePath = require("path");
  scriptDirectory = __dirname + "/";
  read_ = (filename, binary) => {
    filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
    return fs.readFileSync(filename, binary ? undefined : "utf8");
  };
  readBinary = filename => {
    var ret = read_(filename, true);
    if (!ret.buffer) {
      ret = new Uint8Array(ret);
    }
    assert(ret.buffer);
    return ret;
  };
  readAsync = (filename, onload, onerror, binary = true) => {
    filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
    fs.readFile(filename, binary ? undefined : "utf8", (err, data) => {
      if (err) onerror(err); else onload(binary ? data.buffer : data);
    });
  };
  if (!Module["thisProgram"] && process.argv.length > 1) {
    thisProgram = process.argv[1].replace(/\\/g, "/");
  }
  arguments_ = process.argv.slice(2);
  if (typeof module != "undefined") {
    module["exports"] = Module;
  }
  process.on("uncaughtException", ex => {
    if (ex !== "unwind" && !(ex instanceof ExitStatus) && !(ex.context instanceof ExitStatus)) {
      throw ex;
    }
  });
  quit_ = (status, toThrow) => {
    process.exitCode = status;
    throw toThrow;
  };
} else if (ENVIRONMENT_IS_SHELL) {
  if ((typeof process == "object" && typeof require === "function") || typeof window == "object" || typeof importScripts == "function") throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
} else  if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) {
    scriptDirectory = self.location.href;
  } else if (typeof document != "undefined" && document.currentScript) {
    scriptDirectory = document.currentScript.src;
  }
  if (scriptDirectory.startsWith("blob:")) {
    scriptDirectory = "";
  } else {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
  }
  if (!(typeof window == "object" || typeof importScripts == "function")) throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
  {
    read_ = url => {
      var xhr = new XMLHttpRequest;
      xhr.open("GET", url, false);
      xhr.send(null);
      return xhr.responseText;
    };
    if (ENVIRONMENT_IS_WORKER) {
      readBinary = url => {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, false);
        xhr.responseType = "arraybuffer";
        xhr.send(null);
        return new Uint8Array(/** @type{!ArrayBuffer} */ (xhr.response));
      };
    }
    readAsync = (url, onload, onerror) => {
      if (isFileURI(url)) {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = () => {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
            onload(xhr.response);
            return;
          }
          onerror();
        };
        xhr.onerror = onerror;
        xhr.send(null);
        return;
      }
      fetch(url, {
        credentials: "same-origin"
      }).then(response => {
        if (response.ok) {
          return response.arrayBuffer();
        }
        return Promise.reject(new Error(response.status + " : " + response.url));
      }).then(onload, onerror);
    };
  }
} else  {
  throw new Error("environment detection error");
}

var out = Module["print"] || console.log.bind(console);

var err = Module["printErr"] || console.error.bind(console);

Object.assign(Module, moduleOverrides);

moduleOverrides = null;

checkIncomingModuleAPI();

if (Module["arguments"]) arguments_ = Module["arguments"];

legacyModuleProp("arguments", "arguments_");

if (Module["thisProgram"]) thisProgram = Module["thisProgram"];

legacyModuleProp("thisProgram", "thisProgram");

if (Module["quit"]) quit_ = Module["quit"];

legacyModuleProp("quit", "quit_");

assert(typeof Module["memoryInitializerPrefixURL"] == "undefined", "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["pthreadMainPrefixURL"] == "undefined", "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["cdInitializerPrefixURL"] == "undefined", "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["filePackagePrefixURL"] == "undefined", "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["read"] == "undefined", "Module.read option was removed (modify read_ in JS)");

assert(typeof Module["readAsync"] == "undefined", "Module.readAsync option was removed (modify readAsync in JS)");

assert(typeof Module["readBinary"] == "undefined", "Module.readBinary option was removed (modify readBinary in JS)");

assert(typeof Module["setWindowTitle"] == "undefined", "Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)");

assert(typeof Module["TOTAL_MEMORY"] == "undefined", "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY");

legacyModuleProp("asm", "wasmExports");

legacyModuleProp("read", "read_");

legacyModuleProp("readAsync", "readAsync");

legacyModuleProp("readBinary", "readBinary");

legacyModuleProp("setWindowTitle", "setWindowTitle");

var IDBFS = "IDBFS is no longer included by default; build with -lidbfs.js";

var PROXYFS = "PROXYFS is no longer included by default; build with -lproxyfs.js";

var WORKERFS = "WORKERFS is no longer included by default; build with -lworkerfs.js";

var FETCHFS = "FETCHFS is no longer included by default; build with -lfetchfs.js";

var ICASEFS = "ICASEFS is no longer included by default; build with -licasefs.js";

var JSFILEFS = "JSFILEFS is no longer included by default; build with -ljsfilefs.js";

var OPFS = "OPFS is no longer included by default; build with -lopfs.js";

var NODEFS = "NODEFS is no longer included by default; build with -lnodefs.js";

assert(!ENVIRONMENT_IS_SHELL, "shell environment detected but not enabled at build time.  Add `shell` to `-sENVIRONMENT` to enable.");

var wasmBinary;

if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];

legacyModuleProp("wasmBinary", "wasmBinary");

if (typeof WebAssembly != "object") {
  err("no native wasm support detected");
}

/** @param {number|boolean=} isFloat */ function getSafeHeapType(bytes, isFloat) {
  switch (bytes) {
   case 1:
    return "i8";

   case 2:
    return "i16";

   case 4:
    return isFloat ? "float" : "i32";

   case 8:
    return isFloat ? "double" : "i64";

   default:
    abort(`getSafeHeapType() invalid bytes=${bytes}`);
  }
}

/** @param {number|boolean=} isFloat */ function SAFE_HEAP_STORE(dest, value, bytes, isFloat) {
  if (dest <= 0) abort(`segmentation fault storing ${bytes} bytes to address ${dest}`);
  if (dest % bytes !== 0) abort(`alignment error storing to address ${dest}, which was expected to be aligned to a multiple of ${bytes}`);
  if (runtimeInitialized) {
    var brk = _sbrk(0);
    if (dest + bytes > brk) abort(`segmentation fault, exceeded the top of the available dynamic heap when storing ${bytes} bytes to address ${dest}. DYNAMICTOP=${brk}`);
    if (brk < _emscripten_stack_get_base()) abort(`brk >= _emscripten_stack_get_base() (brk=${brk}, _emscripten_stack_get_base()=${_emscripten_stack_get_base()})`);
    if (brk > wasmMemory.buffer.byteLength) abort(`brk <= wasmMemory.buffer.byteLength (brk=${brk}, wasmMemory.buffer.byteLength=${wasmMemory.buffer.byteLength})`);
  }
  setValue_safe(dest, value, getSafeHeapType(bytes, isFloat));
  return value;
}

function SAFE_HEAP_STORE_D(dest, value, bytes) {
  return SAFE_HEAP_STORE(dest, value, bytes, true);
}

/** @param {number|boolean=} isFloat */ function SAFE_HEAP_LOAD(dest, bytes, unsigned, isFloat) {
  if (dest <= 0) abort(`segmentation fault loading ${bytes} bytes from address ${dest}`);
  if (dest % bytes !== 0) abort(`alignment error loading from address ${dest}, which was expected to be aligned to a multiple of ${bytes}`);
  if (runtimeInitialized) {
    var brk = _sbrk(0);
    if (dest + bytes > brk) abort(`segmentation fault, exceeded the top of the available dynamic heap when loading ${bytes} bytes from address ${dest}. DYNAMICTOP=${brk}`);
    if (brk < _emscripten_stack_get_base()) abort(`brk >= _emscripten_stack_get_base() (brk=${brk}, _emscripten_stack_get_base()=${_emscripten_stack_get_base()})`);
    if (brk > wasmMemory.buffer.byteLength) abort(`brk <= wasmMemory.buffer.byteLength (brk=${brk}, wasmMemory.buffer.byteLength=${wasmMemory.buffer.byteLength})`);
  }
  var type = getSafeHeapType(bytes, isFloat);
  var ret = getValue_safe(dest, type);
  if (unsigned) ret = unSign(ret, parseInt(type.substr(1), 10));
  return ret;
}

function SAFE_HEAP_LOAD_D(dest, bytes, unsigned) {
  return SAFE_HEAP_LOAD(dest, bytes, unsigned, true);
}

function SAFE_FT_MASK(value, mask) {
  var ret = value & mask;
  if (ret !== value) {
    abort(`Function table mask error: function pointer is ${value} which is masked by ${mask}, the likely cause of this is that the function pointer is being called by the wrong type.`);
  }
  return ret;
}

function segfault() {
  abort("segmentation fault");
}

function alignfault() {
  abort("alignment fault");
}

var wasmMemory;

var ABORT = false;

var EXITSTATUS;

/** @type {function(*, string=)} */ function assert(condition, text) {
  if (!condition) {
    abort("Assertion failed" + (text ? ": " + text : ""));
  }
}

function _malloc() {
  abort("malloc() called but not included in the build - add `_malloc` to EXPORTED_FUNCTIONS");
}

var HEAP, /** @type {!Int8Array} */ HEAP8, /** @type {!Uint8Array} */ HEAPU8, /** @type {!Int16Array} */ HEAP16, /** @type {!Uint16Array} */ HEAPU16, /** @type {!Int32Array} */ HEAP32, /** @type {!Uint32Array} */ HEAPU32, /** @type {!Float32Array} */ HEAPF32, /** @type {!Float64Array} */ HEAPF64;

function updateMemoryViews() {
  var b = wasmMemory.buffer;
  Module["HEAP8"] = HEAP8 = new Int8Array(b);
  Module["HEAP16"] = HEAP16 = new Int16Array(b);
  Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
  Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
  Module["HEAP32"] = HEAP32 = new Int32Array(b);
  Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
  Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
  Module["HEAPF64"] = HEAPF64 = new Float64Array(b);
}

assert(!Module["STACK_SIZE"], "STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time");

assert(typeof Int32Array != "undefined" && typeof Float64Array !== "undefined" && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined, "JS engine does not provide full typed array support");

assert(!Module["wasmMemory"], "Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally");

assert(!Module["INITIAL_MEMORY"], "Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically");

function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  if (max == 0) {
    max += 4;
  }
  SAFE_HEAP_STORE(((max) >> 2) * 4, 34821223, 4);
  SAFE_HEAP_STORE((((max) + (4)) >> 2) * 4, 2310721022, 4);
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  if (max == 0) {
    max += 4;
  }
  var cookie1 = SAFE_HEAP_LOAD(((max) >> 2) * 4, 4, 1);
  var cookie2 = SAFE_HEAP_LOAD((((max) + (4)) >> 2) * 4, 4, 1);
  if (cookie1 != 34821223 || cookie2 != 2310721022) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(cookie2)} ${ptrToString(cookie1)}`);
  }
}

(function() {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 25459;
  if (h8[0] !== 115 || h8[1] !== 99) throw "Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)";
})();

var __ATPRERUN__ = [];

var __ATINIT__ = [];

var __ATMAIN__ = [];

var __ATEXIT__ = [];

var __ATPOSTRUN__ = [];

var runtimeInitialized = false;

function preRun() {
  if (Module["preRun"]) {
    if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
    while (Module["preRun"].length) {
      addOnPreRun(Module["preRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;
  checkStackCookie();
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  checkStackCookie();
  callRuntimeCallbacks(__ATMAIN__);
}

function postRun() {
  checkStackCookie();
  if (Module["postRun"]) {
    if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
    while (Module["postRun"].length) {
      addOnPostRun(Module["postRun"].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}

function addOnExit(cb) {}

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}

assert(Math.imul, "This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.fround, "This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.clz32, "This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.trunc, "This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

var runDependencies = 0;

var runDependencyWatcher = null;

var dependenciesFulfilled = null;

var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
}

function addRunDependency(id) {
  runDependencies++;
  Module["monitorRunDependencies"]?.(runDependencies);
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval != "undefined") {
      runDependencyWatcher = setInterval(() => {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            err("still waiting on run dependencies:");
          }
          err(`dependency: ${dep}`);
        }
        if (shown) {
          err("(end of list)");
        }
      }, 1e4);
    }
  } else {
    err("warning: run dependency added without ID");
  }
}

function removeRunDependency(id) {
  runDependencies--;
  Module["monitorRunDependencies"]?.(runDependencies);
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    err("warning: run dependency removed without ID");
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback();
    }
  }
}

/** @param {string|number=} what */ function abort(what) {
  Module["onAbort"]?.(what);
  what = "Aborted(" + what + ")";
  err(what);
  ABORT = true;
  EXITSTATUS = 1;
  /** @suppress {checkTypes} */ var e = new WebAssembly.RuntimeError(what);
  throw e;
}

var FS = {
  error() {
    abort("Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM");
  },
  init() {
    FS.error();
  },
  createDataFile() {
    FS.error();
  },
  createPreloadedFile() {
    FS.error();
  },
  createLazyFile() {
    FS.error();
  },
  open() {
    FS.error();
  },
  mkdev() {
    FS.error();
  },
  registerDevice() {
    FS.error();
  },
  analyzePath() {
    FS.error();
  },
  ErrnoError() {
    FS.error();
  }
};

Module["FS_createDataFile"] = FS.createDataFile;

Module["FS_createPreloadedFile"] = FS.createPreloadedFile;

var dataURIPrefix = "data:application/octet-stream;base64,";

/**
 * Indicates whether filename is a base64 data URI.
 * @noinline
 */ var isDataURI = filename => filename.startsWith(dataURIPrefix);

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */ var isFileURI = filename => filename.startsWith("file://");

function createExportWrapper(name, nargs) {
  return (...args) => {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    var f = wasmExports[name];
    assert(f, `exported native function \`${name}\` not found`);
    assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
    return f(...args);
  };
}

function findWasmBinary() {
  var f = "hello.wasm";
  if (!isDataURI(f)) {
    return locateFile(f);
  }
  return f;
}

var wasmBinaryFile;

function getBinarySync(file) {
  if (file == wasmBinaryFile && wasmBinary) {
    return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
    return readBinary(file);
  }
  throw "both async and sync fetching of the wasm failed";
}

function getBinaryPromise(binaryFile) {
  if (!wasmBinary) {
    return new Promise((resolve, reject) => {
      readAsync(binaryFile, response => resolve(new Uint8Array(/** @type{!ArrayBuffer} */ (response))), error => {
        try {
          resolve(getBinarySync(binaryFile));
        } catch (e) {
          reject(e);
        }
      });
    });
  }
  return Promise.resolve().then(() => getBinarySync(binaryFile));
}

function instantiateArrayBuffer(binaryFile, imports, receiver) {
  return getBinaryPromise(binaryFile).then(binary => WebAssembly.instantiate(binary, imports)).then(receiver, reason => {
    err(`failed to asynchronously prepare wasm: ${reason}`);
    if (isFileURI(wasmBinaryFile)) {
      err(`warning: Loading from a file URI (${wasmBinaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    }
    abort(reason);
  });
}

function instantiateAsync(binary, binaryFile, imports, callback) {
  if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) &&  !isFileURI(binaryFile) &&  !ENVIRONMENT_IS_NODE && typeof fetch == "function") {
    return fetch(binaryFile, {
      credentials: "same-origin"
    }).then(response => {
      /** @suppress {checkTypes} */ var result = WebAssembly.instantiateStreaming(response, imports);
      return result.then(callback, function(reason) {
        err(`wasm streaming compile failed: ${reason}`);
        err("falling back to ArrayBuffer instantiation");
        return instantiateArrayBuffer(binaryFile, imports, callback);
      });
    });
  }
  return instantiateArrayBuffer(binaryFile, imports, callback);
}

function getWasmImports() {
  return {
    "env": wasmImports,
    "wasi_snapshot_preview1": wasmImports
  };
}

function createWasm() {
  var info = getWasmImports();
  /** @param {WebAssembly.Module=} module*/ function receiveInstance(instance, module) {
    wasmExports = instance.exports;
    wasmMemory = wasmExports["memory"];
    assert(wasmMemory, "memory not found in wasm exports");
    updateMemoryViews();
    wasmTable = wasmExports["__indirect_function_table"];
    assert(wasmTable, "table not found in wasm exports");
    addOnInit(wasmExports["__wasm_call_ctors"]);
    removeRunDependency("wasm-instantiate");
    return wasmExports;
  }
  addRunDependency("wasm-instantiate");
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
    trueModule = null;
    receiveInstance(result["instance"]);
  }
  if (Module["instantiateWasm"]) {
    try {
      return Module["instantiateWasm"](info, receiveInstance);
    } catch (e) {
      err(`Module.instantiateWasm callback failed with error: ${e}`);
      return false;
    }
  }
  if (!wasmBinaryFile) wasmBinaryFile = findWasmBinary();
  instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult);
  return {};
}

var tempDouble;

var tempI64;

function legacyModuleProp(prop, newName, incoming = true) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      get() {
        let extra = incoming ? " (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)" : "";
        abort(`\`Module.${prop}\` has been replaced by \`${newName}\`` + extra);
      }
    });
  }
}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
  }
}

function isExportedByForceFilesystem(name) {
  return name === "FS_createPath" || name === "FS_createDataFile" || name === "FS_createPreloadedFile" || name === "FS_unlink" || name === "addRunDependency" ||  name === "FS_createLazyFile" || name === "FS_createDevice" || name === "removeRunDependency";
}

function missingGlobal(sym, msg) {
  if (typeof globalThis != "undefined") {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get() {
        warnOnce(`\`${sym}\` is not longer defined by emscripten. ${msg}`);
        return undefined;
      }
    });
  }
}

missingGlobal("buffer", "Please use HEAP8.buffer or wasmMemory.buffer");

missingGlobal("asm", "Please use wasmExports instead");

function missingLibrarySymbol(sym) {
  if (typeof globalThis != "undefined" && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
    Object.defineProperty(globalThis, sym, {
      configurable: true,
      get() {
        var msg = `\`${sym}\` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line`;
        var librarySymbol = sym;
        if (!librarySymbol.startsWith("_")) {
          librarySymbol = "$" + sym;
        }
        msg += ` (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE='${librarySymbol}')`;
        if (isExportedByForceFilesystem(sym)) {
          msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
        }
        warnOnce(msg);
        return undefined;
      }
    });
  }
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        var msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
        if (isExportedByForceFilesystem(sym)) {
          msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
        }
        abort(msg);
      }
    });
  }
}

function dbg(...args) {
  console.warn(...args);
}

/** @constructor */ function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = `Program terminated with exit(${status})`;
  this.status = status;
}

var callRuntimeCallbacks = callbacks => {
  while (callbacks.length > 0) {
    callbacks.shift()(Module);
  }
};

/**
     * @param {number} ptr
     * @param {string} type
     */ function getValue(ptr, type = "i8") {
  if (type.endsWith("*")) type = "*";
  switch (type) {
   case "i1":
    return SAFE_HEAP_LOAD(ptr, 1, 0);

   case "i8":
    return SAFE_HEAP_LOAD(ptr, 1, 0);

   case "i16":
    return SAFE_HEAP_LOAD(((ptr) >> 1) * 2, 2, 0);

   case "i32":
    return SAFE_HEAP_LOAD(((ptr) >> 2) * 4, 4, 0);

   case "i64":
    abort("to do getValue(i64) use WASM_BIGINT");

   case "float":
    return SAFE_HEAP_LOAD_D(((ptr) >> 2) * 4, 4, 0);

   case "double":
    return SAFE_HEAP_LOAD_D(((ptr) >> 3) * 8, 8, 0);

   case "*":
    return SAFE_HEAP_LOAD(((ptr) >> 2) * 4, 4, 1);

   default:
    abort(`invalid type for getValue: ${type}`);
  }
}

function getValue_safe(ptr, type = "i8") {
  if (type.endsWith("*")) type = "*";
  switch (type) {
   case "i1":
    return HEAP8[ptr];

   case "i8":
    return HEAP8[ptr];

   case "i16":
    return HEAP16[((ptr) >> 1)];

   case "i32":
    return HEAP32[((ptr) >> 2)];

   case "i64":
    abort("to do getValue(i64) use WASM_BIGINT");

   case "float":
    return HEAPF32[((ptr) >> 2)];

   case "double":
    return HEAPF64[((ptr) >> 3)];

   case "*":
    return HEAPU32[((ptr) >> 2)];

   default:
    abort(`invalid type for getValue: ${type}`);
  }
}

var noExitRuntime = Module["noExitRuntime"] || true;

var ptrToString = ptr => {
  assert(typeof ptr === "number");
  ptr >>>= 0;
  return "0x" + ptr.toString(16).padStart(8, "0");
};

/**
     * @param {number} ptr
     * @param {number} value
     * @param {string} type
     */ function setValue(ptr, value, type = "i8") {
  if (type.endsWith("*")) type = "*";
  switch (type) {
   case "i1":
    SAFE_HEAP_STORE(ptr, value, 1);
    break;

   case "i8":
    SAFE_HEAP_STORE(ptr, value, 1);
    break;

   case "i16":
    SAFE_HEAP_STORE(((ptr) >> 1) * 2, value, 2);
    break;

   case "i32":
    SAFE_HEAP_STORE(((ptr) >> 2) * 4, value, 4);
    break;

   case "i64":
    abort("to do setValue(i64) use WASM_BIGINT");

   case "float":
    SAFE_HEAP_STORE_D(((ptr) >> 2) * 4, value, 4);
    break;

   case "double":
    SAFE_HEAP_STORE_D(((ptr) >> 3) * 8, value, 8);
    break;

   case "*":
    SAFE_HEAP_STORE(((ptr) >> 2) * 4, value, 4);
    break;

   default:
    abort(`invalid type for setValue: ${type}`);
  }
}

function setValue_safe(ptr, value, type = "i8") {
  if (type.endsWith("*")) type = "*";
  switch (type) {
   case "i1":
    HEAP8[ptr] = value;
    break;

   case "i8":
    HEAP8[ptr] = value;
    break;

   case "i16":
    HEAP16[((ptr) >> 1)] = value;
    break;

   case "i32":
    HEAP32[((ptr) >> 2)] = value;
    break;

   case "i64":
    abort("to do setValue(i64) use WASM_BIGINT");

   case "float":
    HEAPF32[((ptr) >> 2)] = value;
    break;

   case "double":
    HEAPF64[((ptr) >> 3)] = value;
    break;

   case "*":
    HEAPU32[((ptr) >> 2)] = value;
    break;

   default:
    abort(`invalid type for setValue: ${type}`);
  }
}

var stackRestore = val => __emscripten_stack_restore(val);

var stackSave = () => _emscripten_stack_get_current();

var unSign = (value, bits) => {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2 * Math.abs(1 << (bits - 1)) + value : Math.pow(2, bits) + value;
};

var warnOnce = text => {
  warnOnce.shown ||= {};
  if (!warnOnce.shown[text]) {
    warnOnce.shown[text] = 1;
    if (ENVIRONMENT_IS_NODE) text = "warning: " + text;
    err(text);
  }
};

var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;

/**
     * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
     * array that contains uint8 values, returns a copy of that string as a
     * Javascript String object.
     * heapOrArray is either a regular array, or a JavaScript typed array view.
     * @param {number} idx
     * @param {number=} maxBytesToRead
     * @return {string}
     */ var UTF8ArrayToString = (heapOrArray, idx, maxBytesToRead) => {
  var endIdx = idx + maxBytesToRead;
  var endPtr = idx;
  while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
    return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
  }
  var str = "";
  while (idx < endPtr) {
    var u0 = heapOrArray[idx++];
    if (!(u0 & 128)) {
      str += String.fromCharCode(u0);
      continue;
    }
    var u1 = heapOrArray[idx++] & 63;
    if ((u0 & 224) == 192) {
      str += String.fromCharCode(((u0 & 31) << 6) | u1);
      continue;
    }
    var u2 = heapOrArray[idx++] & 63;
    if ((u0 & 240) == 224) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      if ((u0 & 248) != 240) warnOnce("Invalid UTF-8 leading byte " + ptrToString(u0) + " encountered when deserializing a UTF-8 string in wasm memory to a JS string!");
      u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
    }
    if (u0 < 65536) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 65536;
      str += String.fromCharCode(55296 | (ch >> 10), 56320 | (ch & 1023));
    }
  }
  return str;
};

/**
     * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
     * emscripten HEAP, returns a copy of that string as a Javascript String object.
     *
     * @param {number} ptr
     * @param {number=} maxBytesToRead - An optional length that specifies the
     *   maximum number of bytes to read. You can omit this parameter to scan the
     *   string until the first 0 byte. If maxBytesToRead is passed, and the string
     *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
     *   string will cut short at that byte index (i.e. maxBytesToRead will not
     *   produce a string of exact length [ptr, ptr+maxBytesToRead[) N.B. mixing
     *   frequent uses of UTF8ToString() with and without maxBytesToRead may throw
     *   JS JIT optimizations off, so it is worth to consider consistently using one
     * @return {string}
     */ var UTF8ToString = (ptr, maxBytesToRead) => {
  assert(typeof ptr == "number", `UTF8ToString expects a number (got ${typeof ptr})`);
  return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
};

var ___assert_fail = (condition, filename, line, func) => {
  abort(`Assertion failed: ${UTF8ToString(condition)}, at: ` + [ filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function" ]);
};

var __abort_js = () => {
  abort("native code called abort()");
};

var __emscripten_memcpy_js = (dest, src, num) => HEAPU8.copyWithin(dest, src, src + num);

var _emscripten_set_main_loop_timing = (mode, value) => {
  Browser.mainLoop.timingMode = mode;
  Browser.mainLoop.timingValue = value;
  if (!Browser.mainLoop.func) {
    err("emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a main loop does not exist! Call emscripten_set_main_loop first to set one up.");
    return 1;
  }
  if (!Browser.mainLoop.running) {
    Browser.mainLoop.running = true;
  }
  if (mode == 0) {
    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
      var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
      setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
    };
    Browser.mainLoop.method = "timeout";
  } else if (mode == 1) {
    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
      Browser.requestAnimationFrame(Browser.mainLoop.runner);
    };
    Browser.mainLoop.method = "rAF";
  } else if (mode == 2) {
    if (typeof Browser.setImmediate == "undefined") {
      if (typeof setImmediate == "undefined") {
        var setImmediates = [];
        var emscriptenMainLoopMessageId = "setimmediate";
        /** @param {Event} event */ var Browser_setImmediate_messageHandler = event => {
          if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
            event.stopPropagation();
            setImmediates.shift()();
          }
        };
        addEventListener("message", Browser_setImmediate_messageHandler, true);
        Browser.setImmediate = /** @type{function(function(): ?, ...?): number} */ (function Browser_emulated_setImmediate(func) {
          setImmediates.push(func);
          if (ENVIRONMENT_IS_WORKER) {
            if (Module["setImmediates"] === undefined) Module["setImmediates"] = [];
            Module["setImmediates"].push(func);
            postMessage({
              target: emscriptenMainLoopMessageId
            });
          } else postMessage(emscriptenMainLoopMessageId, "*");
        });
      } else {
        Browser.setImmediate = setImmediate;
      }
    }
    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
      Browser.setImmediate(Browser.mainLoop.runner);
    };
    Browser.mainLoop.method = "immediate";
  }
  return 0;
};

var _emscripten_get_now;

_emscripten_get_now = () => performance.now();

/**
     * @param {number=} arg
     * @param {boolean=} noSetTiming
     */ var setMainLoop = (browserIterationFunc, fps, simulateInfiniteLoop, arg, noSetTiming) => {
  assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
  Browser.mainLoop.func = browserIterationFunc;
  Browser.mainLoop.arg = arg;
  /** @type{number} */ var thisMainLoopId = (() => Browser.mainLoop.currentlyRunningMainloop)();
  function checkIsRunning() {
    if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) {
      return false;
    }
    return true;
  }
  Browser.mainLoop.running = false;
  Browser.mainLoop.runner = function Browser_mainLoop_runner() {
    if (ABORT) return;
    if (Browser.mainLoop.queue.length > 0) {
      var start = Date.now();
      var blocker = Browser.mainLoop.queue.shift();
      blocker.func(blocker.arg);
      if (Browser.mainLoop.remainingBlockers) {
        var remaining = Browser.mainLoop.remainingBlockers;
        var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
        if (blocker.counted) {
          Browser.mainLoop.remainingBlockers = next;
        } else {
          next = next + .5;
          Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
        }
      }
      Browser.mainLoop.updateStatus();
      if (!checkIsRunning()) return;
      setTimeout(Browser.mainLoop.runner, 0);
      return;
    }
    if (!checkIsRunning()) return;
    Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
    if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
      Browser.mainLoop.scheduler();
      return;
    } else if (Browser.mainLoop.timingMode == 0) {
      Browser.mainLoop.tickStartTime = _emscripten_get_now();
    }
    if (Browser.mainLoop.method === "timeout" && Module.ctx) {
      warnOnce("Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!");
      Browser.mainLoop.method = "";
    }
    Browser.mainLoop.runIter(browserIterationFunc);
    checkStackCookie();
    if (!checkIsRunning()) return;
    if (typeof SDL == "object") SDL.audio?.queueNewAudioData?.();
    Browser.mainLoop.scheduler();
  };
  if (!noSetTiming) {
    if (fps && fps > 0) {
      _emscripten_set_main_loop_timing(0, 1e3 / fps);
    } else {
      _emscripten_set_main_loop_timing(1, 1);
    }
    Browser.mainLoop.scheduler();
  }
  if (simulateInfiniteLoop) {
    throw "unwind";
  }
};

var handleException = e => {
  if (e instanceof ExitStatus || e == "unwind") {
    return EXITSTATUS;
  }
  checkStackCookie();
  if (e instanceof WebAssembly.RuntimeError) {
    if (_emscripten_stack_get_current() <= 0) {
      err("Stack overflow detected.  You can try increasing -sSTACK_SIZE (currently set to 65536)");
    }
  }
  quit_(1, e);
};

var runtimeKeepaliveCounter = 0;

var keepRuntimeAlive = () => noExitRuntime || runtimeKeepaliveCounter > 0;

var _proc_exit = code => {
  EXITSTATUS = code;
  if (!keepRuntimeAlive()) {
    Module["onExit"]?.(code);
    ABORT = true;
  }
  quit_(code, new ExitStatus(code));
};

/** @param {boolean|number=} implicit */ var exitJS = (status, implicit) => {
  EXITSTATUS = status;
  checkUnflushedContent();
  if (keepRuntimeAlive() && !implicit) {
    var msg = `program exited (with status: ${status}), but keepRuntimeAlive() is set (counter=${runtimeKeepaliveCounter}) due to an async operation, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)`;
    err(msg);
  }
  _proc_exit(status);
};

var _exit = exitJS;

var maybeExit = () => {
  if (!keepRuntimeAlive()) {
    try {
      _exit(EXITSTATUS);
    } catch (e) {
      handleException(e);
    }
  }
};

var callUserCallback = func => {
  if (ABORT) {
    err("user callback triggered after runtime exited or application aborted.  Ignoring.");
    return;
  }
  try {
    func();
    maybeExit();
  } catch (e) {
    handleException(e);
  }
};

/** @param {number=} timeout */ var safeSetTimeout = (func, timeout) => setTimeout(() => {
  callUserCallback(func);
}, timeout);

var preloadPlugins = Module["preloadPlugins"] || [];

var Browser = {
  mainLoop: {
    running: false,
    scheduler: null,
    method: "",
    currentlyRunningMainloop: 0,
    func: null,
    arg: 0,
    timingMode: 0,
    timingValue: 0,
    currentFrameNumber: 0,
    queue: [],
    pause() {
      Browser.mainLoop.scheduler = null;
      Browser.mainLoop.currentlyRunningMainloop++;
    },
    resume() {
      Browser.mainLoop.currentlyRunningMainloop++;
      var timingMode = Browser.mainLoop.timingMode;
      var timingValue = Browser.mainLoop.timingValue;
      var func = Browser.mainLoop.func;
      Browser.mainLoop.func = null;
      setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
      _emscripten_set_main_loop_timing(timingMode, timingValue);
      Browser.mainLoop.scheduler();
    },
    updateStatus() {
      if (Module["setStatus"]) {
        var message = Module["statusMessage"] || "Please wait...";
        var remaining = Browser.mainLoop.remainingBlockers;
        var expected = Browser.mainLoop.expectedBlockers;
        if (remaining) {
          if (remaining < expected) {
            Module["setStatus"](`{message} ({expected - remaining}/{expected})`);
          } else {
            Module["setStatus"](message);
          }
        } else {
          Module["setStatus"]("");
        }
      }
    },
    runIter(func) {
      if (ABORT) return;
      if (Module["preMainLoop"]) {
        var preRet = Module["preMainLoop"]();
        if (preRet === false) {
          return;
        }
      }
      callUserCallback(func);
      Module["postMainLoop"]?.();
    }
  },
  isFullscreen: false,
  pointerLock: false,
  moduleContextCreatedCallbacks: [],
  workers: [],
  init() {
    if (Browser.initted) return;
    Browser.initted = true;
    var imagePlugin = {};
    imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
      return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
    };
    imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
      var b = new Blob([ byteArray ], {
        type: Browser.getMimetype(name)
      });
      if (b.size !== byteArray.length) {
        b = new Blob([ (new Uint8Array(byteArray)).buffer ], {
          type: Browser.getMimetype(name)
        });
      }
      var url = URL.createObjectURL(b);
      assert(typeof url == "string", "createObjectURL must return a url as a string");
      var img = new Image;
      img.onload = () => {
        assert(img.complete, `Image ${name} could not be decoded`);
        var canvas = /** @type {!HTMLCanvasElement} */ (document.createElement("canvas"));
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        preloadedImages[name] = canvas;
        URL.revokeObjectURL(url);
        onload?.(byteArray);
      };
      img.onerror = event => {
        err(`Image ${url} could not be decoded`);
        onerror?.();
      };
      img.src = url;
    };
    preloadPlugins.push(imagePlugin);
    var audioPlugin = {};
    audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
      return !Module.noAudioDecoding && name.substr(-4) in {
        ".ogg": 1,
        ".wav": 1,
        ".mp3": 1
      };
    };
    audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
      var done = false;
      function finish(audio) {
        if (done) return;
        done = true;
        preloadedAudios[name] = audio;
        onload?.(byteArray);
      }
      function fail() {
        if (done) return;
        done = true;
        preloadedAudios[name] = new Audio;
        onerror?.();
      }
      var b = new Blob([ byteArray ], {
        type: Browser.getMimetype(name)
      });
      var url = URL.createObjectURL(b);
      assert(typeof url == "string", "createObjectURL must return a url as a string");
      var audio = new Audio;
      audio.addEventListener("canplaythrough", () => finish(audio), false);
      audio.onerror = function audio_onerror(event) {
        if (done) return;
        err(`warning: browser could not fully decode audio ${name}, trying slower base64 approach`);
        function encode64(data) {
          var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
          var PAD = "=";
          var ret = "";
          var leftchar = 0;
          var leftbits = 0;
          for (var i = 0; i < data.length; i++) {
            leftchar = (leftchar << 8) | data[i];
            leftbits += 8;
            while (leftbits >= 6) {
              var curr = (leftchar >> (leftbits - 6)) & 63;
              leftbits -= 6;
              ret += BASE[curr];
            }
          }
          if (leftbits == 2) {
            ret += BASE[(leftchar & 3) << 4];
            ret += PAD + PAD;
          } else if (leftbits == 4) {
            ret += BASE[(leftchar & 15) << 2];
            ret += PAD;
          }
          return ret;
        }
        audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
        finish(audio);
      };
      audio.src = url;
      safeSetTimeout(() => {
        finish(audio);
      },  1e4);
    };
    preloadPlugins.push(audioPlugin);
    function pointerLockChange() {
      Browser.pointerLock = document["pointerLockElement"] === Module["canvas"] || document["mozPointerLockElement"] === Module["canvas"] || document["webkitPointerLockElement"] === Module["canvas"] || document["msPointerLockElement"] === Module["canvas"];
    }
    var canvas = Module["canvas"];
    if (canvas) {
      canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || (() => {});
      canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || (() => {});
      canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
      document.addEventListener("pointerlockchange", pointerLockChange, false);
      document.addEventListener("mozpointerlockchange", pointerLockChange, false);
      document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
      document.addEventListener("mspointerlockchange", pointerLockChange, false);
      if (Module["elementPointerLock"]) {
        canvas.addEventListener("click", ev => {
          if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
            Module["canvas"].requestPointerLock();
            ev.preventDefault();
          }
        }, false);
      }
    }
  },
  createContext(/** @type {HTMLCanvasElement} */ canvas, useWebGL, setInModule, webGLContextAttributes) {
    if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx;
    var ctx;
    var contextHandle;
    if (useWebGL) {
      var contextAttributes = {
        antialias: false,
        alpha: false,
        majorVersion: 1
      };
      if (webGLContextAttributes) {
        for (var attribute in webGLContextAttributes) {
          contextAttributes[attribute] = webGLContextAttributes[attribute];
        }
      }
      if (typeof GL != "undefined") {
        contextHandle = GL.createContext(canvas, contextAttributes);
        if (contextHandle) {
          ctx = GL.getContext(contextHandle).GLctx;
        }
      }
    } else {
      ctx = canvas.getContext("2d");
    }
    if (!ctx) return null;
    if (setInModule) {
      if (!useWebGL) assert(typeof GLctx == "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
      Module.ctx = ctx;
      if (useWebGL) GL.makeContextCurrent(contextHandle);
      Module.useWebGL = useWebGL;
      Browser.moduleContextCreatedCallbacks.forEach(callback => callback());
      Browser.init();
    }
    return ctx;
  },
  destroyContext(canvas, useWebGL, setInModule) {},
  fullscreenHandlersInstalled: false,
  lockPointer: undefined,
  resizeCanvas: undefined,
  requestFullscreen(lockPointer, resizeCanvas) {
    Browser.lockPointer = lockPointer;
    Browser.resizeCanvas = resizeCanvas;
    if (typeof Browser.lockPointer == "undefined") Browser.lockPointer = true;
    if (typeof Browser.resizeCanvas == "undefined") Browser.resizeCanvas = false;
    var canvas = Module["canvas"];
    function fullscreenChange() {
      Browser.isFullscreen = false;
      var canvasContainer = canvas.parentNode;
      if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
        canvas.exitFullscreen = Browser.exitFullscreen;
        if (Browser.lockPointer) canvas.requestPointerLock();
        Browser.isFullscreen = true;
        if (Browser.resizeCanvas) {
          Browser.setFullscreenCanvasSize();
        } else {
          Browser.updateCanvasDimensions(canvas);
        }
      } else {
        canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
        canvasContainer.parentNode.removeChild(canvasContainer);
        if (Browser.resizeCanvas) {
          Browser.setWindowedCanvasSize();
        } else {
          Browser.updateCanvasDimensions(canvas);
        }
      }
      Module["onFullScreen"]?.(Browser.isFullscreen);
      Module["onFullscreen"]?.(Browser.isFullscreen);
    }
    if (!Browser.fullscreenHandlersInstalled) {
      Browser.fullscreenHandlersInstalled = true;
      document.addEventListener("fullscreenchange", fullscreenChange, false);
      document.addEventListener("mozfullscreenchange", fullscreenChange, false);
      document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
      document.addEventListener("MSFullscreenChange", fullscreenChange, false);
    }
    var canvasContainer = document.createElement("div");
    canvas.parentNode.insertBefore(canvasContainer, canvas);
    canvasContainer.appendChild(canvas);
    canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? () => canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null) || (canvasContainer["webkitRequestFullScreen"] ? () => canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null);
    canvasContainer.requestFullscreen();
  },
  requestFullScreen() {
    abort("Module.requestFullScreen has been replaced by Module.requestFullscreen (without a capital S)");
  },
  exitFullscreen() {
    if (!Browser.isFullscreen) {
      return false;
    }
    var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || (() => {});
    CFS.apply(document, []);
    return true;
  },
  nextRAF: 0,
  fakeRequestAnimationFrame(func) {
    var now = Date.now();
    if (Browser.nextRAF === 0) {
      Browser.nextRAF = now + 1e3 / 60;
    } else {
      while (now + 2 >= Browser.nextRAF) {
        Browser.nextRAF += 1e3 / 60;
      }
    }
    var delay = Math.max(Browser.nextRAF - now, 0);
    setTimeout(func, delay);
  },
  requestAnimationFrame(func) {
    if (typeof requestAnimationFrame == "function") {
      requestAnimationFrame(func);
      return;
    }
    var RAF = Browser.fakeRequestAnimationFrame;
    RAF(func);
  },
  safeSetTimeout(func, timeout) {
    return safeSetTimeout(func, timeout);
  },
  safeRequestAnimationFrame(func) {
    return Browser.requestAnimationFrame(() => {
      callUserCallback(func);
    });
  },
  getMimetype(name) {
    return {
      "jpg": "image/jpeg",
      "jpeg": "image/jpeg",
      "png": "image/png",
      "bmp": "image/bmp",
      "ogg": "audio/ogg",
      "wav": "audio/wav",
      "mp3": "audio/mpeg"
    }[name.substr(name.lastIndexOf(".") + 1)];
  },
  getUserMedia(func) {
    window.getUserMedia ||= navigator["getUserMedia"] || navigator["mozGetUserMedia"];
    window.getUserMedia(func);
  },
  getMovementX(event) {
    return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
  },
  getMovementY(event) {
    return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
  },
  getMouseWheelDelta(event) {
    var delta = 0;
    switch (event.type) {
     case "DOMMouseScroll":
      delta = event.detail / 3;
      break;

     case "mousewheel":
      delta = event.wheelDelta / 120;
      break;

     case "wheel":
      delta = event.deltaY;
      switch (event.deltaMode) {
       case 0:
        delta /= 100;
        break;

       case 1:
        delta /= 3;
        break;

       case 2:
        delta *= 80;
        break;

       default:
        throw "unrecognized mouse wheel delta mode: " + event.deltaMode;
      }
      break;

     default:
      throw "unrecognized mouse wheel event: " + event.type;
    }
    return delta;
  },
  mouseX: 0,
  mouseY: 0,
  mouseMovementX: 0,
  mouseMovementY: 0,
  touches: {},
  lastTouches: {},
  calculateMouseCoords(pageX, pageY) {
    var rect = Module["canvas"].getBoundingClientRect();
    var cw = Module["canvas"].width;
    var ch = Module["canvas"].height;
    var scrollX = ((typeof window.scrollX != "undefined") ? window.scrollX : window.pageXOffset);
    var scrollY = ((typeof window.scrollY != "undefined") ? window.scrollY : window.pageYOffset);
    assert((typeof scrollX != "undefined") && (typeof scrollY != "undefined"), "Unable to retrieve scroll position, mouse positions likely broken.");
    var adjustedX = pageX - (scrollX + rect.left);
    var adjustedY = pageY - (scrollY + rect.top);
    adjustedX = adjustedX * (cw / rect.width);
    adjustedY = adjustedY * (ch / rect.height);
    return {
      x: adjustedX,
      y: adjustedY
    };
  },
  setMouseCoords(pageX, pageY) {
    const {x: x, y: y} = Browser.calculateMouseCoords(pageX, pageY);
    Browser.mouseMovementX = x - Browser.mouseX;
    Browser.mouseMovementY = y - Browser.mouseY;
    Browser.mouseX = x;
    Browser.mouseY = y;
  },
  calculateMouseEvent(event) {
    if (Browser.pointerLock) {
      if (event.type != "mousemove" && ("mozMovementX" in event)) {
        Browser.mouseMovementX = Browser.mouseMovementY = 0;
      } else {
        Browser.mouseMovementX = Browser.getMovementX(event);
        Browser.mouseMovementY = Browser.getMovementY(event);
      }
      Browser.mouseX += Browser.mouseMovementX;
      Browser.mouseY += Browser.mouseMovementY;
    } else {
      if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
        var touch = event.touch;
        if (touch === undefined) {
          return;
        }
        var coords = Browser.calculateMouseCoords(touch.pageX, touch.pageY);
        if (event.type === "touchstart") {
          Browser.lastTouches[touch.identifier] = coords;
          Browser.touches[touch.identifier] = coords;
        } else if (event.type === "touchend" || event.type === "touchmove") {
          var last = Browser.touches[touch.identifier];
          last ||= coords;
          Browser.lastTouches[touch.identifier] = last;
          Browser.touches[touch.identifier] = coords;
        }
        return;
      }
      Browser.setMouseCoords(event.pageX, event.pageY);
    }
  },
  resizeListeners: [],
  updateResizeListeners() {
    var canvas = Module["canvas"];
    Browser.resizeListeners.forEach(listener => listener(canvas.width, canvas.height));
  },
  setCanvasSize(width, height, noUpdates) {
    var canvas = Module["canvas"];
    Browser.updateCanvasDimensions(canvas, width, height);
    if (!noUpdates) Browser.updateResizeListeners();
  },
  windowedWidth: 0,
  windowedHeight: 0,
  setFullscreenCanvasSize() {
    if (typeof SDL != "undefined") {
      var flags = SAFE_HEAP_LOAD(((SDL.screen) >> 2) * 4, 4, 1);
      flags = flags | 8388608;
      SAFE_HEAP_STORE(((SDL.screen) >> 2) * 4, flags, 4);
    }
    Browser.updateCanvasDimensions(Module["canvas"]);
    Browser.updateResizeListeners();
  },
  setWindowedCanvasSize() {
    if (typeof SDL != "undefined") {
      var flags = SAFE_HEAP_LOAD(((SDL.screen) >> 2) * 4, 4, 1);
      flags = flags & ~8388608;
      SAFE_HEAP_STORE(((SDL.screen) >> 2) * 4, flags, 4);
    }
    Browser.updateCanvasDimensions(Module["canvas"]);
    Browser.updateResizeListeners();
  },
  updateCanvasDimensions(canvas, wNative, hNative) {
    if (wNative && hNative) {
      canvas.widthNative = wNative;
      canvas.heightNative = hNative;
    } else {
      wNative = canvas.widthNative;
      hNative = canvas.heightNative;
    }
    var w = wNative;
    var h = hNative;
    if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
      if (w / h < Module["forcedAspectRatio"]) {
        w = Math.round(h * Module["forcedAspectRatio"]);
      } else {
        h = Math.round(w / Module["forcedAspectRatio"]);
      }
    }
    if (((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode) && (typeof screen != "undefined")) {
      var factor = Math.min(screen.width / w, screen.height / h);
      w = Math.round(w * factor);
      h = Math.round(h * factor);
    }
    if (Browser.resizeCanvas) {
      if (canvas.width != w) canvas.width = w;
      if (canvas.height != h) canvas.height = h;
      if (typeof canvas.style != "undefined") {
        canvas.style.removeProperty("width");
        canvas.style.removeProperty("height");
      }
    } else {
      if (canvas.width != wNative) canvas.width = wNative;
      if (canvas.height != hNative) canvas.height = hNative;
      if (typeof canvas.style != "undefined") {
        if (w != wNative || h != hNative) {
          canvas.style.setProperty("width", w + "px", "important");
          canvas.style.setProperty("height", h + "px", "important");
        } else {
          canvas.style.removeProperty("width");
          canvas.style.removeProperty("height");
        }
      }
    }
  }
};

var _emscripten_cancel_main_loop = () => {
  Browser.mainLoop.pause();
  Browser.mainLoop.func = null;
};

var getHeapMax = () => HEAPU8.length;

var abortOnCannotGrowMemory = requestedSize => {
  abort(`Cannot enlarge memory arrays to size ${requestedSize} bytes (OOM). Either (1) compile with -sINITIAL_MEMORY=X with X higher than the current value ${HEAP8.length}, (2) compile with -sALLOW_MEMORY_GROWTH which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with -sABORTING_MALLOC=0`);
};

var _emscripten_resize_heap = requestedSize => {
  var oldSize = HEAPU8.length;
  requestedSize >>>= 0;
  abortOnCannotGrowMemory(requestedSize);
};

var wasmTableMirror = [];

/** @type {WebAssembly.Table} */ var wasmTable;

var getWasmTableEntry = funcPtr => {
  var func = wasmTableMirror[funcPtr];
  if (!func) {
    if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
    wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
  }
  assert(wasmTable.get(funcPtr) == func, "JavaScript-side Wasm function table mirror is out of date!");
  return func;
};

var _emscripten_set_main_loop = (func, fps, simulateInfiniteLoop) => {
  var browserIterationFunc = getWasmTableEntry(func);
  setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop);
};

var SYSCALLS = {
  varargs: undefined,
  getStr(ptr) {
    var ret = UTF8ToString(ptr);
    return ret;
  }
};

var _fd_close = fd => {
  abort("fd_close called without SYSCALLS_REQUIRE_FILESYSTEM");
};

var convertI32PairToI53Checked = (lo, hi) => {
  assert(lo == (lo >>> 0) || lo == (lo | 0));
  assert(hi === (hi | 0));
  return ((hi + 2097152) >>> 0 < 4194305 - !!lo) ? (lo >>> 0) + hi * 4294967296 : NaN;
};

function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
  var offset = convertI32PairToI53Checked(offset_low, offset_high);
  return 70;
}

var printCharBuffers = [ null, [], [] ];

var printChar = (stream, curr) => {
  var buffer = printCharBuffers[stream];
  assert(buffer);
  if (curr === 0 || curr === 10) {
    (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
    buffer.length = 0;
  } else {
    buffer.push(curr);
  }
};

var flush_NO_FILESYSTEM = () => {
  _fflush(0);
  if (printCharBuffers[1].length) printChar(1, 10);
  if (printCharBuffers[2].length) printChar(2, 10);
};

var _fd_write = (fd, iov, iovcnt, pnum) => {
  var num = 0;
  for (var i = 0; i < iovcnt; i++) {
    var ptr = SAFE_HEAP_LOAD(((iov) >> 2) * 4, 4, 1);
    var len = SAFE_HEAP_LOAD((((iov) + (4)) >> 2) * 4, 4, 1);
    iov += 8;
    for (var j = 0; j < len; j++) {
      printChar(fd, SAFE_HEAP_LOAD(ptr + j, 1, 1));
    }
    num += len;
  }
  SAFE_HEAP_STORE(((pnum) >> 2) * 4, num, 4);
  return 0;
};

var lengthBytesUTF8 = str => {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    var c = str.charCodeAt(i);
    if (c <= 127) {
      len++;
    } else if (c <= 2047) {
      len += 2;
    } else if (c >= 55296 && c <= 57343) {
      len += 4;
      ++i;
    } else {
      len += 3;
    }
  }
  return len;
};

var stringToUTF8Array = (str, heap, outIdx, maxBytesToWrite) => {
  assert(typeof str === "string", `stringToUTF8Array expects a string (got ${typeof str})`);
  if (!(maxBytesToWrite > 0)) return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  for (var i = 0; i < str.length; ++i) {
    var u = str.charCodeAt(i);
    if (u >= 55296 && u <= 57343) {
      var u1 = str.charCodeAt(++i);
      u = 65536 + ((u & 1023) << 10) | (u1 & 1023);
    }
    if (u <= 127) {
      if (outIdx >= endIdx) break;
      heap[outIdx++] = u;
    } else if (u <= 2047) {
      if (outIdx + 1 >= endIdx) break;
      heap[outIdx++] = 192 | (u >> 6);
      heap[outIdx++] = 128 | (u & 63);
    } else if (u <= 65535) {
      if (outIdx + 2 >= endIdx) break;
      heap[outIdx++] = 224 | (u >> 12);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
    } else {
      if (outIdx + 3 >= endIdx) break;
      if (u > 1114111) warnOnce("Invalid Unicode code point " + ptrToString(u) + " encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).");
      heap[outIdx++] = 240 | (u >> 18);
      heap[outIdx++] = 128 | ((u >> 12) & 63);
      heap[outIdx++] = 128 | ((u >> 6) & 63);
      heap[outIdx++] = 128 | (u & 63);
    }
  }
  heap[outIdx] = 0;
  return outIdx - startIdx;
};

var stringToUTF8 = (str, outPtr, maxBytesToWrite) => {
  assert(typeof maxBytesToWrite == "number", "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
};

var stackAlloc = sz => __emscripten_stack_alloc(sz);

var stringToUTF8OnStack = str => {
  var size = lengthBytesUTF8(str) + 1;
  var ret = stackAlloc(size);
  stringToUTF8(str, ret, size);
  return ret;
};

var WebGPU = {
  errorCallback: (callback, type, message, userdata) => {
    var sp = stackSave();
    var messagePtr = stringToUTF8OnStack(message);
    getWasmTableEntry(callback)(type, messagePtr, userdata);
    stackRestore(sp);
  },
  initManagers: () => {
    if (WebGPU.mgrDevice) return;
    /** @constructor */ function Manager() {
      this.objects = {};
      this.nextId = 1;
      this.create = function(object, wrapper = {}) {
        var id = this.nextId++;
        assert(typeof this.objects[id] == "undefined");
        wrapper.refcount = 1;
        wrapper.object = object;
        this.objects[id] = wrapper;
        return id;
      };
      this.get = function(id) {
        if (!id) return undefined;
        var o = this.objects[id];
        assert(typeof o != "undefined");
        return o.object;
      };
      this.addRef = function(id) {
        var o = this.objects[id];
        assert(typeof o != "undefined");
        o.refcount++;
      };
      this.release = function(id) {
        var o = this.objects[id];
        assert(typeof o != "undefined");
        assert(o.refcount > 0);
        o.refcount--;
        if (o.refcount <= 0) {
          delete this.objects[id];
        }
      };
    }
    WebGPU.mgrSurface = WebGPU.mgrSurface || new Manager;
    WebGPU.mgrSwapChain = WebGPU.mgrSwapChain || new Manager;
    WebGPU.mgrAdapter = WebGPU.mgrAdapter || new Manager;
    WebGPU.mgrDevice = WebGPU.mgrDevice || new Manager;
    WebGPU.mgrQueue = WebGPU.mgrQueue || new Manager;
    WebGPU.mgrCommandBuffer = WebGPU.mgrCommandBuffer || new Manager;
    WebGPU.mgrCommandEncoder = WebGPU.mgrCommandEncoder || new Manager;
    WebGPU.mgrRenderPassEncoder = WebGPU.mgrRenderPassEncoder || new Manager;
    WebGPU.mgrComputePassEncoder = WebGPU.mgrComputePassEncoder || new Manager;
    WebGPU.mgrBindGroup = WebGPU.mgrBindGroup || new Manager;
    WebGPU.mgrBuffer = WebGPU.mgrBuffer || new Manager;
    WebGPU.mgrSampler = WebGPU.mgrSampler || new Manager;
    WebGPU.mgrTexture = WebGPU.mgrTexture || new Manager;
    WebGPU.mgrTextureView = WebGPU.mgrTextureView || new Manager;
    WebGPU.mgrQuerySet = WebGPU.mgrQuerySet || new Manager;
    WebGPU.mgrBindGroupLayout = WebGPU.mgrBindGroupLayout || new Manager;
    WebGPU.mgrPipelineLayout = WebGPU.mgrPipelineLayout || new Manager;
    WebGPU.mgrRenderPipeline = WebGPU.mgrRenderPipeline || new Manager;
    WebGPU.mgrComputePipeline = WebGPU.mgrComputePipeline || new Manager;
    WebGPU.mgrShaderModule = WebGPU.mgrShaderModule || new Manager;
    WebGPU.mgrRenderBundleEncoder = WebGPU.mgrRenderBundleEncoder || new Manager;
    WebGPU.mgrRenderBundle = WebGPU.mgrRenderBundle || new Manager;
  },
  makeColor: ptr => ({
    "r": SAFE_HEAP_LOAD_D(((ptr) >> 3) * 8, 8, 0),
    "g": SAFE_HEAP_LOAD_D((((ptr) + (8)) >> 3) * 8, 8, 0),
    "b": SAFE_HEAP_LOAD_D((((ptr) + (16)) >> 3) * 8, 8, 0),
    "a": SAFE_HEAP_LOAD_D((((ptr) + (24)) >> 3) * 8, 8, 0)
  }),
  makeExtent3D: ptr => ({
    "width": SAFE_HEAP_LOAD(((ptr) >> 2) * 4, 4, 1),
    "height": SAFE_HEAP_LOAD((((ptr) + (4)) >> 2) * 4, 4, 1),
    "depthOrArrayLayers": SAFE_HEAP_LOAD((((ptr) + (8)) >> 2) * 4, 4, 1)
  }),
  makeOrigin3D: ptr => ({
    "x": SAFE_HEAP_LOAD(((ptr) >> 2) * 4, 4, 1),
    "y": SAFE_HEAP_LOAD((((ptr) + (4)) >> 2) * 4, 4, 1),
    "z": SAFE_HEAP_LOAD((((ptr) + (8)) >> 2) * 4, 4, 1)
  }),
  makeImageCopyTexture: ptr => {
    assert(ptr);
    return {
      "texture": WebGPU.mgrTexture.get(SAFE_HEAP_LOAD(((ptr) >> 2) * 4, 4, 1)),
      "mipLevel": SAFE_HEAP_LOAD((((ptr) + (4)) >> 2) * 4, 4, 1),
      "origin": WebGPU.makeOrigin3D(ptr + 8),
      "aspect": WebGPU.TextureAspect[SAFE_HEAP_LOAD((((ptr) + (20)) >> 2) * 4, 4, 1)]
    };
  },
  makeTextureDataLayout: ptr => {
    assert(ptr);
    assert(SAFE_HEAP_LOAD(((ptr) >> 2) * 4, 4, 1) === 0);
    var bytesPerRow = SAFE_HEAP_LOAD((((ptr) + (16)) >> 2) * 4, 4, 1);
    var rowsPerImage = SAFE_HEAP_LOAD((((ptr) + (20)) >> 2) * 4, 4, 1);
    return {
      "offset": SAFE_HEAP_LOAD(((((ptr + 4)) + (8)) >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD((((ptr) + (8)) >> 2) * 4, 4, 1),
      "bytesPerRow": bytesPerRow === 4294967295 ? undefined : bytesPerRow,
      "rowsPerImage": rowsPerImage === 4294967295 ? undefined : rowsPerImage
    };
  },
  makeImageCopyBuffer: ptr => {
    assert(ptr);
    var layoutPtr = ptr + 0;
    var bufferCopyView = WebGPU.makeTextureDataLayout(layoutPtr);
    bufferCopyView["buffer"] = WebGPU.mgrBuffer.get(SAFE_HEAP_LOAD((((ptr) + (24)) >> 2) * 4, 4, 1));
    return bufferCopyView;
  },
  makePipelineConstants: (constantCount, constantsPtr) => {
    if (!constantCount) return;
    var constants = {};
    for (var i = 0; i < constantCount; ++i) {
      var entryPtr = constantsPtr + 16 * i;
      var key = UTF8ToString(SAFE_HEAP_LOAD((((entryPtr) + (4)) >> 2) * 4, 4, 1));
      constants[key] = SAFE_HEAP_LOAD_D((((entryPtr) + (8)) >> 3) * 8, 8, 0);
    }
    return constants;
  },
  makePipelineLayout: layoutPtr => {
    if (!layoutPtr) return "auto";
    return WebGPU.mgrPipelineLayout.get(layoutPtr);
  },
  makeProgrammableStageDescriptor: ptr => {
    if (!ptr) return undefined;
    assert(ptr);
    assert(SAFE_HEAP_LOAD(((ptr) >> 2) * 4, 4, 1) === 0);
    var desc = {
      "module": WebGPU.mgrShaderModule.get(SAFE_HEAP_LOAD((((ptr) + (4)) >> 2) * 4, 4, 1)),
      "constants": WebGPU.makePipelineConstants(SAFE_HEAP_LOAD((((ptr) + (12)) >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((((ptr) + (16)) >> 2) * 4, 4, 1))
    };
    var entryPointPtr = SAFE_HEAP_LOAD((((ptr) + (8)) >> 2) * 4, 4, 1);
    if (entryPointPtr) desc["entryPoint"] = UTF8ToString(entryPointPtr);
    return desc;
  },
  makeComputePipelineDesc: descriptor => {
    assert(descriptor);
    assert(SAFE_HEAP_LOAD(((descriptor) >> 2) * 4, 4, 1) === 0);
    var desc = {
      "label": undefined,
      "layout": WebGPU.makePipelineLayout(SAFE_HEAP_LOAD((((descriptor) + (8)) >> 2) * 4, 4, 1)),
      "compute": WebGPU.makeProgrammableStageDescriptor(descriptor + 12)
    };
    var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
    if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
    return desc;
  },
  makeRenderPipelineDesc: descriptor => {
    assert(descriptor);
    assert(SAFE_HEAP_LOAD(((descriptor) >> 2) * 4, 4, 1) === 0);
    function makePrimitiveState(rsPtr) {
      if (!rsPtr) return undefined;
      assert(rsPtr);
      var nextInChainPtr = SAFE_HEAP_LOAD(((rsPtr) >> 2) * 4, 4, 1);
      var sType = nextInChainPtr ? SAFE_HEAP_LOAD((((nextInChainPtr) + (4)) >> 2) * 4, 4, 1) : 0;
      return {
        "topology": WebGPU.PrimitiveTopology[SAFE_HEAP_LOAD((((rsPtr) + (4)) >> 2) * 4, 4, 1)],
        "stripIndexFormat": WebGPU.IndexFormat[SAFE_HEAP_LOAD((((rsPtr) + (8)) >> 2) * 4, 4, 1)],
        "frontFace": WebGPU.FrontFace[SAFE_HEAP_LOAD((((rsPtr) + (12)) >> 2) * 4, 4, 1)],
        "cullMode": WebGPU.CullMode[SAFE_HEAP_LOAD((((rsPtr) + (16)) >> 2) * 4, 4, 1)],
        "unclippedDepth": sType === 3 && !!(SAFE_HEAP_LOAD((((nextInChainPtr) + (8)) >> 2) * 4, 4, 1))
      };
    }
    function makeBlendComponent(bdPtr) {
      if (!bdPtr) return undefined;
      return {
        "operation": WebGPU.BlendOperation[SAFE_HEAP_LOAD(((bdPtr) >> 2) * 4, 4, 1)],
        "srcFactor": WebGPU.BlendFactor[SAFE_HEAP_LOAD((((bdPtr) + (4)) >> 2) * 4, 4, 1)],
        "dstFactor": WebGPU.BlendFactor[SAFE_HEAP_LOAD((((bdPtr) + (8)) >> 2) * 4, 4, 1)]
      };
    }
    function makeBlendState(bsPtr) {
      if (!bsPtr) return undefined;
      return {
        "alpha": makeBlendComponent(bsPtr + 12),
        "color": makeBlendComponent(bsPtr + 0)
      };
    }
    function makeColorState(csPtr) {
      assert(csPtr);
      assert(SAFE_HEAP_LOAD(((csPtr) >> 2) * 4, 4, 1) === 0);
      var formatInt = SAFE_HEAP_LOAD((((csPtr) + (4)) >> 2) * 4, 4, 1);
      return formatInt === 0 ? undefined : {
        "format": WebGPU.TextureFormat[formatInt],
        "blend": makeBlendState(SAFE_HEAP_LOAD((((csPtr) + (8)) >> 2) * 4, 4, 1)),
        "writeMask": SAFE_HEAP_LOAD((((csPtr) + (16)) >> 2) * 4, 4, 1)
      };
    }
    function makeColorStates(count, csArrayPtr) {
      var states = [];
      for (var i = 0; i < count; ++i) {
        states.push(makeColorState(csArrayPtr + 24 * i));
      }
      return states;
    }
    function makeStencilStateFace(ssfPtr) {
      assert(ssfPtr);
      return {
        "compare": WebGPU.CompareFunction[SAFE_HEAP_LOAD(((ssfPtr) >> 2) * 4, 4, 1)],
        "failOp": WebGPU.StencilOperation[SAFE_HEAP_LOAD((((ssfPtr) + (4)) >> 2) * 4, 4, 1)],
        "depthFailOp": WebGPU.StencilOperation[SAFE_HEAP_LOAD((((ssfPtr) + (8)) >> 2) * 4, 4, 1)],
        "passOp": WebGPU.StencilOperation[SAFE_HEAP_LOAD((((ssfPtr) + (12)) >> 2) * 4, 4, 1)]
      };
    }
    function makeDepthStencilState(dssPtr) {
      if (!dssPtr) return undefined;
      assert(dssPtr);
      return {
        "format": WebGPU.TextureFormat[SAFE_HEAP_LOAD((((dssPtr) + (4)) >> 2) * 4, 4, 1)],
        "depthWriteEnabled": !!(SAFE_HEAP_LOAD((((dssPtr) + (8)) >> 2) * 4, 4, 1)),
        "depthCompare": WebGPU.CompareFunction[SAFE_HEAP_LOAD((((dssPtr) + (12)) >> 2) * 4, 4, 1)],
        "stencilFront": makeStencilStateFace(dssPtr + 16),
        "stencilBack": makeStencilStateFace(dssPtr + 32),
        "stencilReadMask": SAFE_HEAP_LOAD((((dssPtr) + (48)) >> 2) * 4, 4, 1),
        "stencilWriteMask": SAFE_HEAP_LOAD((((dssPtr) + (52)) >> 2) * 4, 4, 1),
        "depthBias": SAFE_HEAP_LOAD((((dssPtr) + (56)) >> 2) * 4, 4, 0),
        "depthBiasSlopeScale": SAFE_HEAP_LOAD_D((((dssPtr) + (60)) >> 2) * 4, 4, 0),
        "depthBiasClamp": SAFE_HEAP_LOAD_D((((dssPtr) + (64)) >> 2) * 4, 4, 0)
      };
    }
    function makeVertexAttribute(vaPtr) {
      assert(vaPtr);
      return {
        "format": WebGPU.VertexFormat[SAFE_HEAP_LOAD(((vaPtr) >> 2) * 4, 4, 1)],
        "offset": SAFE_HEAP_LOAD(((((vaPtr + 4)) + (8)) >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD((((vaPtr) + (8)) >> 2) * 4, 4, 1),
        "shaderLocation": SAFE_HEAP_LOAD((((vaPtr) + (16)) >> 2) * 4, 4, 1)
      };
    }
    function makeVertexAttributes(count, vaArrayPtr) {
      var vas = [];
      for (var i = 0; i < count; ++i) {
        vas.push(makeVertexAttribute(vaArrayPtr + i * 24));
      }
      return vas;
    }
    function makeVertexBuffer(vbPtr) {
      if (!vbPtr) return undefined;
      var stepModeInt = SAFE_HEAP_LOAD((((vbPtr) + (8)) >> 2) * 4, 4, 1);
      return stepModeInt === 1 ? null : {
        "arrayStride": SAFE_HEAP_LOAD((((vbPtr + 4)) >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD(((vbPtr) >> 2) * 4, 4, 1),
        "stepMode": WebGPU.VertexStepMode[stepModeInt],
        "attributes": makeVertexAttributes(SAFE_HEAP_LOAD((((vbPtr) + (12)) >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((((vbPtr) + (16)) >> 2) * 4, 4, 1))
      };
    }
    function makeVertexBuffers(count, vbArrayPtr) {
      if (!count) return undefined;
      var vbs = [];
      for (var i = 0; i < count; ++i) {
        vbs.push(makeVertexBuffer(vbArrayPtr + i * 24));
      }
      return vbs;
    }
    function makeVertexState(viPtr) {
      if (!viPtr) return undefined;
      assert(viPtr);
      assert(SAFE_HEAP_LOAD(((viPtr) >> 2) * 4, 4, 1) === 0);
      var desc = {
        "module": WebGPU.mgrShaderModule.get(SAFE_HEAP_LOAD((((viPtr) + (4)) >> 2) * 4, 4, 1)),
        "constants": WebGPU.makePipelineConstants(SAFE_HEAP_LOAD((((viPtr) + (12)) >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((((viPtr) + (16)) >> 2) * 4, 4, 1)),
        "buffers": makeVertexBuffers(SAFE_HEAP_LOAD((((viPtr) + (20)) >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((((viPtr) + (24)) >> 2) * 4, 4, 1))
      };
      var entryPointPtr = SAFE_HEAP_LOAD((((viPtr) + (8)) >> 2) * 4, 4, 1);
      if (entryPointPtr) desc["entryPoint"] = UTF8ToString(entryPointPtr);
      return desc;
    }
    function makeMultisampleState(msPtr) {
      if (!msPtr) return undefined;
      assert(msPtr);
      assert(SAFE_HEAP_LOAD(((msPtr) >> 2) * 4, 4, 1) === 0);
      return {
        "count": SAFE_HEAP_LOAD((((msPtr) + (4)) >> 2) * 4, 4, 1),
        "mask": SAFE_HEAP_LOAD((((msPtr) + (8)) >> 2) * 4, 4, 1),
        "alphaToCoverageEnabled": !!(SAFE_HEAP_LOAD((((msPtr) + (12)) >> 2) * 4, 4, 1))
      };
    }
    function makeFragmentState(fsPtr) {
      if (!fsPtr) return undefined;
      assert(fsPtr);
      assert(SAFE_HEAP_LOAD(((fsPtr) >> 2) * 4, 4, 1) === 0);
      var desc = {
        "module": WebGPU.mgrShaderModule.get(SAFE_HEAP_LOAD((((fsPtr) + (4)) >> 2) * 4, 4, 1)),
        "constants": WebGPU.makePipelineConstants(SAFE_HEAP_LOAD((((fsPtr) + (12)) >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((((fsPtr) + (16)) >> 2) * 4, 4, 1)),
        "targets": makeColorStates(SAFE_HEAP_LOAD((((fsPtr) + (20)) >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((((fsPtr) + (24)) >> 2) * 4, 4, 1))
      };
      var entryPointPtr = SAFE_HEAP_LOAD((((fsPtr) + (8)) >> 2) * 4, 4, 1);
      if (entryPointPtr) desc["entryPoint"] = UTF8ToString(entryPointPtr);
      return desc;
    }
    var desc = {
      "label": undefined,
      "layout": WebGPU.makePipelineLayout(SAFE_HEAP_LOAD((((descriptor) + (8)) >> 2) * 4, 4, 1)),
      "vertex": makeVertexState(descriptor + 12),
      "primitive": makePrimitiveState(descriptor + 40),
      "depthStencil": makeDepthStencilState(SAFE_HEAP_LOAD((((descriptor) + (60)) >> 2) * 4, 4, 1)),
      "multisample": makeMultisampleState(descriptor + 64),
      "fragment": makeFragmentState(SAFE_HEAP_LOAD((((descriptor) + (80)) >> 2) * 4, 4, 1))
    };
    var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
    if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
    return desc;
  },
  fillLimitStruct: (limits, supportedLimitsOutPtr) => {
    var limitsOutPtr = supportedLimitsOutPtr + 8;
    function setLimitValueU32(name, limitOffset) {
      var limitValue = limits[name];
      SAFE_HEAP_STORE((((limitsOutPtr) + (limitOffset)) >> 2) * 4, limitValue, 4);
    }
    function setLimitValueU64(name, limitOffset) {
      var limitValue = limits[name];
      (tempI64 = [ limitValue >>> 0, (tempDouble = limitValue, (+(Math.abs(tempDouble))) >= 1 ? (tempDouble > 0 ? (+(Math.floor((tempDouble) / 4294967296))) >>> 0 : (~~((+(Math.ceil((tempDouble - +(((~~(tempDouble))) >>> 0)) / 4294967296))))) >>> 0) : 0) ], 
      SAFE_HEAP_STORE((((limitsOutPtr) + (limitOffset)) >> 2) * 4, tempI64[0], 4), SAFE_HEAP_STORE((((limitsOutPtr) + ((limitOffset) + (4))) >> 2) * 4, tempI64[1], 4));
    }
    setLimitValueU32("maxTextureDimension1D", 0);
    setLimitValueU32("maxTextureDimension2D", 4);
    setLimitValueU32("maxTextureDimension3D", 8);
    setLimitValueU32("maxTextureArrayLayers", 12);
    setLimitValueU32("maxBindGroups", 16);
    setLimitValueU32("maxBindGroupsPlusVertexBuffers", 20);
    setLimitValueU32("maxBindingsPerBindGroup", 24);
    setLimitValueU32("maxDynamicUniformBuffersPerPipelineLayout", 28);
    setLimitValueU32("maxDynamicStorageBuffersPerPipelineLayout", 32);
    setLimitValueU32("maxSampledTexturesPerShaderStage", 36);
    setLimitValueU32("maxSamplersPerShaderStage", 40);
    setLimitValueU32("maxStorageBuffersPerShaderStage", 44);
    setLimitValueU32("maxStorageTexturesPerShaderStage", 48);
    setLimitValueU32("maxUniformBuffersPerShaderStage", 52);
    setLimitValueU32("minUniformBufferOffsetAlignment", 72);
    setLimitValueU32("minStorageBufferOffsetAlignment", 76);
    setLimitValueU64("maxUniformBufferBindingSize", 56);
    setLimitValueU64("maxStorageBufferBindingSize", 64);
    setLimitValueU32("maxVertexBuffers", 80);
    setLimitValueU32("maxBufferSize", 88);
    setLimitValueU32("maxVertexAttributes", 96);
    setLimitValueU32("maxVertexBufferArrayStride", 100);
    setLimitValueU32("maxInterStageShaderComponents", 104);
    setLimitValueU32("maxInterStageShaderVariables", 108);
    setLimitValueU32("maxColorAttachments", 112);
    setLimitValueU32("maxColorAttachmentBytesPerSample", 116);
    setLimitValueU32("maxComputeWorkgroupStorageSize", 120);
    setLimitValueU32("maxComputeInvocationsPerWorkgroup", 124);
    setLimitValueU32("maxComputeWorkgroupSizeX", 128);
    setLimitValueU32("maxComputeWorkgroupSizeY", 132);
    setLimitValueU32("maxComputeWorkgroupSizeZ", 136);
    setLimitValueU32("maxComputeWorkgroupsPerDimension", 140);
  },
  Int_BufferMapState: {
    unmapped: 1,
    pending: 2,
    mapped: 3
  },
  Int_CompilationMessageType: {
    error: 1,
    warning: 2,
    info: 3
  },
  Int_DeviceLostReason: {
    undefined: 1,
    unknown: 1,
    destroyed: 2
  },
  Int_PreferredFormat: {
    rgba8unorm: 18,
    bgra8unorm: 23
  },
  WGSLFeatureName: {
    1: "readonly_and_readwrite_storage_textures",
    2: "packed_4x8_integer_dot_product",
    3: "unrestricted_pointer_parameters",
    4: "pointer_composite_access"
  },
  AddressMode: [ , "clamp-to-edge", "repeat", "mirror-repeat" ],
  BlendFactor: [ , "zero", "one", "src", "one-minus-src", "src-alpha", "one-minus-src-alpha", "dst", "one-minus-dst", "dst-alpha", "one-minus-dst-alpha", "src-alpha-saturated", "constant", "one-minus-constant", "src1", "one-minus-src1", "src1alpha", "one-minus-src1alpha" ],
  BlendOperation: [ , "add", "subtract", "reverse-subtract", "min", "max" ],
  BufferBindingType: [ , "uniform", "storage", "read-only-storage" ],
  BufferMapState: {
    1: "unmapped",
    2: "pending",
    3: "mapped"
  },
  CompareFunction: [ , "never", "less", "equal", "less-equal", "greater", "not-equal", "greater-equal", "always" ],
  CompilationInfoRequestStatus: {
    1: "success",
    2: "instance-dropped",
    3: "error",
    4: "device-lost",
    5: "unknown"
  },
  CompositeAlphaMode: {
    1: "auto",
    2: "opaque",
    3: "premultiplied",
    4: "unpremultiplied",
    5: "inherit"
  },
  CullMode: [ , "none", "front", "back" ],
  ErrorFilter: {
    1: "validation",
    2: "out-of-memory",
    3: "internal"
  },
  FeatureName: {
    1: "depth-clip-control",
    2: "depth32float-stencil8",
    3: "timestamp-query",
    4: "texture-compression-bc",
    5: "texture-compression-etc2",
    6: "texture-compression-astc",
    7: "indirect-first-instance",
    8: "shader-f16",
    9: "rg11b10ufloat-renderable",
    10: "bgra8unorm-storage",
    11: "float32-filterable"
  },
  FilterMode: [ , "nearest", "linear" ],
  FrontFace: [ , "ccw", "cw" ],
  IndexFormat: [ , "uint16", "uint32" ],
  LoadOp: [ , "clear", "load" ],
  MipmapFilterMode: [ , "nearest", "linear" ],
  PowerPreference: [ , "low-power", "high-performance" ],
  PrimitiveTopology: [ , "point-list", "line-list", "line-strip", "triangle-list", "triangle-strip" ],
  QueryType: {
    1: "occlusion",
    2: "timestamp"
  },
  SamplerBindingType: [ , "filtering", "non-filtering", "comparison" ],
  Status: {
    1: "success",
    2: "error"
  },
  StencilOperation: [ , "keep", "zero", "replace", "invert", "increment-clamp", "decrement-clamp", "increment-wrap", "decrement-wrap" ],
  StorageTextureAccess: [ , "write-only", "read-only", "read-write" ],
  StoreOp: [ , "store", "discard" ],
  SurfaceGetCurrentTextureStatus: {
    1: "success",
    2: "timeout",
    3: "outdated",
    4: "lost",
    5: "out-of-memory",
    6: "device-lost",
    7: "error"
  },
  TextureAspect: [ , "all", "stencil-only", "depth-only" ],
  TextureDimension: [ , "1d", "2d", "3d" ],
  TextureFormat: [ , "r8unorm", "r8snorm", "r8uint", "r8sint", "r16uint", "r16sint", "r16float", "rg8unorm", "rg8snorm", "rg8uint", "rg8sint", "r32float", "r32uint", "r32sint", "rg16uint", "rg16sint", "rg16float", "rgba8unorm", "rgba8unorm-srgb", "rgba8snorm", "rgba8uint", "rgba8sint", "bgra8unorm", "bgra8unorm-srgb", "rgb10a2uint", "rgb10a2unorm", "rg11b10ufloat", "rgb9e5ufloat", "rg32float", "rg32uint", "rg32sint", "rgba16uint", "rgba16sint", "rgba16float", "rgba32float", "rgba32uint", "rgba32sint", "stencil8", "depth16unorm", "depth24plus", "depth24plus-stencil8", "depth32float", "depth32float-stencil8", "bc1-rgba-unorm", "bc1-rgba-unorm-srgb", "bc2-rgba-unorm", "bc2-rgba-unorm-srgb", "bc3-rgba-unorm", "bc3-rgba-unorm-srgb", "bc4-r-unorm", "bc4-r-snorm", "bc5-rg-unorm", "bc5-rg-snorm", "bc6h-rgb-ufloat", "bc6h-rgb-float", "bc7-rgba-unorm", "bc7-rgba-unorm-srgb", "etc2-rgb8unorm", "etc2-rgb8unorm-srgb", "etc2-rgb8a1unorm", "etc2-rgb8a1unorm-srgb", "etc2-rgba8unorm", "etc2-rgba8unorm-srgb", "eac-r11unorm", "eac-r11snorm", "eac-rg11unorm", "eac-rg11snorm", "astc-4x4-unorm", "astc-4x4-unorm-srgb", "astc-5x4-unorm", "astc-5x4-unorm-srgb", "astc-5x5-unorm", "astc-5x5-unorm-srgb", "astc-6x5-unorm", "astc-6x5-unorm-srgb", "astc-6x6-unorm", "astc-6x6-unorm-srgb", "astc-8x5-unorm", "astc-8x5-unorm-srgb", "astc-8x6-unorm", "astc-8x6-unorm-srgb", "astc-8x8-unorm", "astc-8x8-unorm-srgb", "astc-10x5-unorm", "astc-10x5-unorm-srgb", "astc-10x6-unorm", "astc-10x6-unorm-srgb", "astc-10x8-unorm", "astc-10x8-unorm-srgb", "astc-10x10-unorm", "astc-10x10-unorm-srgb", "astc-12x10-unorm", "astc-12x10-unorm-srgb", "astc-12x12-unorm", "astc-12x12-unorm-srgb" ],
  TextureSampleType: [ , "float", "unfilterable-float", "depth", "sint", "uint" ],
  TextureViewDimension: [ , "1d", "2d", "2d-array", "cube", "cube-array", "3d" ],
  VertexFormat: {
    1: "uint8x2",
    2: "uint8x4",
    3: "sint8x2",
    4: "sint8x4",
    5: "unorm8x2",
    6: "unorm8x4",
    7: "snorm8x2",
    8: "snorm8x4",
    9: "uint16x2",
    10: "uint16x4",
    11: "sint16x2",
    12: "sint16x4",
    13: "unorm16x2",
    14: "unorm16x4",
    15: "snorm16x2",
    16: "snorm16x4",
    17: "float16x2",
    18: "float16x4",
    19: "float32",
    20: "float32x2",
    21: "float32x3",
    22: "float32x4",
    23: "uint32",
    24: "uint32x2",
    25: "uint32x3",
    26: "uint32x4",
    27: "sint32",
    28: "sint32x2",
    29: "sint32x3",
    30: "sint32x4",
    31: "unorm10-10-10-2"
  },
  VertexStepMode: [ , "vertex-buffer-not-used", "vertex", "instance" ],
  FeatureNameString2Enum: {
    "depth-clip-control": "1",
    "depth32float-stencil8": "2",
    "timestamp-query": "3",
    "texture-compression-bc": "4",
    "texture-compression-etc2": "5",
    "texture-compression-astc": "6",
    "indirect-first-instance": "7",
    "shader-f16": "8",
    "rg11b10ufloat-renderable": "9",
    "bgra8unorm-storage": "10",
    "float32-filterable": "11"
  }
};

var _wgpuAdapterRelease = id => WebGPU.mgrAdapter.release(id);

var _wgpuAdapterRequestDevice = (adapterId, descriptor, callback, userdata) => {
  var adapter = WebGPU.mgrAdapter.get(adapterId);
  var desc = {};
  if (descriptor) {
    assert(descriptor);
    assert(SAFE_HEAP_LOAD(((descriptor) >> 2) * 4, 4, 1) === 0);
    var requiredFeatureCount = SAFE_HEAP_LOAD((((descriptor) + (8)) >> 2) * 4, 4, 1);
    if (requiredFeatureCount) {
      var requiredFeaturesPtr = SAFE_HEAP_LOAD((((descriptor) + (12)) >> 2) * 4, 4, 1);
      desc["requiredFeatures"] = Array.from(HEAP32.subarray((((requiredFeaturesPtr) >> 2)), ((requiredFeaturesPtr + requiredFeatureCount * 4) >> 2)), feature => WebGPU.FeatureName[feature]);
    }
    var requiredLimitsPtr = SAFE_HEAP_LOAD((((descriptor) + (16)) >> 2) * 4, 4, 1);
    if (requiredLimitsPtr) {
      assert(requiredLimitsPtr);
      assert(SAFE_HEAP_LOAD(((requiredLimitsPtr) >> 2) * 4, 4, 1) === 0);
      var limitsPtr = requiredLimitsPtr + 8;
      var requiredLimits = {};
      function setLimitU32IfDefined(name, limitOffset) {
        var ptr = limitsPtr + limitOffset;
        var value = SAFE_HEAP_LOAD(((ptr) >> 2) * 4, 4, 1);
        if (value != 4294967295) {
          requiredLimits[name] = value;
        }
      }
      function setLimitU64IfDefined(name, limitOffset) {
        var ptr = limitsPtr + limitOffset;
        var limitPart1 = SAFE_HEAP_LOAD(((ptr) >> 2) * 4, 4, 1);
        var limitPart2 = SAFE_HEAP_LOAD((((ptr) + (4)) >> 2) * 4, 4, 1);
        if (limitPart1 != 4294967295 || limitPart2 != 4294967295) {
          requiredLimits[name] = SAFE_HEAP_LOAD((((ptr + 4)) >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD(((ptr) >> 2) * 4, 4, 1);
        }
      }
      setLimitU32IfDefined("maxTextureDimension1D", 0);
      setLimitU32IfDefined("maxTextureDimension2D", 4);
      setLimitU32IfDefined("maxTextureDimension3D", 8);
      setLimitU32IfDefined("maxTextureArrayLayers", 12);
      setLimitU32IfDefined("maxBindGroups", 16);
      setLimitU32IfDefined("maxBindGroupsPlusVertexBuffers", 20);
      setLimitU32IfDefined("maxDynamicUniformBuffersPerPipelineLayout", 28);
      setLimitU32IfDefined("maxDynamicStorageBuffersPerPipelineLayout", 32);
      setLimitU32IfDefined("maxSampledTexturesPerShaderStage", 36);
      setLimitU32IfDefined("maxSamplersPerShaderStage", 40);
      setLimitU32IfDefined("maxStorageBuffersPerShaderStage", 44);
      setLimitU32IfDefined("maxStorageTexturesPerShaderStage", 48);
      setLimitU32IfDefined("maxUniformBuffersPerShaderStage", 52);
      setLimitU32IfDefined("minUniformBufferOffsetAlignment", 72);
      setLimitU32IfDefined("minStorageBufferOffsetAlignment", 76);
      setLimitU64IfDefined("maxUniformBufferBindingSize", 56);
      setLimitU64IfDefined("maxStorageBufferBindingSize", 64);
      setLimitU32IfDefined("maxVertexBuffers", 80);
      setLimitU32IfDefined("maxBufferSize", 88);
      setLimitU32IfDefined("maxVertexAttributes", 96);
      setLimitU32IfDefined("maxVertexBufferArrayStride", 100);
      setLimitU32IfDefined("maxInterStageShaderComponents", 104);
      setLimitU32IfDefined("maxInterStageShaderVariables", 108);
      setLimitU32IfDefined("maxColorAttachments", 112);
      setLimitU32IfDefined("maxColorAttachmentBytesPerSample", 116);
      setLimitU32IfDefined("maxComputeWorkgroupStorageSize", 120);
      setLimitU32IfDefined("maxComputeInvocationsPerWorkgroup", 124);
      setLimitU32IfDefined("maxComputeWorkgroupSizeX", 128);
      setLimitU32IfDefined("maxComputeWorkgroupSizeY", 132);
      setLimitU32IfDefined("maxComputeWorkgroupSizeZ", 136);
      setLimitU32IfDefined("maxComputeWorkgroupsPerDimension", 140);
      desc["requiredLimits"] = requiredLimits;
    }
    var defaultQueuePtr = SAFE_HEAP_LOAD((((descriptor) + (20)) >> 2) * 4, 4, 1);
    if (defaultQueuePtr) {
      var defaultQueueDesc = {};
      var labelPtr = SAFE_HEAP_LOAD((((defaultQueuePtr) + (4)) >> 2) * 4, 4, 1);
      if (labelPtr) defaultQueueDesc["label"] = UTF8ToString(labelPtr);
      desc["defaultQueue"] = defaultQueueDesc;
    }
    var deviceLostCallbackPtr = SAFE_HEAP_LOAD((((descriptor) + (36)) >> 2) * 4, 4, 1);
    var deviceLostUserdataPtr = SAFE_HEAP_LOAD((((descriptor) + (40)) >> 2) * 4, 4, 1);
    var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
    if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
  }
  adapter.requestDevice(desc).then(device => {
    callUserCallback(() => {
      var deviceWrapper = {
        queueId: WebGPU.mgrQueue.create(device.queue)
      };
      var deviceId = WebGPU.mgrDevice.create(device, deviceWrapper);
      if (deviceLostCallbackPtr) {
        device.lost.then(info => {
          callUserCallback(() => WebGPU.errorCallback(deviceLostCallbackPtr, WebGPU.Int_DeviceLostReason[info.reason], info.message, deviceLostUserdataPtr));
        });
      }
      getWasmTableEntry(callback)(1, deviceId, 0, userdata);
    });
  }, function(ex) {
    callUserCallback(() => {
      var sp = stackSave();
      var messagePtr = stringToUTF8OnStack(ex.message);
      getWasmTableEntry(callback)(3, 0, messagePtr, userdata);
      stackRestore(sp);
    });
  });
};

var _wgpuBindGroupLayoutAddRef = id => WebGPU.mgrBindGroupLayout.addRef(id);

var _wgpuBindGroupLayoutRelease = id => WebGPU.mgrBindGroupLayout.release(id);

var _wgpuBindGroupRelease = id => WebGPU.mgrBindGroup.release(id);

var _wgpuBufferAddRef = id => WebGPU.mgrBuffer.addRef(id);

var _wgpuBufferGetConstMappedRange = (bufferId, offset, size) => {
  var bufferWrapper = WebGPU.mgrBuffer.objects[bufferId];
  assert(typeof bufferWrapper != "undefined");
  if (size === 0) warnOnce("getMappedRange size=0 no longer means WGPU_WHOLE_MAP_SIZE");
  if (size == -1) size = undefined;
  var mapped;
  try {
    mapped = bufferWrapper.object.getMappedRange(offset, size);
  } catch (ex) {
    err(`wgpuBufferGetConstMappedRange(${offset}, ${size}) failed: ${ex}`);
    return 0;
  }
  var data = _memalign(16, mapped.byteLength);
  HEAPU8.set(new Uint8Array(mapped), data);
  bufferWrapper.onUnmap.push(() => _free(data));
  return data;
};

var _wgpuBufferGetMappedRange = (bufferId, offset, size) => {
  var bufferWrapper = WebGPU.mgrBuffer.objects[bufferId];
  assert(typeof bufferWrapper != "undefined");
  if (size === 0) warnOnce("getMappedRange size=0 no longer means WGPU_WHOLE_MAP_SIZE");
  if (size == -1) size = undefined;
  if (bufferWrapper.mapMode !== 2) {
    abort("GetMappedRange called, but buffer not mapped for writing");
    return 0;
  }
  var mapped;
  try {
    mapped = bufferWrapper.object.getMappedRange(offset, size);
  } catch (ex) {
    err(`wgpuBufferGetMappedRange(${offset}, ${size}) failed: ${ex}`);
    return 0;
  }
  var data = _memalign(16, mapped.byteLength);
  HEAPU8.fill(0, data, mapped.byteLength);
  bufferWrapper.onUnmap.push(() => {
    new Uint8Array(mapped).set(HEAPU8.subarray(data, data + mapped.byteLength));
    _free(data);
  });
  return data;
};

var _wgpuBufferMapAsync = (bufferId, mode, offset, size, callback, userdata) => {
  var bufferWrapper = WebGPU.mgrBuffer.objects[bufferId];
  assert(typeof bufferWrapper != "undefined");
  bufferWrapper.mapMode = mode;
  bufferWrapper.onUnmap = [];
  var buffer = bufferWrapper.object;
  if (size == -1) size = undefined;
  buffer.mapAsync(mode, offset, size).then(() => {
    callUserCallback(() => {
      getWasmTableEntry(callback)(1, userdata);
    });
  }, () => {
    callUserCallback(() => {
      getWasmTableEntry(callback)(3, userdata);
    });
  });
};

var _wgpuBufferRelease = id => WebGPU.mgrBuffer.release(id);

var _wgpuBufferUnmap = bufferId => {
  var bufferWrapper = WebGPU.mgrBuffer.objects[bufferId];
  assert(typeof bufferWrapper != "undefined");
  if (!bufferWrapper.onUnmap) {
    return;
  }
  for (var i = 0; i < bufferWrapper.onUnmap.length; ++i) {
    bufferWrapper.onUnmap[i]();
  }
  bufferWrapper.onUnmap = undefined;
  bufferWrapper.object.unmap();
};

var _wgpuCommandBufferRelease = id => WebGPU.mgrCommandBuffer.release(id);

var _wgpuCommandEncoderBeginRenderPass = (encoderId, descriptor) => {
  assert(descriptor);
  function makeColorAttachment(caPtr) {
    var viewPtr = SAFE_HEAP_LOAD((((caPtr) + (4)) >> 2) * 4, 4, 1);
    if (viewPtr === 0) {
      return undefined;
    }
    var depthSlice = SAFE_HEAP_LOAD((((caPtr) + (8)) >> 2) * 4, 4, 0);
    if (depthSlice == -1) depthSlice = undefined;
    var loadOpInt = SAFE_HEAP_LOAD((((caPtr) + (16)) >> 2) * 4, 4, 1);
    assert(loadOpInt !== 0);
    var storeOpInt = SAFE_HEAP_LOAD((((caPtr) + (20)) >> 2) * 4, 4, 1);
    assert(storeOpInt !== 0);
    var clearValue = WebGPU.makeColor(caPtr + 24);
    return {
      "view": WebGPU.mgrTextureView.get(viewPtr),
      "depthSlice": depthSlice,
      "resolveTarget": WebGPU.mgrTextureView.get(SAFE_HEAP_LOAD((((caPtr) + (12)) >> 2) * 4, 4, 1)),
      "clearValue": clearValue,
      "loadOp": WebGPU.LoadOp[loadOpInt],
      "storeOp": WebGPU.StoreOp[storeOpInt]
    };
  }
  function makeColorAttachments(count, caPtr) {
    var attachments = [];
    for (var i = 0; i < count; ++i) {
      attachments.push(makeColorAttachment(caPtr + 56 * i));
    }
    return attachments;
  }
  function makeDepthStencilAttachment(dsaPtr) {
    if (dsaPtr === 0) return undefined;
    return {
      "view": WebGPU.mgrTextureView.get(SAFE_HEAP_LOAD(((dsaPtr) >> 2) * 4, 4, 1)),
      "depthClearValue": SAFE_HEAP_LOAD_D((((dsaPtr) + (12)) >> 2) * 4, 4, 0),
      "depthLoadOp": WebGPU.LoadOp[SAFE_HEAP_LOAD((((dsaPtr) + (4)) >> 2) * 4, 4, 1)],
      "depthStoreOp": WebGPU.StoreOp[SAFE_HEAP_LOAD((((dsaPtr) + (8)) >> 2) * 4, 4, 1)],
      "depthReadOnly": !!(SAFE_HEAP_LOAD((((dsaPtr) + (16)) >> 2) * 4, 4, 1)),
      "stencilClearValue": SAFE_HEAP_LOAD((((dsaPtr) + (28)) >> 2) * 4, 4, 1),
      "stencilLoadOp": WebGPU.LoadOp[SAFE_HEAP_LOAD((((dsaPtr) + (20)) >> 2) * 4, 4, 1)],
      "stencilStoreOp": WebGPU.StoreOp[SAFE_HEAP_LOAD((((dsaPtr) + (24)) >> 2) * 4, 4, 1)],
      "stencilReadOnly": !!(SAFE_HEAP_LOAD((((dsaPtr) + (32)) >> 2) * 4, 4, 1))
    };
  }
  function makeRenderPassTimestampWrites(twPtr) {
    if (twPtr === 0) return undefined;
    return {
      "querySet": WebGPU.mgrQuerySet.get(SAFE_HEAP_LOAD(((twPtr) >> 2) * 4, 4, 1)),
      "beginningOfPassWriteIndex": SAFE_HEAP_LOAD((((twPtr) + (4)) >> 2) * 4, 4, 1),
      "endOfPassWriteIndex": SAFE_HEAP_LOAD((((twPtr) + (8)) >> 2) * 4, 4, 1)
    };
  }
  function makeRenderPassDescriptor(descriptor) {
    assert(descriptor);
    var nextInChainPtr = SAFE_HEAP_LOAD(((descriptor) >> 2) * 4, 4, 1);
    var maxDrawCount = undefined;
    if (nextInChainPtr !== 0) {
      var sType = SAFE_HEAP_LOAD((((nextInChainPtr) + (4)) >> 2) * 4, 4, 1);
      assert(sType === 4);
      assert(0 === SAFE_HEAP_LOAD(((nextInChainPtr) >> 2) * 4, 4, 1));
      var renderPassDescriptorMaxDrawCount = nextInChainPtr;
      assert(renderPassDescriptorMaxDrawCount);
      assert(SAFE_HEAP_LOAD(((renderPassDescriptorMaxDrawCount) >> 2) * 4, 4, 1) === 0);
      maxDrawCount = SAFE_HEAP_LOAD(((((renderPassDescriptorMaxDrawCount + 4)) + (8)) >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD((((renderPassDescriptorMaxDrawCount) + (8)) >> 2) * 4, 4, 1);
    }
    var desc = {
      "label": undefined,
      "colorAttachments": makeColorAttachments(SAFE_HEAP_LOAD((((descriptor) + (8)) >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((((descriptor) + (12)) >> 2) * 4, 4, 1)),
      "depthStencilAttachment": makeDepthStencilAttachment(SAFE_HEAP_LOAD((((descriptor) + (16)) >> 2) * 4, 4, 1)),
      "occlusionQuerySet": WebGPU.mgrQuerySet.get(SAFE_HEAP_LOAD((((descriptor) + (20)) >> 2) * 4, 4, 1)),
      "timestampWrites": makeRenderPassTimestampWrites(SAFE_HEAP_LOAD((((descriptor) + (24)) >> 2) * 4, 4, 1)),
      "maxDrawCount": maxDrawCount
    };
    var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
    if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
    return desc;
  }
  var desc = makeRenderPassDescriptor(descriptor);
  var commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
  return WebGPU.mgrRenderPassEncoder.create(commandEncoder.beginRenderPass(desc));
};

function _wgpuCommandEncoderCopyBufferToBuffer(encoderId, srcId, srcOffset_low, srcOffset_high, dstId, dstOffset_low, dstOffset_high, size_low, size_high) {
  var srcOffset = convertI32PairToI53Checked(srcOffset_low, srcOffset_high);
  var dstOffset = convertI32PairToI53Checked(dstOffset_low, dstOffset_high);
  var size = convertI32PairToI53Checked(size_low, size_high);
  var commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
  var src = WebGPU.mgrBuffer.get(srcId);
  var dst = WebGPU.mgrBuffer.get(dstId);
  commandEncoder.copyBufferToBuffer(src, srcOffset, dst, dstOffset, size);
}

var _wgpuCommandEncoderCopyTextureToBuffer = (encoderId, srcPtr, dstPtr, copySizePtr) => {
  var commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
  var copySize = WebGPU.makeExtent3D(copySizePtr);
  commandEncoder.copyTextureToBuffer(WebGPU.makeImageCopyTexture(srcPtr), WebGPU.makeImageCopyBuffer(dstPtr), copySize);
};

var _wgpuCommandEncoderFinish = (encoderId, descriptor) => {
  var commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
  return WebGPU.mgrCommandBuffer.create(commandEncoder.finish());
};

var _wgpuCommandEncoderRelease = id => WebGPU.mgrCommandEncoder.release(id);

var _wgpuDeviceAddRef = id => WebGPU.mgrDevice.addRef(id);

var readI53FromI64 = ptr => SAFE_HEAP_LOAD(((ptr) >> 2) * 4, 4, 1) + SAFE_HEAP_LOAD((((ptr) + (4)) >> 2) * 4, 4, 0) * 4294967296;

var _wgpuDeviceCreateBindGroup = (deviceId, descriptor) => {
  assert(descriptor);
  assert(SAFE_HEAP_LOAD(((descriptor) >> 2) * 4, 4, 1) === 0);
  function makeEntry(entryPtr) {
    assert(entryPtr);
    var bufferId = SAFE_HEAP_LOAD((((entryPtr) + (8)) >> 2) * 4, 4, 1);
    var samplerId = SAFE_HEAP_LOAD((((entryPtr) + (32)) >> 2) * 4, 4, 1);
    var textureViewId = SAFE_HEAP_LOAD((((entryPtr) + (36)) >> 2) * 4, 4, 1);
    assert((bufferId !== 0) + (samplerId !== 0) + (textureViewId !== 0) === 1);
    var binding = SAFE_HEAP_LOAD((((entryPtr) + (4)) >> 2) * 4, 4, 1);
    if (bufferId) {
      var size = readI53FromI64((entryPtr) + (24));
      if (size == -1) size = undefined;
      return {
        "binding": binding,
        "resource": {
          "buffer": WebGPU.mgrBuffer.get(bufferId),
          "offset": SAFE_HEAP_LOAD(((((entryPtr + 4)) + (16)) >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD((((entryPtr) + (16)) >> 2) * 4, 4, 1),
          "size": size
        }
      };
    } else if (samplerId) {
      return {
        "binding": binding,
        "resource": WebGPU.mgrSampler.get(samplerId)
      };
    } else {
      return {
        "binding": binding,
        "resource": WebGPU.mgrTextureView.get(textureViewId)
      };
    }
  }
  function makeEntries(count, entriesPtrs) {
    var entries = [];
    for (var i = 0; i < count; ++i) {
      entries.push(makeEntry(entriesPtrs + 40 * i));
    }
    return entries;
  }
  var desc = {
    "label": undefined,
    "layout": WebGPU.mgrBindGroupLayout.get(SAFE_HEAP_LOAD((((descriptor) + (8)) >> 2) * 4, 4, 1)),
    "entries": makeEntries(SAFE_HEAP_LOAD((((descriptor) + (12)) >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((((descriptor) + (16)) >> 2) * 4, 4, 1))
  };
  var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
  if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
  var device = WebGPU.mgrDevice.get(deviceId);
  return WebGPU.mgrBindGroup.create(device.createBindGroup(desc));
};

var _wgpuDeviceCreateBindGroupLayout = (deviceId, descriptor) => {
  assert(descriptor);
  assert(SAFE_HEAP_LOAD(((descriptor) >> 2) * 4, 4, 1) === 0);
  function makeBufferEntry(entryPtr) {
    assert(entryPtr);
    var typeInt = SAFE_HEAP_LOAD((((entryPtr) + (4)) >> 2) * 4, 4, 1);
    if (!typeInt) return undefined;
    return {
      "type": WebGPU.BufferBindingType[typeInt],
      "hasDynamicOffset": !!(SAFE_HEAP_LOAD((((entryPtr) + (8)) >> 2) * 4, 4, 1)),
      "minBindingSize": SAFE_HEAP_LOAD(((((entryPtr + 4)) + (16)) >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD((((entryPtr) + (16)) >> 2) * 4, 4, 1)
    };
  }
  function makeSamplerEntry(entryPtr) {
    assert(entryPtr);
    var typeInt = SAFE_HEAP_LOAD((((entryPtr) + (4)) >> 2) * 4, 4, 1);
    if (!typeInt) return undefined;
    return {
      "type": WebGPU.SamplerBindingType[typeInt]
    };
  }
  function makeTextureEntry(entryPtr) {
    assert(entryPtr);
    var sampleTypeInt = SAFE_HEAP_LOAD((((entryPtr) + (4)) >> 2) * 4, 4, 1);
    if (!sampleTypeInt) return undefined;
    return {
      "sampleType": WebGPU.TextureSampleType[sampleTypeInt],
      "viewDimension": WebGPU.TextureViewDimension[SAFE_HEAP_LOAD((((entryPtr) + (8)) >> 2) * 4, 4, 1)],
      "multisampled": !!(SAFE_HEAP_LOAD((((entryPtr) + (12)) >> 2) * 4, 4, 1))
    };
  }
  function makeStorageTextureEntry(entryPtr) {
    assert(entryPtr);
    var accessInt = SAFE_HEAP_LOAD((((entryPtr) + (4)) >> 2) * 4, 4, 1);
    if (!accessInt) return undefined;
    return {
      "access": WebGPU.StorageTextureAccess[accessInt],
      "format": WebGPU.TextureFormat[SAFE_HEAP_LOAD((((entryPtr) + (8)) >> 2) * 4, 4, 1)],
      "viewDimension": WebGPU.TextureViewDimension[SAFE_HEAP_LOAD((((entryPtr) + (12)) >> 2) * 4, 4, 1)]
    };
  }
  function makeEntry(entryPtr) {
    assert(entryPtr);
    return {
      "binding": SAFE_HEAP_LOAD((((entryPtr) + (4)) >> 2) * 4, 4, 1),
      "visibility": SAFE_HEAP_LOAD((((entryPtr) + (8)) >> 2) * 4, 4, 1),
      "buffer": makeBufferEntry(entryPtr + 16),
      "sampler": makeSamplerEntry(entryPtr + 40),
      "texture": makeTextureEntry(entryPtr + 48),
      "storageTexture": makeStorageTextureEntry(entryPtr + 64)
    };
  }
  function makeEntries(count, entriesPtrs) {
    var entries = [];
    for (var i = 0; i < count; ++i) {
      entries.push(makeEntry(entriesPtrs + 80 * i));
    }
    return entries;
  }
  var desc = {
    "entries": makeEntries(SAFE_HEAP_LOAD((((descriptor) + (8)) >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((((descriptor) + (12)) >> 2) * 4, 4, 1))
  };
  var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
  if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
  var device = WebGPU.mgrDevice.get(deviceId);
  return WebGPU.mgrBindGroupLayout.create(device.createBindGroupLayout(desc));
};

var _wgpuDeviceCreateBuffer = (deviceId, descriptor) => {
  assert(descriptor);
  assert(SAFE_HEAP_LOAD(((descriptor) >> 2) * 4, 4, 1) === 0);
  var mappedAtCreation = !!(SAFE_HEAP_LOAD((((descriptor) + (24)) >> 2) * 4, 4, 1));
  var desc = {
    "label": undefined,
    "usage": SAFE_HEAP_LOAD((((descriptor) + (8)) >> 2) * 4, 4, 1),
    "size": SAFE_HEAP_LOAD(((((descriptor + 4)) + (16)) >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD((((descriptor) + (16)) >> 2) * 4, 4, 1),
    "mappedAtCreation": mappedAtCreation
  };
  var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
  if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
  var device = WebGPU.mgrDevice.get(deviceId);
  var bufferWrapper = {};
  var id = WebGPU.mgrBuffer.create(device.createBuffer(desc), bufferWrapper);
  if (mappedAtCreation) {
    bufferWrapper.mapMode = 2;
    bufferWrapper.onUnmap = [];
  }
  return id;
};

var _wgpuDeviceCreateCommandEncoder = (deviceId, descriptor) => {
  var desc;
  if (descriptor) {
    assert(descriptor);
    assert(SAFE_HEAP_LOAD(((descriptor) >> 2) * 4, 4, 1) === 0);
    desc = {
      "label": undefined
    };
    var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
    if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
  }
  var device = WebGPU.mgrDevice.get(deviceId);
  return WebGPU.mgrCommandEncoder.create(device.createCommandEncoder(desc));
};

var _wgpuDeviceCreatePipelineLayout = (deviceId, descriptor) => {
  assert(descriptor);
  assert(SAFE_HEAP_LOAD(((descriptor) >> 2) * 4, 4, 1) === 0);
  var bglCount = SAFE_HEAP_LOAD((((descriptor) + (8)) >> 2) * 4, 4, 1);
  var bglPtr = SAFE_HEAP_LOAD((((descriptor) + (12)) >> 2) * 4, 4, 1);
  var bgls = [];
  for (var i = 0; i < bglCount; ++i) {
    bgls.push(WebGPU.mgrBindGroupLayout.get(SAFE_HEAP_LOAD((((bglPtr) + (4 * i)) >> 2) * 4, 4, 1)));
  }
  var desc = {
    "label": undefined,
    "bindGroupLayouts": bgls
  };
  var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
  if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
  var device = WebGPU.mgrDevice.get(deviceId);
  return WebGPU.mgrPipelineLayout.create(device.createPipelineLayout(desc));
};

var _wgpuDeviceCreateRenderPipeline = (deviceId, descriptor) => {
  var desc = WebGPU.makeRenderPipelineDesc(descriptor);
  var device = WebGPU.mgrDevice.get(deviceId);
  return WebGPU.mgrRenderPipeline.create(device.createRenderPipeline(desc));
};

var _wgpuDeviceCreateShaderModule = (deviceId, descriptor) => {
  assert(descriptor);
  var nextInChainPtr = SAFE_HEAP_LOAD(((descriptor) >> 2) * 4, 4, 1);
  assert(nextInChainPtr !== 0);
  var sType = SAFE_HEAP_LOAD((((nextInChainPtr) + (4)) >> 2) * 4, 4, 1);
  var desc = {
    "label": undefined,
    "code": ""
  };
  var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
  if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
  switch (sType) {
   case 1:
    {
      var count = SAFE_HEAP_LOAD((((nextInChainPtr) + (8)) >> 2) * 4, 4, 1);
      var start = SAFE_HEAP_LOAD((((nextInChainPtr) + (12)) >> 2) * 4, 4, 1);
      var offset = ((start) >> 2);
      desc["code"] = HEAPU32.subarray(offset, offset + count);
      break;
    }

   case 2:
    {
      var sourcePtr = SAFE_HEAP_LOAD((((nextInChainPtr) + (8)) >> 2) * 4, 4, 1);
      if (sourcePtr) {
        desc["code"] = UTF8ToString(sourcePtr);
      }
      break;
    }

   default:
    abort("unrecognized ShaderModule sType");
  }
  var device = WebGPU.mgrDevice.get(deviceId);
  return WebGPU.mgrShaderModule.create(device.createShaderModule(desc));
};

var _wgpuDeviceCreateSwapChain = (deviceId, surfaceId, descriptor) => {
  assert(descriptor);
  assert(SAFE_HEAP_LOAD(((descriptor) >> 2) * 4, 4, 1) === 0);
  var device = WebGPU.mgrDevice.get(deviceId);
  var context = WebGPU.mgrSurface.get(surfaceId);
  assert(1 === SAFE_HEAP_LOAD((((descriptor) + (28)) >> 2) * 4, 4, 1));
  var canvasSize = [ SAFE_HEAP_LOAD((((descriptor) + (20)) >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((((descriptor) + (24)) >> 2) * 4, 4, 1) ];
  if (canvasSize[0] !== 0) {
    context["canvas"]["width"] = canvasSize[0];
  }
  if (canvasSize[1] !== 0) {
    context["canvas"]["height"] = canvasSize[1];
  }
  var configuration = {
    "device": device,
    "format": WebGPU.TextureFormat[SAFE_HEAP_LOAD((((descriptor) + (16)) >> 2) * 4, 4, 1)],
    "usage": SAFE_HEAP_LOAD((((descriptor) + (8)) >> 2) * 4, 4, 1),
    "alphaMode": "opaque"
  };
  context.configure(configuration);
  return WebGPU.mgrSwapChain.create(context);
};

var _wgpuDeviceCreateTexture = (deviceId, descriptor) => {
  assert(descriptor);
  assert(SAFE_HEAP_LOAD(((descriptor) >> 2) * 4, 4, 1) === 0);
  var desc = {
    "label": undefined,
    "size": WebGPU.makeExtent3D(descriptor + 20),
    "mipLevelCount": SAFE_HEAP_LOAD((((descriptor) + (36)) >> 2) * 4, 4, 1),
    "sampleCount": SAFE_HEAP_LOAD((((descriptor) + (40)) >> 2) * 4, 4, 1),
    "dimension": WebGPU.TextureDimension[SAFE_HEAP_LOAD((((descriptor) + (16)) >> 2) * 4, 4, 1)],
    "format": WebGPU.TextureFormat[SAFE_HEAP_LOAD((((descriptor) + (32)) >> 2) * 4, 4, 1)],
    "usage": SAFE_HEAP_LOAD((((descriptor) + (8)) >> 2) * 4, 4, 1)
  };
  var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
  if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
  var viewFormatCount = SAFE_HEAP_LOAD((((descriptor) + (44)) >> 2) * 4, 4, 1);
  if (viewFormatCount) {
    var viewFormatsPtr = SAFE_HEAP_LOAD((((descriptor) + (48)) >> 2) * 4, 4, 1);
    desc["viewFormats"] = Array.from(HEAP32.subarray((((viewFormatsPtr) >> 2)), ((viewFormatsPtr + viewFormatCount * 4) >> 2)), function(format) {
      return WebGPU.TextureFormat[format];
    });
  }
  var device = WebGPU.mgrDevice.get(deviceId);
  return WebGPU.mgrTexture.create(device.createTexture(desc));
};

var _wgpuDeviceGetQueue = deviceId => {
  var queueId = WebGPU.mgrDevice.objects[deviceId].queueId;
  assert(queueId, "wgpuDeviceGetQueue: queue was missing or null");
  WebGPU.mgrQueue.addRef(queueId);
  return queueId;
};

var _wgpuDeviceRelease = id => WebGPU.mgrDevice.release(id);

var _wgpuDeviceSetUncapturedErrorCallback = (deviceId, callback, userdata) => {
  var device = WebGPU.mgrDevice.get(deviceId);
  device.onuncapturederror = function(ev) {
    callUserCallback(() => {
      var Validation = 1;
      var OutOfMemory = 2;
      var type;
      assert(typeof GPUValidationError != "undefined");
      assert(typeof GPUOutOfMemoryError != "undefined");
      if (ev.error instanceof GPUValidationError) type = Validation; else if (ev.error instanceof GPUOutOfMemoryError) type = OutOfMemory;
      WebGPU.errorCallback(callback, type, ev.error.message, userdata);
    });
  };
};

var maybeCStringToJsString = cString => cString > 2 ? UTF8ToString(cString) : cString;

/** @type {Object} */ var specialHTMLTargets = [ 0, typeof document != "undefined" ? document : 0, typeof window != "undefined" ? window : 0 ];

/** @suppress {duplicate } */ var findEventTarget = target => {
  target = maybeCStringToJsString(target);
  var domElement = specialHTMLTargets[target] || (typeof document != "undefined" ? document.querySelector(target) : undefined);
  return domElement;
};

var findCanvasEventTarget = findEventTarget;

var _wgpuInstanceCreateSurface = (instanceId, descriptor) => {
  assert(descriptor);
  assert(instanceId === 1, "WGPUInstance must be created by wgpuCreateInstance");
  var nextInChainPtr = SAFE_HEAP_LOAD(((descriptor) >> 2) * 4, 4, 1);
  assert(nextInChainPtr !== 0);
  assert(262144 === SAFE_HEAP_LOAD((((nextInChainPtr) + (4)) >> 2) * 4, 4, 1));
  var descriptorFromCanvasHTMLSelector = nextInChainPtr;
  assert(descriptorFromCanvasHTMLSelector);
  assert(SAFE_HEAP_LOAD(((descriptorFromCanvasHTMLSelector) >> 2) * 4, 4, 1) === 0);
  var selectorPtr = SAFE_HEAP_LOAD((((descriptorFromCanvasHTMLSelector) + (8)) >> 2) * 4, 4, 1);
  assert(selectorPtr);
  var canvas = findCanvasEventTarget(selectorPtr);
  var context = canvas.getContext("webgpu");
  assert(context);
  if (!context) return 0;
  var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
  if (labelPtr) context.surfaceLabelWebGPU = UTF8ToString(labelPtr);
  return WebGPU.mgrSurface.create(context);
};

var _wgpuInstanceRequestAdapter = (instanceId, options, callback, userdata) => {
  assert(instanceId === 1, "WGPUInstance must be created by wgpuCreateInstance");
  var opts;
  if (options) {
    assert(options);
    assert(SAFE_HEAP_LOAD(((options) >> 2) * 4, 4, 1) === 0);
    opts = {
      "powerPreference": WebGPU.PowerPreference[SAFE_HEAP_LOAD((((options) + (8)) >> 2) * 4, 4, 1)],
      "forceFallbackAdapter": !!(SAFE_HEAP_LOAD((((options) + (16)) >> 2) * 4, 4, 1))
    };
  }
  if (!("gpu" in navigator)) {
    var sp = stackSave();
    var messagePtr = stringToUTF8OnStack("WebGPU not available on this browser (navigator.gpu is not available)");
    getWasmTableEntry(callback)(3, 0, messagePtr, userdata);
    stackRestore(sp);
    return;
  }
  navigator["gpu"]["requestAdapter"](opts).then(adapter => {
    callUserCallback(() => {
      if (adapter) {
        var adapterId = WebGPU.mgrAdapter.create(adapter);
        getWasmTableEntry(callback)(1, adapterId, 0, userdata);
      } else {
        var sp = stackSave();
        var messagePtr = stringToUTF8OnStack("WebGPU not available on this system (requestAdapter returned null)");
        getWasmTableEntry(callback)(3, 0, messagePtr, userdata);
        stackRestore(sp);
      }
    });
  }, ex => {
    callUserCallback(() => {
      var sp = stackSave();
      var messagePtr = stringToUTF8OnStack(ex.message);
      getWasmTableEntry(callback)(4, 0, messagePtr, userdata);
      stackRestore(sp);
    });
  });
};

var _wgpuPipelineLayoutRelease = id => WebGPU.mgrPipelineLayout.release(id);

var _wgpuQuerySetRelease = id => WebGPU.mgrQuerySet.release(id);

var _wgpuQueueRelease = id => WebGPU.mgrQueue.release(id);

var _wgpuQueueSubmit = (queueId, commandCount, commands) => {
  assert(commands % 4 === 0);
  var queue = WebGPU.mgrQueue.get(queueId);
  var cmds = Array.from(HEAP32.subarray((((commands) >> 2)), ((commands + commandCount * 4) >> 2)), id => WebGPU.mgrCommandBuffer.get(id));
  queue.submit(cmds);
};

var _wgpuRenderPassEncoderDraw = (passId, vertexCount, instanceCount, firstVertex, firstInstance) => {
  var pass = WebGPU.mgrRenderPassEncoder.get(passId);
  pass.draw(vertexCount, instanceCount, firstVertex, firstInstance);
};

var _wgpuRenderPassEncoderEnd = encoderId => {
  var encoder = WebGPU.mgrRenderPassEncoder.get(encoderId);
  encoder.end();
};

var _wgpuRenderPassEncoderRelease = id => WebGPU.mgrRenderPassEncoder.release(id);

var _wgpuRenderPassEncoderSetPipeline = (passId, pipelineId) => {
  var pass = WebGPU.mgrRenderPassEncoder.get(passId);
  var pipeline = WebGPU.mgrRenderPipeline.get(pipelineId);
  pass.setPipeline(pipeline);
};

var _wgpuRenderPipelineRelease = id => WebGPU.mgrRenderPipeline.release(id);

var _wgpuShaderModuleAddRef = id => WebGPU.mgrShaderModule.addRef(id);

var _wgpuShaderModuleRelease = id => WebGPU.mgrShaderModule.release(id);

var _wgpuSurfaceRelease = id => WebGPU.mgrSurface.release(id);

var _wgpuSwapChainGetCurrentTextureView = swapChainId => {
  var context = WebGPU.mgrSwapChain.get(swapChainId);
  return WebGPU.mgrTextureView.create(context.getCurrentTexture().createView());
};

var _wgpuSwapChainRelease = id => WebGPU.mgrSwapChain.release(id);

var _wgpuTextureAddRef = id => WebGPU.mgrTexture.addRef(id);

var _wgpuTextureCreateView = (textureId, descriptor) => {
  var desc;
  if (descriptor) {
    assert(descriptor);
    assert(SAFE_HEAP_LOAD(((descriptor) >> 2) * 4, 4, 1) === 0);
    var mipLevelCount = SAFE_HEAP_LOAD((((descriptor) + (20)) >> 2) * 4, 4, 1);
    var arrayLayerCount = SAFE_HEAP_LOAD((((descriptor) + (28)) >> 2) * 4, 4, 1);
    desc = {
      "format": WebGPU.TextureFormat[SAFE_HEAP_LOAD((((descriptor) + (8)) >> 2) * 4, 4, 1)],
      "dimension": WebGPU.TextureViewDimension[SAFE_HEAP_LOAD((((descriptor) + (12)) >> 2) * 4, 4, 1)],
      "baseMipLevel": SAFE_HEAP_LOAD((((descriptor) + (16)) >> 2) * 4, 4, 1),
      "mipLevelCount": mipLevelCount === 4294967295 ? undefined : mipLevelCount,
      "baseArrayLayer": SAFE_HEAP_LOAD((((descriptor) + (24)) >> 2) * 4, 4, 1),
      "arrayLayerCount": arrayLayerCount === 4294967295 ? undefined : arrayLayerCount,
      "aspect": WebGPU.TextureAspect[SAFE_HEAP_LOAD((((descriptor) + (32)) >> 2) * 4, 4, 1)]
    };
    var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
    if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
  }
  var texture = WebGPU.mgrTexture.get(textureId);
  return WebGPU.mgrTextureView.create(texture.createView(desc));
};

var _wgpuTextureRelease = id => WebGPU.mgrTexture.release(id);

var _wgpuTextureViewAddRef = id => WebGPU.mgrTextureView.addRef(id);

var _wgpuTextureViewRelease = id => WebGPU.mgrTextureView.release(id);

Module["requestFullscreen"] = Browser.requestFullscreen;

Module["requestFullScreen"] = Browser.requestFullScreen;

Module["requestAnimationFrame"] = Browser.requestAnimationFrame;

Module["setCanvasSize"] = Browser.setCanvasSize;

Module["pauseMainLoop"] = Browser.mainLoop.pause;

Module["resumeMainLoop"] = Browser.mainLoop.resume;

Module["getUserMedia"] = Browser.getUserMedia;

Module["createContext"] = Browser.createContext;

var preloadedImages = {};

var preloadedAudios = {};

WebGPU.initManagers();

function checkIncomingModuleAPI() {
  ignoredModuleProp("fetchSettings");
}

var wasmImports = {
  /** @export */ __assert_fail: ___assert_fail,
  /** @export */ _abort_js: __abort_js,
  /** @export */ _emscripten_memcpy_js: __emscripten_memcpy_js,
  /** @export */ alignfault: alignfault,
  /** @export */ emscripten_cancel_main_loop: _emscripten_cancel_main_loop,
  /** @export */ emscripten_resize_heap: _emscripten_resize_heap,
  /** @export */ emscripten_set_main_loop: _emscripten_set_main_loop,
  /** @export */ exit: _exit,
  /** @export */ fd_close: _fd_close,
  /** @export */ fd_seek: _fd_seek,
  /** @export */ fd_write: _fd_write,
  /** @export */ segfault: segfault,
  /** @export */ wgpuAdapterRelease: _wgpuAdapterRelease,
  /** @export */ wgpuAdapterRequestDevice: _wgpuAdapterRequestDevice,
  /** @export */ wgpuBindGroupLayoutAddRef: _wgpuBindGroupLayoutAddRef,
  /** @export */ wgpuBindGroupLayoutRelease: _wgpuBindGroupLayoutRelease,
  /** @export */ wgpuBindGroupRelease: _wgpuBindGroupRelease,
  /** @export */ wgpuBufferAddRef: _wgpuBufferAddRef,
  /** @export */ wgpuBufferGetConstMappedRange: _wgpuBufferGetConstMappedRange,
  /** @export */ wgpuBufferGetMappedRange: _wgpuBufferGetMappedRange,
  /** @export */ wgpuBufferMapAsync: _wgpuBufferMapAsync,
  /** @export */ wgpuBufferRelease: _wgpuBufferRelease,
  /** @export */ wgpuBufferUnmap: _wgpuBufferUnmap,
  /** @export */ wgpuCommandBufferRelease: _wgpuCommandBufferRelease,
  /** @export */ wgpuCommandEncoderBeginRenderPass: _wgpuCommandEncoderBeginRenderPass,
  /** @export */ wgpuCommandEncoderCopyBufferToBuffer: _wgpuCommandEncoderCopyBufferToBuffer,
  /** @export */ wgpuCommandEncoderCopyTextureToBuffer: _wgpuCommandEncoderCopyTextureToBuffer,
  /** @export */ wgpuCommandEncoderFinish: _wgpuCommandEncoderFinish,
  /** @export */ wgpuCommandEncoderRelease: _wgpuCommandEncoderRelease,
  /** @export */ wgpuDeviceAddRef: _wgpuDeviceAddRef,
  /** @export */ wgpuDeviceCreateBindGroup: _wgpuDeviceCreateBindGroup,
  /** @export */ wgpuDeviceCreateBindGroupLayout: _wgpuDeviceCreateBindGroupLayout,
  /** @export */ wgpuDeviceCreateBuffer: _wgpuDeviceCreateBuffer,
  /** @export */ wgpuDeviceCreateCommandEncoder: _wgpuDeviceCreateCommandEncoder,
  /** @export */ wgpuDeviceCreatePipelineLayout: _wgpuDeviceCreatePipelineLayout,
  /** @export */ wgpuDeviceCreateRenderPipeline: _wgpuDeviceCreateRenderPipeline,
  /** @export */ wgpuDeviceCreateShaderModule: _wgpuDeviceCreateShaderModule,
  /** @export */ wgpuDeviceCreateSwapChain: _wgpuDeviceCreateSwapChain,
  /** @export */ wgpuDeviceCreateTexture: _wgpuDeviceCreateTexture,
  /** @export */ wgpuDeviceGetQueue: _wgpuDeviceGetQueue,
  /** @export */ wgpuDeviceRelease: _wgpuDeviceRelease,
  /** @export */ wgpuDeviceSetUncapturedErrorCallback: _wgpuDeviceSetUncapturedErrorCallback,
  /** @export */ wgpuInstanceCreateSurface: _wgpuInstanceCreateSurface,
  /** @export */ wgpuInstanceRequestAdapter: _wgpuInstanceRequestAdapter,
  /** @export */ wgpuPipelineLayoutRelease: _wgpuPipelineLayoutRelease,
  /** @export */ wgpuQuerySetRelease: _wgpuQuerySetRelease,
  /** @export */ wgpuQueueRelease: _wgpuQueueRelease,
  /** @export */ wgpuQueueSubmit: _wgpuQueueSubmit,
  /** @export */ wgpuRenderPassEncoderDraw: _wgpuRenderPassEncoderDraw,
  /** @export */ wgpuRenderPassEncoderEnd: _wgpuRenderPassEncoderEnd,
  /** @export */ wgpuRenderPassEncoderRelease: _wgpuRenderPassEncoderRelease,
  /** @export */ wgpuRenderPassEncoderSetPipeline: _wgpuRenderPassEncoderSetPipeline,
  /** @export */ wgpuRenderPipelineRelease: _wgpuRenderPipelineRelease,
  /** @export */ wgpuShaderModuleAddRef: _wgpuShaderModuleAddRef,
  /** @export */ wgpuShaderModuleRelease: _wgpuShaderModuleRelease,
  /** @export */ wgpuSurfaceRelease: _wgpuSurfaceRelease,
  /** @export */ wgpuSwapChainGetCurrentTextureView: _wgpuSwapChainGetCurrentTextureView,
  /** @export */ wgpuSwapChainRelease: _wgpuSwapChainRelease,
  /** @export */ wgpuTextureAddRef: _wgpuTextureAddRef,
  /** @export */ wgpuTextureCreateView: _wgpuTextureCreateView,
  /** @export */ wgpuTextureRelease: _wgpuTextureRelease,
  /** @export */ wgpuTextureViewAddRef: _wgpuTextureViewAddRef,
  /** @export */ wgpuTextureViewRelease: _wgpuTextureViewRelease
};

var wasmExports = createWasm();

var ___wasm_call_ctors = createExportWrapper("__wasm_call_ctors", 0);

var _main = Module["_main"] = createExportWrapper("main", 2);

var _free = createExportWrapper("free", 1);

var _fflush = createExportWrapper("fflush", 1);

var _emscripten_get_sbrk_ptr = createExportWrapper("emscripten_get_sbrk_ptr", 0);

var _sbrk = createExportWrapper("sbrk", 1);

var _memalign = createExportWrapper("memalign", 2);

var _emscripten_stack_init = () => (_emscripten_stack_init = wasmExports["emscripten_stack_init"])();

var _emscripten_stack_get_free = () => (_emscripten_stack_get_free = wasmExports["emscripten_stack_get_free"])();

var _emscripten_stack_get_base = () => (_emscripten_stack_get_base = wasmExports["emscripten_stack_get_base"])();

var _emscripten_stack_get_end = () => (_emscripten_stack_get_end = wasmExports["emscripten_stack_get_end"])();

var __emscripten_stack_restore = a0 => (__emscripten_stack_restore = wasmExports["_emscripten_stack_restore"])(a0);

var __emscripten_stack_alloc = a0 => (__emscripten_stack_alloc = wasmExports["_emscripten_stack_alloc"])(a0);

var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports["emscripten_stack_get_current"])();

var dynCall_jiji = Module["dynCall_jiji"] = createExportWrapper("dynCall_jiji", 5);

var missingLibrarySymbols = [ "writeI53ToI64", "writeI53ToI64Clamped", "writeI53ToI64Signaling", "writeI53ToU64Clamped", "writeI53ToU64Signaling", "readI53FromU64", "convertI32PairToI53", "convertU32PairToI53", "getTempRet0", "setTempRet0", "zeroMemory", "growMemory", "isLeapYear", "ydayFromDate", "arraySum", "addDays", "inetPton4", "inetNtop4", "inetPton6", "inetNtop6", "readSockaddr", "writeSockaddr", "initRandomFill", "randomFill", "emscriptenLog", "readEmAsmArgs", "jstoi_q", "getExecutableName", "listenOnce", "autoResumeAudioContext", "dynCallLegacy", "getDynCaller", "dynCall", "runtimeKeepalivePush", "runtimeKeepalivePop", "asmjsMangle", "asyncLoad", "alignMemory", "mmapAlloc", "HandleAllocator", "getNativeTypeSize", "STACK_SIZE", "STACK_ALIGN", "POINTER_SIZE", "ASSERTIONS", "getCFunc", "ccall", "cwrap", "uleb128Encode", "sigToWasmTypes", "generateFuncType", "convertJsFunctionToWasm", "getEmptyTableSlot", "updateTableMap", "getFunctionAddress", "addFunction", "removeFunction", "reallyNegative", "strLen", "reSign", "formatString", "intArrayFromString", "intArrayToString", "AsciiToString", "stringToAscii", "UTF16ToString", "stringToUTF16", "lengthBytesUTF16", "UTF32ToString", "stringToUTF32", "lengthBytesUTF32", "stringToNewUTF8", "writeArrayToMemory", "registerKeyEventCallback", "getBoundingClientRect", "fillMouseEventData", "registerMouseEventCallback", "registerWheelEventCallback", "registerUiEventCallback", "registerFocusEventCallback", "fillDeviceOrientationEventData", "registerDeviceOrientationEventCallback", "fillDeviceMotionEventData", "registerDeviceMotionEventCallback", "screenOrientation", "fillOrientationChangeEventData", "registerOrientationChangeEventCallback", "fillFullscreenChangeEventData", "registerFullscreenChangeEventCallback", "JSEvents_requestFullscreen", "JSEvents_resizeCanvasForFullscreen", "registerRestoreOldStyle", "hideEverythingExceptGivenElement", "restoreHiddenElements", "setLetterbox", "softFullscreenResizeWebGLRenderTarget", "doRequestFullscreen", "fillPointerlockChangeEventData", "registerPointerlockChangeEventCallback", "registerPointerlockErrorEventCallback", "requestPointerLock", "fillVisibilityChangeEventData", "registerVisibilityChangeEventCallback", "registerTouchEventCallback", "fillGamepadEventData", "registerGamepadEventCallback", "registerBeforeUnloadEventCallback", "fillBatteryEventData", "battery", "registerBatteryEventCallback", "setCanvasElementSize", "getCanvasElementSize", "jsStackTrace", "getCallstack", "convertPCtoSourceLocation", "getEnvStrings", "checkWasiClock", "wasiRightsToMuslOFlags", "wasiOFlagsToMuslOFlags", "createDyncallWrapper", "setImmediateWrapped", "clearImmediateWrapped", "polyfillSetImmediate", "getPromise", "makePromise", "idsToPromises", "makePromiseCallback", "ExceptionInfo", "findMatchingCatch", "Browser_asyncPrepareDataCounter", "getSocketFromFD", "getSocketAddress", "FS_createPreloadedFile", "FS_modeStringToFlags", "FS_getMode", "FS_stdin_getChar", "FS_unlink", "FS_createDataFile", "FS_mkdirTree", "_setNetworkCallback", "heapObjectForWebGLType", "toTypedArrayIndex", "webgl_enable_ANGLE_instanced_arrays", "webgl_enable_OES_vertex_array_object", "webgl_enable_WEBGL_draw_buffers", "webgl_enable_WEBGL_multi_draw", "emscriptenWebGLGet", "computeUnpackAlignedImageSize", "colorChannelsInGlTextureFormat", "emscriptenWebGLGetTexPixelData", "emscriptenWebGLGetUniform", "webglGetUniformLocation", "webglPrepareUniformLocationsBeforeFirstUse", "webglGetLeftBracePos", "emscriptenWebGLGetVertexAttrib", "__glGetActiveAttribOrUniform", "writeGLArray", "registerWebGlEventCallback", "runAndAbortIfError", "ALLOC_NORMAL", "ALLOC_STACK", "allocate", "writeStringToMemory", "writeAsciiToMemory", "setErrNo", "demangle", "stackTrace" ];

missingLibrarySymbols.forEach(missingLibrarySymbol);

var unexportedSymbols = [ "run", "addOnPreRun", "addOnInit", "addOnPreMain", "addOnExit", "addOnPostRun", "addRunDependency", "removeRunDependency", "out", "err", "callMain", "abort", "wasmMemory", "wasmExports", "writeStackCookie", "checkStackCookie", "readI53FromI64", "convertI32PairToI53Checked", "stackSave", "stackRestore", "stackAlloc", "ptrToString", "exitJS", "getHeapMax", "abortOnCannotGrowMemory", "ENV", "MONTH_DAYS_REGULAR", "MONTH_DAYS_LEAP", "MONTH_DAYS_REGULAR_CUMULATIVE", "MONTH_DAYS_LEAP_CUMULATIVE", "ERRNO_CODES", "ERRNO_MESSAGES", "DNS", "Protocols", "Sockets", "timers", "warnOnce", "readEmAsmArgsArray", "jstoi_s", "handleException", "keepRuntimeAlive", "callUserCallback", "maybeExit", "wasmTable", "noExitRuntime", "freeTableIndexes", "functionsInTableMap", "unSign", "setValue", "getValue", "PATH", "PATH_FS", "UTF8Decoder", "UTF8ArrayToString", "UTF8ToString", "stringToUTF8Array", "stringToUTF8", "lengthBytesUTF8", "UTF16Decoder", "stringToUTF8OnStack", "JSEvents", "specialHTMLTargets", "maybeCStringToJsString", "findEventTarget", "findCanvasEventTarget", "currentFullscreenStrategy", "restoreOldWindowedStyle", "UNWIND_CACHE", "ExitStatus", "flush_NO_FILESYSTEM", "safeSetTimeout", "promiseMap", "uncaughtExceptionCount", "exceptionLast", "exceptionCaught", "Browser", "setMainLoop", "getPreloadedImageData__data", "wget", "SYSCALLS", "preloadPlugins", "FS_stdin_getChar_buffer", "FS_createPath", "FS_createDevice", "FS_readFile", "FS", "FS_createLazyFile", "MEMFS", "TTY", "PIPEFS", "SOCKFS", "tempFixedLengthArray", "miniTempWebGLFloatBuffers", "miniTempWebGLIntBuffers", "GL", "AL", "GLUT", "EGL", "GLEW", "IDBStore", "SDL", "SDL_gfx", "allocateUTF8", "allocateUTF8OnStack", "print", "printErr", "WebGPU", "JsValStore" ];

unexportedSymbols.forEach(unexportedRuntimeSymbol);

var calledRun;

dependenciesFulfilled = function runCaller() {
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller;
};

function callMain() {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
  assert(__ATPRERUN__.length == 0, "cannot call main when preRun functions remain to be called");
  var entryFunction = _main;
  var argc = 0;
  var argv = 0;
  try {
    var ret = entryFunction(argc, argv);
    exitJS(ret, /* implicit = */ true);
    return ret;
  } catch (e) {
    return handleException(e);
  }
}

function stackCheckInit() {
  _emscripten_stack_init();
  writeStackCookie();
}

function run() {
  if (runDependencies > 0) {
    return;
  }
  stackCheckInit();
  preRun();
  if (runDependencies > 0) {
    return;
  }
  function doRun() {
    if (calledRun) return;
    calledRun = true;
    Module["calledRun"] = true;
    if (ABORT) return;
    initRuntime();
    preMain();
    if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
    if (shouldRunNow) callMain();
    postRun();
  }
  if (Module["setStatus"]) {
    Module["setStatus"]("Running...");
    setTimeout(function() {
      setTimeout(function() {
        Module["setStatus"]("");
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
  checkStackCookie();
}

function checkUnflushedContent() {
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = x => {
    has = true;
  };
  try {
    flush_NO_FILESYSTEM();
  } catch (e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce("stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.");
    warnOnce("(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)");
  }
}

if (Module["preInit"]) {
  if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
  while (Module["preInit"].length > 0) {
    Module["preInit"].pop()();
  }
}

var shouldRunNow = true;

if (Module["noInitialRun"]) shouldRunNow = false;

run();
