// include: shell.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = typeof Module != "undefined" ? Module : {};

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).
// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = typeof window == "object";

var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";

// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";

var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (Module["ENVIRONMENT"]) {
  throw new Error("Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)");
}

if (ENVIRONMENT_IS_NODE) {}

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];

var thisProgram = "./this.program";

var quit_ = (status, toThrow) => {
  throw toThrow;
};

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = "";

function locateFile(path) {
  if (Module["locateFile"]) {
    return Module["locateFile"](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;

if (ENVIRONMENT_IS_NODE) {
  if (typeof process == "undefined" || !process.release || process.release.name !== "node") throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
  var nodeVersion = process.versions.node;
  var numericVersion = nodeVersion.split(".").slice(0, 3);
  numericVersion = (numericVersion[0] * 1e4) + (numericVersion[1] * 100) + (numericVersion[2].split("-")[0] * 1);
  var minVersion = 16e4;
  if (numericVersion < 16e4) {
    throw new Error("This emscripten-generated code requires node v16.0.0 (detected v" + nodeVersion + ")");
  }
  // These modules will usually be used on Node.js. Load them eagerly to avoid
  // the complexity of lazy-loading.
  var fs = require("fs");
  var nodePath = require("path");
  scriptDirectory = __dirname + "/";
  // include: node_shell_read.js
  readBinary = filename => {
    // We need to re-wrap `file://` strings to URLs. Normalizing isn't
    // necessary in that case, the path should already be absolute.
    filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
    var ret = fs.readFileSync(filename);
    assert(ret.buffer);
    return ret;
  };
  readAsync = (filename, binary = true) => {
    // See the comment in the `readBinary` function.
    filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
    return new Promise((resolve, reject) => {
      fs.readFile(filename, binary ? undefined : "utf8", (err, data) => {
        if (err) reject(err); else resolve(binary ? data.buffer : data);
      });
    });
  };
  // end include: node_shell_read.js
  if (!Module["thisProgram"] && process.argv.length > 1) {
    thisProgram = process.argv[1].replace(/\\/g, "/");
  }
  arguments_ = process.argv.slice(2);
  if (typeof module != "undefined") {
    module["exports"] = Module;
  }
  quit_ = (status, toThrow) => {
    process.exitCode = status;
    throw toThrow;
  };
} else if (ENVIRONMENT_IS_SHELL) {
  if ((typeof process == "object" && typeof require === "function") || typeof window == "object" || typeof importScripts == "function") throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
} else // Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  if (ENVIRONMENT_IS_WORKER) {
    // Check worker, not web, since window could be polyfilled
    scriptDirectory = self.location.href;
  } else if (typeof document != "undefined" && document.currentScript) {
    // web
    scriptDirectory = document.currentScript.src;
  }
  // blob urls look like blob:http://site.com/etc/etc and we cannot infer anything from them.
  // otherwise, slice off the final part of the url to find the script directory.
  // if scriptDirectory does not contain a slash, lastIndexOf will return -1,
  // and scriptDirectory will correctly be replaced with an empty string.
  // If scriptDirectory contains a query (starting with ?) or a fragment (starting with #),
  // they are removed because they could contain a slash.
  if (scriptDirectory.startsWith("blob:")) {
    scriptDirectory = "";
  } else {
    scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
  }
  if (!(typeof window == "object" || typeof importScripts == "function")) throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
  {
    // include: web_or_worker_shell_read.js
    if (ENVIRONMENT_IS_WORKER) {
      readBinary = url => {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, false);
        xhr.responseType = "arraybuffer";
        xhr.send(null);
        return new Uint8Array(/** @type{!ArrayBuffer} */ (xhr.response));
      };
    }
    readAsync = url => {
      // Fetch has some additional restrictions over XHR, like it can't be used on a file:// url.
      // See https://github.com/github/fetch/pull/92#issuecomment-140665932
      // Cordova or Electron apps are typically loaded from a file:// url.
      // So use XHR on webview if URL is a file URL.
      if (isFileURI(url)) {
        return new Promise((resolve, reject) => {
          var xhr = new XMLHttpRequest;
          xhr.open("GET", url, true);
          xhr.responseType = "arraybuffer";
          xhr.onload = () => {
            if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
              // file URLs can return 0
              resolve(xhr.response);
              return;
            }
            reject(xhr.status);
          };
          xhr.onerror = reject;
          xhr.send(null);
        });
      }
      return fetch(url, {
        credentials: "same-origin"
      }).then(response => {
        if (response.ok) {
          return response.arrayBuffer();
        }
        return Promise.reject(new Error(response.status + " : " + response.url));
      });
    };
  }
} else // end include: web_or_worker_shell_read.js
{
  throw new Error("environment detection error");
}

var out = Module["print"] || console.log.bind(console);

var err = Module["printErr"] || console.error.bind(console);

// Merge back in the overrides
Object.assign(Module, moduleOverrides);

// Free the object hierarchy contained in the overrides, this lets the GC
// reclaim data used.
moduleOverrides = null;

checkIncomingModuleAPI();

// Emit code to handle expected values on the Module object. This applies Module.x
// to the proper local x. This has two benefits: first, we only emit it if it is
// expected to arrive, and second, by using a local everywhere else that can be
// minified.
if (Module["arguments"]) arguments_ = Module["arguments"];

legacyModuleProp("arguments", "arguments_");

if (Module["thisProgram"]) thisProgram = Module["thisProgram"];

legacyModuleProp("thisProgram", "thisProgram");

// perform assertions in shell.js after we set up out() and err(), as otherwise if an assertion fails it cannot print the message
// Assertions on removed incoming Module JS APIs.
assert(typeof Module["memoryInitializerPrefixURL"] == "undefined", "Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["pthreadMainPrefixURL"] == "undefined", "Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["cdInitializerPrefixURL"] == "undefined", "Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["filePackagePrefixURL"] == "undefined", "Module.filePackagePrefixURL option was removed, use Module.locateFile instead");

assert(typeof Module["read"] == "undefined", "Module.read option was removed");

assert(typeof Module["readAsync"] == "undefined", "Module.readAsync option was removed (modify readAsync in JS)");

assert(typeof Module["readBinary"] == "undefined", "Module.readBinary option was removed (modify readBinary in JS)");

assert(typeof Module["setWindowTitle"] == "undefined", "Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)");

assert(typeof Module["TOTAL_MEMORY"] == "undefined", "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY");

legacyModuleProp("asm", "wasmExports");

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

// end include: shell.js
// include: preamble.js
// === Preamble library stuff ===
// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html
var wasmBinary = Module["wasmBinary"];

legacyModuleProp("wasmBinary", "wasmBinary");

if (typeof WebAssembly != "object") {
  err("no native wasm support detected");
}

// include: runtime_safe_heap.js
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
    // sbrk-managed memory must be above the stack
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
    // sbrk-managed memory must be above the stack
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

// end include: runtime_safe_heap.js
// Wasm globals
var wasmMemory;

//========================================
// Runtime essentials
//========================================
// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */ function assert(condition, text) {
  if (!condition) {
    abort("Assertion failed" + (text ? ": " + text : ""));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.
function _malloc() {
  abort("malloc() called but not included in the build - add `_malloc` to EXPORTED_FUNCTIONS");
}

// Memory management
var HEAP, /** @type {!Int8Array} */ HEAP8, /** @type {!Uint8Array} */ HEAPU8, /** @type {!Int16Array} */ HEAP16, /** @type {!Uint16Array} */ HEAPU16, /** @type {!Int32Array} */ HEAP32, /** @type {!Uint32Array} */ HEAPU32, /** @type {!Float32Array} */ HEAPF32, /** @type {!Float64Array} */ HEAPF64;

// include: runtime_shared.js
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

// end include: runtime_shared.js
assert(!Module["STACK_SIZE"], "STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time");

assert(typeof Int32Array != "undefined" && typeof Float64Array !== "undefined" && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined, "JS engine does not provide full typed array support");

// If memory is defined in wasm, the user can't provide it, or set INITIAL_MEMORY
assert(!Module["wasmMemory"], "Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally");

assert(!Module["INITIAL_MEMORY"], "Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically");

// include: runtime_stack_check.js
// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  SAFE_HEAP_STORE(((max) >> 2) * 4, 34821223, 4);
  SAFE_HEAP_STORE((((max) + (4)) >> 2) * 4, 2310721022, 4);
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  var cookie1 = SAFE_HEAP_LOAD(((max) >> 2) * 4, 4, 1);
  var cookie2 = SAFE_HEAP_LOAD((((max) + (4)) >> 2) * 4, 4, 1);
  if (cookie1 != 34821223 || cookie2 != 2310721022) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(cookie2)} ${ptrToString(cookie1)}`);
  }
}

// end include: runtime_stack_check.js
var __ATPRERUN__ = [];

// functions called before the runtime is initialized
var __ATINIT__ = [];

// functions called during startup
var __ATMAIN__ = [];

// functions called when main() is to be run
var __ATEXIT__ = [];

// functions called during shutdown
var __ATPOSTRUN__ = [];

// functions called after the main() is called
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

// include: runtime_math.js
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc
assert(Math.imul, "This browser does not support Math.imul(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.fround, "This browser does not support Math.fround(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.clz32, "This browser does not support Math.clz32(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

assert(Math.trunc, "This browser does not support Math.trunc(), build with LEGACY_VM_SUPPORT or POLYFILL_OLD_MATH_FUNCTIONS to add in a polyfill");

// end include: runtime_math.js
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// Module.preRun (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;

var runDependencyWatcher = null;

var dependenciesFulfilled = null;

// overridden to take different actions when all run dependencies are fulfilled
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
      // Check for missing dependencies every few seconds
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
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);
  ABORT = true;
  EXITSTATUS = 1;
  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.
  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // definition for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */ var e = new WebAssembly.RuntimeError(what);
  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

// include: memoryprofiler.js
// end include: memoryprofiler.js
// show errors on likely calls to FS when it was not included
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

// include: URIUtils.js
// Prefix of data URIs emitted by SINGLE_FILE and related options.
var dataURIPrefix = "data:application/octet-stream;base64,";

/**
 * Indicates whether filename is a base64 data URI.
 * @noinline
 */ var isDataURI = filename => filename.startsWith(dataURIPrefix);

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */ var isFileURI = filename => filename.startsWith("file://");

// end include: URIUtils.js
function createExportWrapper(name, nargs) {
  return (...args) => {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    var f = wasmExports[name];
    assert(f, `exported native function \`${name}\` not found`);
    // Only assert for too many arguments. Too few can be valid since the missing arguments will be zero filled.
    assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
    return f(...args);
  };
}

// include: runtime_exceptions.js
// end include: runtime_exceptions.js
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
  // If we don't have the binary yet, load it asynchronously using readAsync.
  if (!wasmBinary) {
    // Fetch the binary using readAsync
    return readAsync(binaryFile).then(response => new Uint8Array(/** @type{!ArrayBuffer} */ (response)), // Fall back to getBinarySync if readAsync fails
    () => getBinarySync(binaryFile));
  }
  // Otherwise, getBinarySync should be able to get it synchronously
  return Promise.resolve().then(() => getBinarySync(binaryFile));
}

function instantiateArrayBuffer(binaryFile, imports, receiver) {
  return getBinaryPromise(binaryFile).then(binary => WebAssembly.instantiate(binary, imports)).then(receiver, reason => {
    err(`failed to asynchronously prepare wasm: ${reason}`);
    // Warn on some common problems.
    if (isFileURI(wasmBinaryFile)) {
      err(`warning: Loading from a file URI (${wasmBinaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    }
    abort(reason);
  });
}

function instantiateAsync(binary, binaryFile, imports, callback) {
  if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && // Don't use streaming for file:// delivered objects in a webview, fetch them synchronously.
  !isFileURI(binaryFile) && // Avoid instantiateStreaming() on Node.js environment for now, as while
  // Node.js v18.1.0 implements it, it does not have a full fetch()
  // implementation yet.
  // Reference:
  //   https://github.com/emscripten-core/emscripten/pull/16917
  !ENVIRONMENT_IS_NODE && typeof fetch == "function") {
    return fetch(binaryFile, {
      credentials: "same-origin"
    }).then(response => {
      // Suppress closure warning here since the upstream definition for
      // instantiateStreaming only allows Promise<Repsponse> rather than
      // an actual Response.
      // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure is fixed.
      /** @suppress {checkTypes} */ var result = WebAssembly.instantiateStreaming(response, imports);
      return result.then(callback, function(reason) {
        // We expect the most common failure cause to be a bad MIME type for the binary,
        // in which case falling back to ArrayBuffer instantiation should work.
        err(`wasm streaming compile failed: ${reason}`);
        err("falling back to ArrayBuffer instantiation");
        return instantiateArrayBuffer(binaryFile, imports, callback);
      });
    });
  }
  return instantiateArrayBuffer(binaryFile, imports, callback);
}

function getWasmImports() {
  // prepare imports
  return {
    "env": wasmImports,
    "wasi_snapshot_preview1": wasmImports
  };
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
function createWasm() {
  var info = getWasmImports();
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
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
  // wait for the pthread pool (if any)
  addRunDependency("wasm-instantiate");
  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
    trueModule = null;
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above PTHREADS-enabled path.
    receiveInstance(result["instance"]);
  }
  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
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

// Globals used by JS i64 conversions (see makeSetValue)
var tempDouble;

var tempI64;

// include: runtime_debug.js
// Endianness check
(function() {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 25459;
  if (h8[0] !== 115 || h8[1] !== 99) throw "Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)";
})();

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

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === "FS_createPath" || name === "FS_createDataFile" || name === "FS_createPreloadedFile" || name === "FS_unlink" || name === "addRunDependency" || // The old FS has some functionality that WasmFS lacks.
  name === "FS_createLazyFile" || name === "FS_createDevice" || name === "removeRunDependency";
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
        // Can't `abort()` here because it would break code that does runtime
        // checks.  e.g. `if (typeof SDL === 'undefined')`.
        var msg = `\`${sym}\` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line`;
        // DEFAULT_LIBRARY_FUNCS_TO_INCLUDE requires the name as it appears in
        // library.js, which means $name for a JS name with no prefix, or name
        // for a JS name like _name.
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
  // Any symbol that is not included from the JS library is also (by definition)
  // not exported on the Module object.
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

// Used by XXXXX_DEBUG settings to output debug messages.
function dbg(...args) {
  // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn(...args);
}

// end include: runtime_debug.js
// === Body ===
// end include: preamble.js
/** @constructor */ function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = `Program terminated with exit(${status})`;
  this.status = status;
}

var callRuntimeCallbacks = callbacks => {
  while (callbacks.length > 0) {
    // Pass the module as the first argument.
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
  // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
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
  // Need some trickery, since if bits == 32, we are right at the limit of the
  // bits JS uses in bitshifts
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

var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder : undefined;

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
  // TextDecoder needs to know the byte length in advance, it doesn't stop on
  // null terminator by itself.  Also, use the length info to avoid running tiny
  // strings through TextDecoder, since .subarray() allocates garbage.
  // (As a tiny code save trick, compare endPtr against endIdx using a negation,
  // so that undefined means Infinity)
  while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
  if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
    return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
  }
  var str = "";
  // If building with TextDecoder, we have already computed the string length
  // above, so test loop end condition against that
  while (idx < endPtr) {
    // For UTF8 byte structure, see:
    // http://en.wikipedia.org/wiki/UTF-8#Description
    // https://www.ietf.org/rfc/rfc2279.txt
    // https://tools.ietf.org/html/rfc3629
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
  // Return non-zero on failure, can't set timing mode when there is no main loop.
  if (!Browser.mainLoop.running) {
    Browser.mainLoop.running = true;
  }
  if (mode == 0) {
    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
      var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
      setTimeout(Browser.mainLoop.runner, timeUntilNextTick);
    };
    // doing this each time means that on exception, we stop
    Browser.mainLoop.method = "timeout";
  } else if (mode == 1) {
    Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
      Browser.requestAnimationFrame(Browser.mainLoop.runner);
    };
    Browser.mainLoop.method = "rAF";
  } else if (mode == 2) {
    if (typeof Browser.setImmediate == "undefined") {
      if (typeof setImmediate == "undefined") {
        // Emulate setImmediate. (note: not a complete polyfill, we don't emulate clearImmediate() to keep code size to minimum, since not needed)
        var setImmediates = [];
        var emscriptenMainLoopMessageId = "setimmediate";
        /** @param {Event} event */ var Browser_setImmediate_messageHandler = event => {
          // When called in current thread or Worker, the main loop ID is structured slightly different to accommodate for --proxy-to-worker runtime listening to Worker events,
          // so check for both cases.
          if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
            event.stopPropagation();
            setImmediates.shift()();
          }
        };
        addEventListener("message", Browser_setImmediate_messageHandler, true);
        Browser.setImmediate = /** @type{function(function(): ?, ...?): number} */ (function Browser_emulated_setImmediate(func) {
          setImmediates.push(func);
          if (ENVIRONMENT_IS_WORKER) {
            Module["setImmediates"] ??= [];
            Module["setImmediates"].push(func);
            postMessage({
              target: emscriptenMainLoopMessageId
            });
          } else // In --proxy-to-worker, route the message via proxyClient.js
          postMessage(emscriptenMainLoopMessageId, "*");
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

// Modern environment where performance.now() is supported:
// N.B. a shorter form "_emscripten_get_now = performance.now;" is
// unfortunately not allowed even in current browsers (e.g. FF Nightly 75).
_emscripten_get_now = () => performance.now();

/**
     * @param {number=} arg
     * @param {boolean=} noSetTiming
     */ var setMainLoop = (browserIterationFunc, fps, simulateInfiniteLoop, arg, noSetTiming) => {
  assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
  Browser.mainLoop.func = browserIterationFunc;
  Browser.mainLoop.arg = arg;
  // Closure compiler bug(?): Closure does not see that the assignment
  //   var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop
  // is a value copy of a number (even with the JSDoc @type annotation)
  // but optimizeis the code as if the assignment was a reference assignment,
  // which results in Browser.mainLoop.pause() not working. Hence use a
  // workaround to make Closure believe this is a value copy that should occur:
  // (TODO: Minimize this down to a small test case and report - was unable
  // to reproduce in a small written test case)
  /** @type{number} */ var thisMainLoopId = (() => Browser.mainLoop.currentlyRunningMainloop)();
  function checkIsRunning() {
    if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) {
      return false;
    }
    return true;
  }
  // We create the loop runner here but it is not actually running until
  // _emscripten_set_main_loop_timing is called (which might happen a
  // later time).  This member signifies that the current runner has not
  // yet been started so that we can call runtimeKeepalivePush when it
  // gets it timing set for the first time.
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
          // not counted, but move the progress along a tiny bit
          next = next + .5;
          // do not steal all the next one's progress
          Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
        }
      }
      Browser.mainLoop.updateStatus();
      // catches pause/resume main loop from blocker execution
      if (!checkIsRunning()) return;
      setTimeout(Browser.mainLoop.runner, 0);
      return;
    }
    // catch pauses from non-main loop sources
    if (!checkIsRunning()) return;
    // Implement very basic swap interval control
    Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
    if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
      // Not the scheduled time to render this frame - skip.
      Browser.mainLoop.scheduler();
      return;
    } else if (Browser.mainLoop.timingMode == 0) {
      Browser.mainLoop.tickStartTime = _emscripten_get_now();
    }
    // Signal GL rendering layer that processing of a new frame is about to start. This helps it optimize
    // VBO double-buffering and reduce GPU stalls.
    if (Browser.mainLoop.method === "timeout" && Module.ctx) {
      warnOnce("Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!");
      Browser.mainLoop.method = "";
    }
    // just warn once per call to set main loop
    Browser.mainLoop.runIter(browserIterationFunc);
    checkStackCookie();
    // catch pauses from the main loop itself
    if (!checkIsRunning()) return;
    // Queue new audio data. This is important to be right after the main loop invocation, so that we will immediately be able
    // to queue the newest produced audio samples.
    // TODO: Consider adding pre- and post- rAF callbacks so that GL.newRenderingFrameStarted() and SDL.audio.queueNewAudioData()
    //       do not need to be hardcoded into this function, but can be more generic.
    if (typeof SDL == "object") SDL.audio?.queueNewAudioData?.();
    Browser.mainLoop.scheduler();
  };
  if (!noSetTiming) {
    if (fps && fps > 0) {
      _emscripten_set_main_loop_timing(0, 1e3 / fps);
    } else {
      // Do rAF by rendering each frame (no decimating)
      _emscripten_set_main_loop_timing(1, 1);
    }
    Browser.mainLoop.scheduler();
  }
  if (simulateInfiniteLoop) {
    throw "unwind";
  }
};

var handleException = e => {
  // Certain exception types we do not treat as errors since they are used for
  // internal control flow.
  // 1. ExitStatus, which is thrown by exit()
  // 2. "unwind", which is thrown by emscripten_unwind_to_js_event_loop() and others
  //    that wish to return to JS event loop.
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

/** @suppress {duplicate } */ /** @param {boolean|number=} implicit */ var exitJS = (status, implicit) => {
  EXITSTATUS = status;
  checkUnflushedContent();
  // if exit() was called explicitly, warn the user if the runtime isn't actually being shut down
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
      // Incrementing this signals the previous main loop that it's now become old, and it must return.
      Browser.mainLoop.currentlyRunningMainloop++;
    },
    resume() {
      Browser.mainLoop.currentlyRunningMainloop++;
      var timingMode = Browser.mainLoop.timingMode;
      var timingValue = Browser.mainLoop.timingValue;
      var func = Browser.mainLoop.func;
      Browser.mainLoop.func = null;
      // do not set timing and call scheduler, we will do it on the next lines
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
  useWebGL: false,
  isFullscreen: false,
  pointerLock: false,
  moduleContextCreatedCallbacks: [],
  workers: [],
  init() {
    if (Browser.initted) return;
    Browser.initted = true;
    // Support for plugins that can process preloaded files. You can add more of these to
    // your app by creating and appending to preloadPlugins.
    // Each plugin is asked if it can handle a file based on the file's name. If it can,
    // it is given the file's raw data. When it is done, it calls a callback with the file's
    // (possibly modified) data. For example, a plugin might decompress a file, or it
    // might create some side data structure for use later (like an Image element, etc.).
    var imagePlugin = {};
    imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
      return !Module["noImageDecoding"] && /\.(jpg|jpeg|png|bmp|webp)$/i.test(name);
    };
    imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
      var b = new Blob([ byteArray ], {
        type: Browser.getMimetype(name)
      });
      if (b.size !== byteArray.length) {
        // Safari bug #118630
        // Safari's Blob can only take an ArrayBuffer
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
      return !Module["noAudioDecoding"] && name.substr(-4) in {
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
        // empty shim
        onerror?.();
      }
      var b = new Blob([ byteArray ], {
        type: Browser.getMimetype(name)
      });
      var url = URL.createObjectURL(b);
      // XXX we never revoke this!
      assert(typeof url == "string", "createObjectURL must return a url as a string");
      var audio = new Audio;
      audio.addEventListener("canplaythrough", () => finish(audio), false);
      // use addEventListener due to chromium bug 124926
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
      // we don't wait for confirmation this worked - but it's worth trying
      audio.src = url;
      // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
      safeSetTimeout(() => {
        finish(audio);
      }, // try to use it even though it is not necessarily ready to play
      1e4);
    };
    preloadPlugins.push(audioPlugin);
    // Canvas event setup
    function pointerLockChange() {
      Browser.pointerLock = document["pointerLockElement"] === Module["canvas"] || document["mozPointerLockElement"] === Module["canvas"] || document["webkitPointerLockElement"] === Module["canvas"] || document["msPointerLockElement"] === Module["canvas"];
    }
    var canvas = Module["canvas"];
    if (canvas) {
      // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
      // Module['forcedAspectRatio'] = 4 / 3;
      canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || (() => {});
      canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || (() => {});
      // no-op if function does not exist
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
    // no need to recreate GL context if it's already been created for this canvas.
    var ctx;
    var contextHandle;
    if (useWebGL) {
      // For GLES2/desktop GL compatibility, adjust a few defaults to be different to WebGL defaults, so that they align better with the desktop defaults.
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
      // This check of existence of GL is here to satisfy Closure compiler, which yells if variable GL is referenced below but GL object is not
      // actually compiled in because application is not doing any GL operations. TODO: Ideally if GL is not being used, this function
      // Browser.createContext() should not even be emitted.
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
      Browser.useWebGL = useWebGL;
      Browser.moduleContextCreatedCallbacks.forEach(callback => callback());
      Browser.init();
    }
    return ctx;
  },
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
        // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
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
    // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
    var canvasContainer = document.createElement("div");
    canvas.parentNode.insertBefore(canvasContainer, canvas);
    canvasContainer.appendChild(canvas);
    // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
    canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ? () => canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null) || (canvasContainer["webkitRequestFullScreen"] ? () => canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]) : null);
    canvasContainer.requestFullscreen();
  },
  requestFullScreen() {
    abort("Module.requestFullScreen has been replaced by Module.requestFullscreen (without a capital S)");
  },
  exitFullscreen() {
    // This is workaround for chrome. Trying to exit from fullscreen
    // not in fullscreen state will cause "TypeError: Document not active"
    // in chrome. See https://github.com/emscripten-core/emscripten/pull/8236
    if (!Browser.isFullscreen) {
      return false;
    }
    var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || (() => {});
    CFS.apply(document, []);
    return true;
  },
  nextRAF: 0,
  fakeRequestAnimationFrame(func) {
    // try to keep 60fps between calls to here
    var now = Date.now();
    if (Browser.nextRAF === 0) {
      Browser.nextRAF = now + 1e3 / 60;
    } else {
      while (now + 2 >= Browser.nextRAF) {
        // fudge a little, to avoid timer jitter causing us to do lots of delay:0
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
    // Legacy function, this is used by the SDL2 port so we need to keep it
    // around at least until that is updated.
    // See https://github.com/libsdl-org/SDL/pull/6304
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
      // 3 lines make up a step
      delta = event.detail / 3;
      break;

     case "mousewheel":
      // 120 units make up a step
      delta = event.wheelDelta / 120;
      break;

     case "wheel":
      delta = event.deltaY;
      switch (event.deltaMode) {
       case 0:
        // DOM_DELTA_PIXEL: 100 pixels make up a step
        delta /= 100;
        break;

       case 1:
        // DOM_DELTA_LINE: 3 lines make up a step
        delta /= 3;
        break;

       case 2:
        // DOM_DELTA_PAGE: A page makes up 80 steps
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
    // Calculate the movement based on the changes
    // in the coordinates.
    var rect = Module["canvas"].getBoundingClientRect();
    var cw = Module["canvas"].width;
    var ch = Module["canvas"].height;
    // Neither .scrollX or .pageXOffset are defined in a spec, but
    // we prefer .scrollX because it is currently in a spec draft.
    // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
    var scrollX = ((typeof window.scrollX != "undefined") ? window.scrollX : window.pageXOffset);
    var scrollY = ((typeof window.scrollY != "undefined") ? window.scrollY : window.pageYOffset);
    // If this assert lands, it's likely because the browser doesn't support scrollX or pageXOffset
    // and we have no viable fallback.
    assert((typeof scrollX != "undefined") && (typeof scrollY != "undefined"), "Unable to retrieve scroll position, mouse positions likely broken.");
    var adjustedX = pageX - (scrollX + rect.left);
    var adjustedY = pageY - (scrollY + rect.top);
    // the canvas might be CSS-scaled compared to its backbuffer;
    // SDL-using content will want mouse coordinates in terms
    // of backbuffer units.
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
    // event should be mousemove, mousedown or mouseup
    if (Browser.pointerLock) {
      // When the pointer is locked, calculate the coordinates
      // based on the movement of the mouse.
      // Workaround for Firefox bug 764498
      if (event.type != "mousemove" && ("mozMovementX" in event)) {
        Browser.mouseMovementX = Browser.mouseMovementY = 0;
      } else {
        Browser.mouseMovementX = Browser.getMovementX(event);
        Browser.mouseMovementY = Browser.getMovementY(event);
      }
      // add the mouse delta to the current absolute mouse position
      Browser.mouseX += Browser.mouseMovementX;
      Browser.mouseY += Browser.mouseMovementY;
    } else {
      if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
        var touch = event.touch;
        if (touch === undefined) {
          return;
        }
        // the "touch" property is only defined in SDL
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
    // check if SDL is available
    if (typeof SDL != "undefined") {
      var flags = SAFE_HEAP_LOAD(((SDL.screen) >> 2) * 4, 4, 1);
      flags = flags | 8388608;
      // set SDL_FULLSCREEN flag
      SAFE_HEAP_STORE(((SDL.screen) >> 2) * 4, flags, 4);
    }
    Browser.updateCanvasDimensions(Module["canvas"]);
    Browser.updateResizeListeners();
  },
  setWindowedCanvasSize() {
    // check if SDL is available
    if (typeof SDL != "undefined") {
      var flags = SAFE_HEAP_LOAD(((SDL.screen) >> 2) * 4, 4, 1);
      flags = flags & ~8388608;
      // clear SDL_FULLSCREEN flag
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

var alignMemory = (size, alignment) => {
  assert(alignment, "alignment argument is required");
  return Math.ceil(size / alignment) * alignment;
};

var abortOnCannotGrowMemory = requestedSize => {
  abort(`Cannot enlarge memory arrays to size ${requestedSize} bytes (OOM). Either (1) compile with -sINITIAL_MEMORY=X with X higher than the current value ${HEAP8.length}, (2) compile with -sALLOW_MEMORY_GROWTH which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with -sABORTING_MALLOC=0`);
};

var _emscripten_resize_heap = requestedSize => {
  var oldSize = HEAPU8.length;
  // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
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

var withStackSave = f => {
  var stack = stackSave();
  var ret = f();
  stackRestore(stack);
  return ret;
};

var lengthBytesUTF8 = str => {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
    // unit, not a Unicode code point of the character! So decode
    // UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var c = str.charCodeAt(i);
    // possibly a lead surrogate
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
  // Parameter maxBytesToWrite is not optional. Negative values, 0, null,
  // undefined and false each don't write out any bytes.
  if (!(maxBytesToWrite > 0)) return 0;
  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1;
  // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code
    // unit, not a Unicode code point of the character! So decode
    // UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description
    // and https://www.ietf.org/rfc/rfc2279.txt
    // and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i);
    // possibly a lead surrogate
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
  // Null-terminate the pointer to the buffer.
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
  _table: [],
  _tableGet: ptr => {
    if (!ptr) return undefined;
    return WebGPU._table[ptr];
  },
  _tableInsert: (ptr, value) => {
    WebGPU._table[ptr] = value;
  },
  _futures: [],
  _futureInsert: (futureIdL, futureIdH, promise) => {},
  _waitAnyPromisesList: [],
  errorCallback: (callback, type, message, userdata) => {
    var sp = stackSave();
    var messagePtr = stringToUTF8OnStack(message);
    getWasmTableEntry(callback)(type, messagePtr, userdata);
    stackRestore(sp);
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
      "texture": WebGPU._tableGet(SAFE_HEAP_LOAD(((ptr) >> 2) * 4, 4, 1)),
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
    bufferCopyView["buffer"] = WebGPU._tableGet(SAFE_HEAP_LOAD((((ptr) + (24)) >> 2) * 4, 4, 1)).object;
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
    return WebGPU._tableGet(layoutPtr);
  },
  makeProgrammableStageDescriptor: ptr => {
    if (!ptr) return undefined;
    assert(ptr);
    assert(SAFE_HEAP_LOAD(((ptr) >> 2) * 4, 4, 1) === 0);
    var desc = {
      "module": WebGPU._tableGet(SAFE_HEAP_LOAD((((ptr) + (4)) >> 2) * 4, 4, 1)),
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
    function makePrimitiveState(psPtr) {
      if (!psPtr) return undefined;
      assert(psPtr);
      assert(SAFE_HEAP_LOAD(((psPtr) >> 2) * 4, 4, 1) === 0);
      return {
        "topology": WebGPU.PrimitiveTopology[SAFE_HEAP_LOAD((((psPtr) + (4)) >> 2) * 4, 4, 1)],
        "stripIndexFormat": WebGPU.IndexFormat[SAFE_HEAP_LOAD((((psPtr) + (8)) >> 2) * 4, 4, 1)],
        "frontFace": WebGPU.FrontFace[SAFE_HEAP_LOAD((((psPtr) + (12)) >> 2) * 4, 4, 1)],
        "cullMode": WebGPU.CullMode[SAFE_HEAP_LOAD((((psPtr) + (16)) >> 2) * 4, 4, 1)],
        "unclippedDepth": !!(SAFE_HEAP_LOAD((((psPtr) + (20)) >> 2) * 4, 4, 1))
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
        "module": WebGPU._tableGet(SAFE_HEAP_LOAD((((viPtr) + (4)) >> 2) * 4, 4, 1)),
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
        "module": WebGPU._tableGet(SAFE_HEAP_LOAD((((fsPtr) + (4)) >> 2) * 4, 4, 1)),
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
      "depthStencil": makeDepthStencilState(SAFE_HEAP_LOAD((((descriptor) + (64)) >> 2) * 4, 4, 1)),
      "multisample": makeMultisampleState(descriptor + 68),
      "fragment": makeFragmentState(SAFE_HEAP_LOAD((((descriptor) + (84)) >> 2) * 4, 4, 1))
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
    setLimitValueU64("maxBufferSize", 88);
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
  CompositeAlphaMode: [ , "opaque", "premultiplied", "unpremultiplied", "inherit" ],
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
    11: "float32-filterable",
    12: "subgroups",
    13: "subgroups-f16"
  },
  FilterMode: [ , "nearest", "linear" ],
  FrontFace: [ , "ccw", "cw" ],
  IndexFormat: [ , "uint16", "uint32" ],
  LoadOp: [ , "load", "clear" ],
  MipmapFilterMode: [ , "nearest", "linear" ],
  OptionalBool: [ "false", "true" ],
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
    "float32-filterable": "11",
    subgroups: "12",
    "subgroups-f16": "13"
  }
};

var _emwgpuAdapterRequestDevice = (adapterPtr, futureIdL, futureIdH, deviceLostFutureIdL, deviceLostFutureIdH, devicePtr, queuePtr, descriptor) => {
  var adapter = WebGPU._tableGet(adapterPtr);
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
        // Handle WGPU_LIMIT_U64_UNDEFINED.
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
      setLimitU64IfDefined("maxBufferSize", 88);
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
    var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
    if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
  }
  var hasDeviceLostFutureId = !!deviceLostFutureIdH || !!deviceLostFutureIdL;
  WebGPU._futureInsert(futureIdL, futureIdH, adapter.requestDevice(desc).then(device => {
    WebGPU._tableInsert(queuePtr, device.queue);
    WebGPU._tableInsert(devicePtr, device);
    // Set up device lost promise resolution.
    if (hasDeviceLostFutureId) {
      WebGPU._futureInsert(deviceLostFutureIdL, deviceLostFutureIdH, device.lost.then(info => {
        // Unset the uncaptured error handler.
        device.onuncapturederror = ev => {};
        withStackSave(() => {
          var messagePtr = stringToUTF8OnStack(info.message);
          _emwgpuOnDeviceLostCompleted(deviceLostFutureIdL, deviceLostFutureIdH, WebGPU.Int_DeviceLostReason[info.reason], messagePtr);
        });
      }));
    }
    // Set up uncaptured error handlers.
    assert(typeof GPUValidationError != "undefined");
    assert(typeof GPUOutOfMemoryError != "undefined");
    assert(typeof GPUInternalError != "undefined");
    device.onuncapturederror = ev => {
      var type = 5;
      if (ev.error instanceof GPUValidationError) type = 2; else if (ev.error instanceof GPUOutOfMemoryError) type = 3; else if (ev.error instanceof GPUInternalError) type = 4;
      withStackSave(() => {
        var messagePtr = stringToUTF8OnStack(ev.error.message);
        _emwgpuOnUncapturedError(devicePtr, type, messagePtr);
      });
    };
    _emwgpuOnRequestDeviceCompleted(futureIdL, futureIdH, 1, devicePtr, 0);
  }, ex => {
    withStackSave(() => {
      var messagePtr = stringToUTF8OnStack(ex.message);
      _emwgpuOnRequestDeviceCompleted(futureIdL, futureIdH, 3, devicePtr, messagePtr);
      if (hasDeviceLostFutureId) {
        _emwgpuOnDeviceLostCompleted(deviceLostFutureIdL, deviceLostFutureIdH, 4, messagePtr);
      }
    });
  }));
};

var _emwgpuDelete = id => {
  delete WebGPU._table[id];
};

var _emwgpuInstanceRequestAdapter = (instancePtr, futureIdL, futureIdH, options) => {
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
    withStackSave(() => {
      var messagePtr = stringToUTF8OnStack("WebGPU not available on this browser (navigator.gpu is not available)");
      _emwgpuOnRequestAdapterCompleted(futureIdL, futureIdH, 3, 0, messagePtr);
    });
    return;
  }
  WebGPU._futureInsert(futureIdL, futureIdH, navigator["gpu"]["requestAdapter"](opts).then(adapter => {
    if (adapter) {
      var adapterPtr = _emwgpuCreateAdapter(instancePtr);
      WebGPU._tableInsert(adapterPtr, adapter);
      _emwgpuOnRequestAdapterCompleted(futureIdL, futureIdH, 1, adapterPtr, 0);
    } else {
      withStackSave(() => {
        var messagePtr = stringToUTF8OnStack("WebGPU not available on this browser (requestAdapter returned null)");
        _emwgpuOnRequestAdapterCompleted(futureIdL, futureIdH, 3, 0, messagePtr);
      });
    }
    return;
  }, ex => {
    withStackSave(() => {
      var messagePtr = stringToUTF8OnStack(ex.message);
      _emwgpuOnRequestAdapterCompleted(futureIdL, futureIdH, 4, 0, messagePtr);
    });
    return;
  }));
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
  // lo should either be a i32 or a u32
  assert(hi === (hi | 0));
  // hi should be a i32
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
  // flush anything remaining in the buffers during shutdown
  _fflush(0);
  if (printCharBuffers[1].length) printChar(1, 10);
  if (printCharBuffers[2].length) printChar(2, 10);
};

var _fd_write = (fd, iov, iovcnt, pnum) => {
  // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
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

var _wgpuBufferGetConstMappedRange = (bufferPtr, offset, size) => {
  var bufferWrapper = WebGPU._tableGet(bufferPtr);
  assert(typeof bufferWrapper != "undefined");
  if (size === 0) warnOnce("getMappedRange size=0 no longer means WGPU_WHOLE_MAP_SIZE");
  if (size == -1) size = undefined;
  var mapped;
  try {
    mapped = bufferWrapper.object.getMappedRange(offset, size);
  } catch (ex) {
    err(`wgpuBufferGetConstMappedRange(${offset}, ${size}) failed: ${ex}`);
    // TODO(kainino0x): Somehow inject a validation error?
    return 0;
  }
  var data = _memalign(16, mapped.byteLength);
  HEAPU8.set(new Uint8Array(mapped), data);
  bufferWrapper.onUnmap.push(() => _free(data));
  return data;
};

var _wgpuBufferGetMappedRange = (bufferPtr, offset, size) => {
  var bufferWrapper = WebGPU._tableGet(bufferPtr);
  assert(typeof bufferWrapper != "undefined");
  if (size === 0) warnOnce("getMappedRange size=0 no longer means WGPU_WHOLE_MAP_SIZE");
  if (size == -1) size = undefined;
  if (bufferWrapper.mapMode !== 2) {
    abort("GetMappedRange called, but buffer not mapped for writing");
    // TODO(kainino0x): Somehow inject a validation error?
    return 0;
  }
  var mapped;
  try {
    mapped = bufferWrapper.object.getMappedRange(offset, size);
  } catch (ex) {
    err(`wgpuBufferGetMappedRange(${offset}, ${size}) failed: ${ex}`);
    // TODO(kainino0x): Somehow inject a validation error?
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

var _wgpuBufferMapAsync = function(bufferPtr, mode_low, mode_high, offset, size, callback, userdata) {
  var mode = convertI32PairToI53Checked(mode_low, mode_high);
  var bufferWrapper = WebGPU._tableGet(bufferPtr);
  assert(typeof bufferWrapper != "undefined");
  bufferWrapper.mapMode = mode;
  bufferWrapper.onUnmap = [];
  var buffer = bufferWrapper.object;
  if (size == -1) size = undefined;
  // `callback` takes (WGPUBufferMapAsyncStatus status, void * userdata)
  buffer.mapAsync(mode, offset, size).then(() => {
    callUserCallback(() => {
      getWasmTableEntry(callback)(1, userdata);
    });
  }, () => {
    callUserCallback(() => {
      // TODO(kainino0x): Figure out how to pick other error status values.
      getWasmTableEntry(callback)(3, userdata);
    });
  });
};

var _wgpuBufferUnmap = bufferPtr => {
  var bufferWrapper = WebGPU._tableGet(bufferPtr);
  assert(typeof bufferWrapper != "undefined");
  if (!bufferWrapper.onUnmap) {
    // Already unmapped
    return;
  }
  for (var i = 0; i < bufferWrapper.onUnmap.length; ++i) {
    bufferWrapper.onUnmap[i]();
  }
  bufferWrapper.onUnmap = undefined;
  bufferWrapper.object.unmap();
};

var _wgpuCommandEncoderBeginRenderPass = (encoderPtr, descriptor) => {
  assert(descriptor);
  function makeColorAttachment(caPtr) {
    var viewPtr = SAFE_HEAP_LOAD((((caPtr) + (4)) >> 2) * 4, 4, 1);
    if (viewPtr === 0) {
      // view could be undefined.
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
      "view": WebGPU._tableGet(viewPtr),
      "depthSlice": depthSlice,
      "resolveTarget": WebGPU._tableGet(SAFE_HEAP_LOAD((((caPtr) + (12)) >> 2) * 4, 4, 1)),
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
      "view": WebGPU._tableGet(SAFE_HEAP_LOAD(((dsaPtr) >> 2) * 4, 4, 1)),
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
      "querySet": WebGPU._tableGet(SAFE_HEAP_LOAD(((twPtr) >> 2) * 4, 4, 1)),
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
      assert(sType === 3);
      assert(0 === SAFE_HEAP_LOAD(((nextInChainPtr) >> 2) * 4, 4, 1));
      var renderPassMaxDrawCount = nextInChainPtr;
      assert(renderPassMaxDrawCount);
      assert(SAFE_HEAP_LOAD(((renderPassMaxDrawCount) >> 2) * 4, 4, 1) === 0);
      maxDrawCount = SAFE_HEAP_LOAD(((((renderPassMaxDrawCount + 4)) + (8)) >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD((((renderPassMaxDrawCount) + (8)) >> 2) * 4, 4, 1);
    }
    var desc = {
      "label": undefined,
      "colorAttachments": makeColorAttachments(SAFE_HEAP_LOAD((((descriptor) + (8)) >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((((descriptor) + (12)) >> 2) * 4, 4, 1)),
      "depthStencilAttachment": makeDepthStencilAttachment(SAFE_HEAP_LOAD((((descriptor) + (16)) >> 2) * 4, 4, 1)),
      "occlusionQuerySet": WebGPU._tableGet(SAFE_HEAP_LOAD((((descriptor) + (20)) >> 2) * 4, 4, 1)),
      "timestampWrites": makeRenderPassTimestampWrites(SAFE_HEAP_LOAD((((descriptor) + (24)) >> 2) * 4, 4, 1)),
      "maxDrawCount": maxDrawCount
    };
    var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
    if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
    return desc;
  }
  var desc = makeRenderPassDescriptor(descriptor);
  var commandEncoder = WebGPU._tableGet(encoderPtr);
  var ptr = _emwgpuCreateRenderPassEncoder();
  WebGPU._tableInsert(ptr, commandEncoder.beginRenderPass(desc));
  return ptr;
};

function _wgpuCommandEncoderCopyBufferToBuffer(encoderPtr, srcPtr, srcOffset_low, srcOffset_high, dstPtr, dstOffset_low, dstOffset_high, size_low, size_high) {
  var srcOffset = convertI32PairToI53Checked(srcOffset_low, srcOffset_high);
  var dstOffset = convertI32PairToI53Checked(dstOffset_low, dstOffset_high);
  var size = convertI32PairToI53Checked(size_low, size_high);
  var commandEncoder = WebGPU._tableGet(encoderPtr);
  var src = WebGPU._tableGet(srcPtr).object;
  var dst = WebGPU._tableGet(dstPtr).object;
  commandEncoder.copyBufferToBuffer(src, srcOffset, dst, dstOffset, size);
}

var _wgpuCommandEncoderCopyTextureToBuffer = (encoderPtr, srcPtr, dstPtr, copySizePtr) => {
  var commandEncoder = WebGPU._tableGet(encoderPtr);
  var copySize = WebGPU.makeExtent3D(copySizePtr);
  commandEncoder.copyTextureToBuffer(WebGPU.makeImageCopyTexture(srcPtr), WebGPU.makeImageCopyBuffer(dstPtr), copySize);
};

var _wgpuCommandEncoderFinish = (encoderPtr, descriptor) => {
  // TODO: Use the descriptor.
  var commandEncoder = WebGPU._tableGet(encoderPtr);
  var ptr = _emwgpuCreateCommandBuffer();
  WebGPU._tableInsert(ptr, commandEncoder.finish());
  return ptr;
};

var readI53FromI64 = ptr => SAFE_HEAP_LOAD(((ptr) >> 2) * 4, 4, 1) + SAFE_HEAP_LOAD((((ptr) + (4)) >> 2) * 4, 4, 0) * 4294967296;

var _wgpuDeviceCreateBindGroup = (devicePtr, descriptor) => {
  assert(descriptor);
  assert(SAFE_HEAP_LOAD(((descriptor) >> 2) * 4, 4, 1) === 0);
  function makeEntry(entryPtr) {
    assert(entryPtr);
    var bufferPtr = SAFE_HEAP_LOAD((((entryPtr) + (8)) >> 2) * 4, 4, 1);
    var samplerPtr = SAFE_HEAP_LOAD((((entryPtr) + (32)) >> 2) * 4, 4, 1);
    var textureViewPtr = SAFE_HEAP_LOAD((((entryPtr) + (36)) >> 2) * 4, 4, 1);
    assert((bufferPtr !== 0) + (samplerPtr !== 0) + (textureViewPtr !== 0) === 1);
    var binding = SAFE_HEAP_LOAD((((entryPtr) + (4)) >> 2) * 4, 4, 1);
    if (bufferPtr) {
      var size = readI53FromI64((entryPtr) + (24));
      if (size == -1) size = undefined;
      return {
        "binding": binding,
        "resource": {
          "buffer": WebGPU._tableGet(bufferPtr).object,
          "offset": SAFE_HEAP_LOAD(((((entryPtr + 4)) + (16)) >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD((((entryPtr) + (16)) >> 2) * 4, 4, 1),
          "size": size
        }
      };
    } else if (samplerPtr) {
      return {
        "binding": binding,
        "resource": WebGPU._tableGet(samplerPtr)
      };
    } else {
      return {
        "binding": binding,
        "resource": WebGPU._tableGet(textureViewPtr)
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
    "layout": WebGPU._tableGet(SAFE_HEAP_LOAD((((descriptor) + (8)) >> 2) * 4, 4, 1)),
    "entries": makeEntries(SAFE_HEAP_LOAD((((descriptor) + (12)) >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((((descriptor) + (16)) >> 2) * 4, 4, 1))
  };
  var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
  if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
  var device = WebGPU._tableGet(devicePtr);
  var ptr = _emwgpuCreateBindGroup();
  WebGPU._tableInsert(ptr, device.createBindGroup(desc));
  return ptr;
};

var _wgpuDeviceCreateBindGroupLayout = (devicePtr, descriptor) => {
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
  var device = WebGPU._tableGet(devicePtr);
  var ptr = _emwgpuCreateBindGroupLayout();
  WebGPU._tableInsert(ptr, device.createBindGroupLayout(desc));
  return ptr;
};

var _wgpuDeviceCreateBuffer = (devicePtr, descriptor) => {
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
  var device = WebGPU._tableGet(devicePtr);
  var bufferWrapper = {
    object: device.createBuffer(desc)
  };
  var ptr = _emwgpuCreateBuffer();
  WebGPU._tableInsert(ptr, bufferWrapper);
  if (mappedAtCreation) {
    bufferWrapper.mapMode = 2;
    bufferWrapper.onUnmap = [];
  }
  return ptr;
};

var _wgpuDeviceCreateCommandEncoder = (devicePtr, descriptor) => {
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
  var device = WebGPU._tableGet(devicePtr);
  var ptr = _emwgpuCreateCommandEncoder();
  WebGPU._tableInsert(ptr, device.createCommandEncoder(desc));
  return ptr;
};

var _wgpuDeviceCreatePipelineLayout = (devicePtr, descriptor) => {
  assert(descriptor);
  assert(SAFE_HEAP_LOAD(((descriptor) >> 2) * 4, 4, 1) === 0);
  var bglCount = SAFE_HEAP_LOAD((((descriptor) + (8)) >> 2) * 4, 4, 1);
  var bglPtr = SAFE_HEAP_LOAD((((descriptor) + (12)) >> 2) * 4, 4, 1);
  var bgls = [];
  for (var i = 0; i < bglCount; ++i) {
    bgls.push(WebGPU._tableGet(SAFE_HEAP_LOAD((((bglPtr) + (4 * i)) >> 2) * 4, 4, 1)));
  }
  var desc = {
    "label": undefined,
    "bindGroupLayouts": bgls
  };
  var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
  if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
  var device = WebGPU._tableGet(devicePtr);
  var ptr = _emwgpuCreatePipelineLayout();
  WebGPU._tableInsert(ptr, device.createPipelineLayout(desc));
  return ptr;
};

var _wgpuDeviceCreateRenderPipeline = (devicePtr, descriptor) => {
  var desc = WebGPU.makeRenderPipelineDesc(descriptor);
  var device = WebGPU._tableGet(devicePtr);
  var ptr = _emwgpuCreateRenderPipeline();
  WebGPU._tableInsert(ptr, device.createRenderPipeline(desc));
  return ptr;
};

var _wgpuDeviceCreateShaderModule = (devicePtr, descriptor) => {
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
  var device = WebGPU._tableGet(devicePtr);
  var ptr = _emwgpuCreateShaderModule();
  WebGPU._tableInsert(ptr, device.createShaderModule(desc));
  return ptr;
};

var _wgpuDeviceCreateTexture = (devicePtr, descriptor) => {
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
    // viewFormatsPtr pointer to an array of TextureFormat which is an enum of size uint32_t
    desc["viewFormats"] = Array.from(HEAP32.subarray((((viewFormatsPtr) >> 2)), ((viewFormatsPtr + viewFormatCount * 4) >> 2)), function(format) {
      return WebGPU.TextureFormat[format];
    });
  }
  var device = WebGPU._tableGet(devicePtr);
  var ptr = _emwgpuCreateTexture();
  WebGPU._tableInsert(ptr, device.createTexture(desc));
  return ptr;
};

var _wgpuDeviceSetUncapturedErrorCallback = (devicePtr, callback, userdata) => {
  var device = WebGPU._tableGet(devicePtr);
  device.onuncapturederror = function(ev) {
    // This will skip the callback if the runtime is no longer alive.
    callUserCallback(() => {
      // WGPUErrorType type, const char* message, void* userdata
      var Validation = 1;
      var OutOfMemory = 2;
      var type;
      assert(typeof GPUValidationError != "undefined");
      assert(typeof GPUOutOfMemoryError != "undefined");
      if (ev.error instanceof GPUValidationError) type = Validation; else if (ev.error instanceof GPUOutOfMemoryError) type = OutOfMemory;
      // TODO: Implement GPUInternalError
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

var _wgpuInstanceCreateSurface = (instancePtr, descriptor) => {
  assert(descriptor);
  var nextInChainPtr = SAFE_HEAP_LOAD(((descriptor) >> 2) * 4, 4, 1);
  assert(nextInChainPtr !== 0);
  assert(262144 === SAFE_HEAP_LOAD((((nextInChainPtr) + (4)) >> 2) * 4, 4, 1));
  var sourceCanvasHTMLSelector = nextInChainPtr;
  assert(sourceCanvasHTMLSelector);
  assert(SAFE_HEAP_LOAD(((sourceCanvasHTMLSelector) >> 2) * 4, 4, 1) === 0);
  var selectorPtr = SAFE_HEAP_LOAD((((sourceCanvasHTMLSelector) + (8)) >> 2) * 4, 4, 1);
  assert(selectorPtr);
  var canvas = findCanvasEventTarget(selectorPtr);
  var context = canvas.getContext("webgpu");
  assert(context);
  if (!context) return 0;
  var labelPtr = SAFE_HEAP_LOAD((((descriptor) + (4)) >> 2) * 4, 4, 1);
  if (labelPtr) context.surfaceLabelWebGPU = UTF8ToString(labelPtr);
  var ptr = _emwgpuCreateSurface();
  WebGPU._tableInsert(ptr, context);
  return ptr;
};

var _wgpuQueueSubmit = (queuePtr, commandCount, commands) => {
  assert(commands % 4 === 0);
  var queue = WebGPU._tableGet(queuePtr);
  var cmds = Array.from(HEAP32.subarray((((commands) >> 2)), ((commands + commandCount * 4) >> 2)), id => WebGPU._tableGet(id));
  queue.submit(cmds);
};

var _wgpuRenderPassEncoderDraw = (passPtr, vertexCount, instanceCount, firstVertex, firstInstance) => {
  var pass = WebGPU._tableGet(passPtr);
  pass.draw(vertexCount, instanceCount, firstVertex, firstInstance);
};

var _wgpuRenderPassEncoderEnd = encoderPtr => {
  var encoder = WebGPU._tableGet(encoderPtr);
  encoder.end();
};

var _wgpuRenderPassEncoderSetPipeline = (passPtr, pipelinePtr) => {
  var pass = WebGPU._tableGet(passPtr);
  var pipeline = WebGPU._tableGet(pipelinePtr);
  pass.setPipeline(pipeline);
};

var _wgpuSurfaceConfigure = (surfacePtr, config) => {
  assert(config);
  assert(SAFE_HEAP_LOAD(((config) >> 2) * 4, 4, 1) === 0);
  var devicePtr = SAFE_HEAP_LOAD((((config) + (4)) >> 2) * 4, 4, 1);
  var context = WebGPU._tableGet(surfacePtr);
  var viewFormatCount = SAFE_HEAP_LOAD((((config) + (24)) >> 2) * 4, 4, 1);
  var viewFormats = SAFE_HEAP_LOAD((((config) + (28)) >> 2) * 4, 4, 1);
  assert(viewFormatCount === 0 && viewFormats === 0, "TODO: Support viewFormats.");
  assert(1 === SAFE_HEAP_LOAD((((config) + (44)) >> 2) * 4, 4, 1));
  var canvasSize = [ SAFE_HEAP_LOAD((((config) + (36)) >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((((config) + (40)) >> 2) * 4, 4, 1) ];
  if (canvasSize[0] !== 0) {
    context["canvas"]["width"] = canvasSize[0];
  }
  if (canvasSize[1] !== 0) {
    context["canvas"]["height"] = canvasSize[1];
  }
  var configuration = {
    "device": WebGPU._tableGet(devicePtr),
    "format": WebGPU.TextureFormat[SAFE_HEAP_LOAD((((config) + (8)) >> 2) * 4, 4, 1)],
    "usage": SAFE_HEAP_LOAD((((config) + (16)) >> 2) * 4, 4, 1),
    "alphaMode": WebGPU.CompositeAlphaMode[SAFE_HEAP_LOAD((((config) + (32)) >> 2) * 4, 4, 1)]
  };
  context.configure(configuration);
};

var _wgpuSurfaceGetCurrentTexture = (surfacePtr, surfaceTexturePtr) => {
  assert(surfaceTexturePtr);
  var context = WebGPU._tableGet(surfacePtr);
  try {
    var texturePtr = _emwgpuCreateTexture();
    WebGPU._tableInsert(texturePtr, context.getCurrentTexture());
    SAFE_HEAP_STORE(((surfaceTexturePtr) >> 2) * 4, texturePtr, 4);
    SAFE_HEAP_STORE((((surfaceTexturePtr) + (4)) >> 2) * 4, 0, 4);
    SAFE_HEAP_STORE((((surfaceTexturePtr) + (8)) >> 2) * 4, 1, 4);
  } catch (ex) {
    err(`wgpuSurfaceGetCurrentTexture() failed: ${ex}`);
    SAFE_HEAP_STORE(((surfaceTexturePtr) >> 2) * 4, 0, 4);
    SAFE_HEAP_STORE((((surfaceTexturePtr) + (4)) >> 2) * 4, 0, 4);
    // TODO(https://github.com/webgpu-native/webgpu-headers/issues/291): What should the status be here?
    SAFE_HEAP_STORE((((surfaceTexturePtr) + (8)) >> 2) * 4, 6, 4);
  }
};

var _wgpuTextureCreateView = (texturePtr, descriptor) => {
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
  var texture = WebGPU._tableGet(texturePtr);
  var ptr = _emwgpuCreateTextureView();
  WebGPU._tableInsert(ptr, texture.createView(desc));
  return ptr;
};

// exports
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
  /** @export */ emwgpuAdapterRequestDevice: _emwgpuAdapterRequestDevice,
  /** @export */ emwgpuDelete: _emwgpuDelete,
  /** @export */ emwgpuInstanceRequestAdapter: _emwgpuInstanceRequestAdapter,
  /** @export */ exit: _exit,
  /** @export */ fd_close: _fd_close,
  /** @export */ fd_seek: _fd_seek,
  /** @export */ fd_write: _fd_write,
  /** @export */ segfault: segfault,
  /** @export */ wgpuBufferGetConstMappedRange: _wgpuBufferGetConstMappedRange,
  /** @export */ wgpuBufferGetMappedRange: _wgpuBufferGetMappedRange,
  /** @export */ wgpuBufferMapAsync: _wgpuBufferMapAsync,
  /** @export */ wgpuBufferUnmap: _wgpuBufferUnmap,
  /** @export */ wgpuCommandEncoderBeginRenderPass: _wgpuCommandEncoderBeginRenderPass,
  /** @export */ wgpuCommandEncoderCopyBufferToBuffer: _wgpuCommandEncoderCopyBufferToBuffer,
  /** @export */ wgpuCommandEncoderCopyTextureToBuffer: _wgpuCommandEncoderCopyTextureToBuffer,
  /** @export */ wgpuCommandEncoderFinish: _wgpuCommandEncoderFinish,
  /** @export */ wgpuDeviceCreateBindGroup: _wgpuDeviceCreateBindGroup,
  /** @export */ wgpuDeviceCreateBindGroupLayout: _wgpuDeviceCreateBindGroupLayout,
  /** @export */ wgpuDeviceCreateBuffer: _wgpuDeviceCreateBuffer,
  /** @export */ wgpuDeviceCreateCommandEncoder: _wgpuDeviceCreateCommandEncoder,
  /** @export */ wgpuDeviceCreatePipelineLayout: _wgpuDeviceCreatePipelineLayout,
  /** @export */ wgpuDeviceCreateRenderPipeline: _wgpuDeviceCreateRenderPipeline,
  /** @export */ wgpuDeviceCreateShaderModule: _wgpuDeviceCreateShaderModule,
  /** @export */ wgpuDeviceCreateTexture: _wgpuDeviceCreateTexture,
  /** @export */ wgpuDeviceSetUncapturedErrorCallback: _wgpuDeviceSetUncapturedErrorCallback,
  /** @export */ wgpuInstanceCreateSurface: _wgpuInstanceCreateSurface,
  /** @export */ wgpuQueueSubmit: _wgpuQueueSubmit,
  /** @export */ wgpuRenderPassEncoderDraw: _wgpuRenderPassEncoderDraw,
  /** @export */ wgpuRenderPassEncoderEnd: _wgpuRenderPassEncoderEnd,
  /** @export */ wgpuRenderPassEncoderSetPipeline: _wgpuRenderPassEncoderSetPipeline,
  /** @export */ wgpuSurfaceConfigure: _wgpuSurfaceConfigure,
  /** @export */ wgpuSurfaceGetCurrentTexture: _wgpuSurfaceGetCurrentTexture,
  /** @export */ wgpuTextureCreateView: _wgpuTextureCreateView
};

var wasmExports = createWasm();

var ___wasm_call_ctors = createExportWrapper("__wasm_call_ctors", 0);

var _main = Module["_main"] = createExportWrapper("main", 2);

var _emwgpuCreateBindGroup = createExportWrapper("emwgpuCreateBindGroup", 0);

var _emwgpuCreateBindGroupLayout = createExportWrapper("emwgpuCreateBindGroupLayout", 0);

var _emwgpuCreateBuffer = createExportWrapper("emwgpuCreateBuffer", 0);

var _emwgpuCreateCommandBuffer = createExportWrapper("emwgpuCreateCommandBuffer", 0);

var _emwgpuCreateCommandEncoder = createExportWrapper("emwgpuCreateCommandEncoder", 0);

var _emwgpuCreatePipelineLayout = createExportWrapper("emwgpuCreatePipelineLayout", 0);

var _emwgpuCreateQueue = createExportWrapper("emwgpuCreateQueue", 0);

var _emwgpuCreateRenderPassEncoder = createExportWrapper("emwgpuCreateRenderPassEncoder", 0);

var _emwgpuCreateRenderPipeline = createExportWrapper("emwgpuCreateRenderPipeline", 0);

var _emwgpuCreateShaderModule = createExportWrapper("emwgpuCreateShaderModule", 0);

var _emwgpuCreateSurface = createExportWrapper("emwgpuCreateSurface", 0);

var _emwgpuCreateTexture = createExportWrapper("emwgpuCreateTexture", 0);

var _emwgpuCreateTextureView = createExportWrapper("emwgpuCreateTextureView", 0);

var _emwgpuCreateAdapter = createExportWrapper("emwgpuCreateAdapter", 1);

var _emwgpuOnDeviceLostCompleted = createExportWrapper("emwgpuOnDeviceLostCompleted", 4);

var _emwgpuOnRequestAdapterCompleted = createExportWrapper("emwgpuOnRequestAdapterCompleted", 5);

var _emwgpuOnRequestDeviceCompleted = createExportWrapper("emwgpuOnRequestDeviceCompleted", 5);

var _emwgpuOnUncapturedError = createExportWrapper("emwgpuOnUncapturedError", 3);

var _free = createExportWrapper("free", 1);

var _fflush = createExportWrapper("fflush", 1);

var _emscripten_get_sbrk_ptr = createExportWrapper("emscripten_get_sbrk_ptr", 0);

var _sbrk = createExportWrapper("sbrk", 1);

var _strerror = createExportWrapper("strerror", 1);

var _memalign = createExportWrapper("memalign", 2);

var _emscripten_stack_init = () => (_emscripten_stack_init = wasmExports["emscripten_stack_init"])();

var _emscripten_stack_get_free = () => (_emscripten_stack_get_free = wasmExports["emscripten_stack_get_free"])();

var _emscripten_stack_get_base = () => (_emscripten_stack_get_base = wasmExports["emscripten_stack_get_base"])();

var _emscripten_stack_get_end = () => (_emscripten_stack_get_end = wasmExports["emscripten_stack_get_end"])();

var __emscripten_stack_restore = a0 => (__emscripten_stack_restore = wasmExports["_emscripten_stack_restore"])(a0);

var __emscripten_stack_alloc = a0 => (__emscripten_stack_alloc = wasmExports["_emscripten_stack_alloc"])(a0);

var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports["emscripten_stack_get_current"])();

var dynCall_viji = Module["dynCall_viji"] = createExportWrapper("dynCall_viji", 5);

var dynCall_jiji = Module["dynCall_jiji"] = createExportWrapper("dynCall_jiji", 5);

// include: postamble.js
// === Auto-generated postamble setup entry stuff ===
var missingLibrarySymbols = [ "writeI53ToI64", "writeI53ToI64Clamped", "writeI53ToI64Signaling", "writeI53ToU64Clamped", "writeI53ToU64Signaling", "readI53FromU64", "convertI32PairToI53", "convertU32PairToI53", "getTempRet0", "setTempRet0", "zeroMemory", "growMemory", "strError", "inetPton4", "inetNtop4", "inetPton6", "inetNtop6", "readSockaddr", "writeSockaddr", "initRandomFill", "randomFill", "emscriptenLog", "readEmAsmArgs", "jstoi_q", "getExecutableName", "listenOnce", "autoResumeAudioContext", "dynCallLegacy", "getDynCaller", "dynCall", "runtimeKeepalivePush", "runtimeKeepalivePop", "asmjsMangle", "asyncLoad", "mmapAlloc", "HandleAllocator", "getNativeTypeSize", "STACK_SIZE", "STACK_ALIGN", "POINTER_SIZE", "ASSERTIONS", "getCFunc", "ccall", "cwrap", "uleb128Encode", "sigToWasmTypes", "generateFuncType", "convertJsFunctionToWasm", "getEmptyTableSlot", "updateTableMap", "getFunctionAddress", "addFunction", "removeFunction", "reallyNegative", "strLen", "reSign", "formatString", "intArrayFromString", "intArrayToString", "AsciiToString", "stringToAscii", "UTF16ToString", "stringToUTF16", "lengthBytesUTF16", "UTF32ToString", "stringToUTF32", "lengthBytesUTF32", "stringToNewUTF8", "writeArrayToMemory", "registerKeyEventCallback", "getBoundingClientRect", "fillMouseEventData", "registerMouseEventCallback", "registerWheelEventCallback", "registerUiEventCallback", "registerFocusEventCallback", "fillDeviceOrientationEventData", "registerDeviceOrientationEventCallback", "fillDeviceMotionEventData", "registerDeviceMotionEventCallback", "screenOrientation", "fillOrientationChangeEventData", "registerOrientationChangeEventCallback", "fillFullscreenChangeEventData", "registerFullscreenChangeEventCallback", "JSEvents_requestFullscreen", "JSEvents_resizeCanvasForFullscreen", "registerRestoreOldStyle", "hideEverythingExceptGivenElement", "restoreHiddenElements", "setLetterbox", "softFullscreenResizeWebGLRenderTarget", "doRequestFullscreen", "fillPointerlockChangeEventData", "registerPointerlockChangeEventCallback", "registerPointerlockErrorEventCallback", "requestPointerLock", "fillVisibilityChangeEventData", "registerVisibilityChangeEventCallback", "registerTouchEventCallback", "fillGamepadEventData", "registerGamepadEventCallback", "registerBeforeUnloadEventCallback", "fillBatteryEventData", "battery", "registerBatteryEventCallback", "setCanvasElementSize", "getCanvasElementSize", "jsStackTrace", "getCallstack", "convertPCtoSourceLocation", "getEnvStrings", "checkWasiClock", "wasiRightsToMuslOFlags", "wasiOFlagsToMuslOFlags", "createDyncallWrapper", "setImmediateWrapped", "clearImmediateWrapped", "polyfillSetImmediate", "getPromise", "makePromise", "idsToPromises", "makePromiseCallback", "Browser_asyncPrepareDataCounter", "isLeapYear", "ydayFromDate", "arraySum", "addDays", "getSocketFromFD", "getSocketAddress", "FS_createPreloadedFile", "FS_modeStringToFlags", "FS_getMode", "FS_stdin_getChar", "FS_unlink", "FS_createDataFile", "FS_mkdirTree", "_setNetworkCallback", "heapObjectForWebGLType", "toTypedArrayIndex", "webgl_enable_ANGLE_instanced_arrays", "webgl_enable_OES_vertex_array_object", "webgl_enable_WEBGL_draw_buffers", "webgl_enable_WEBGL_multi_draw", "emscriptenWebGLGet", "computeUnpackAlignedImageSize", "colorChannelsInGlTextureFormat", "emscriptenWebGLGetTexPixelData", "emscriptenWebGLGetUniform", "webglGetUniformLocation", "webglPrepareUniformLocationsBeforeFirstUse", "webglGetLeftBracePos", "emscriptenWebGLGetVertexAttrib", "__glGetActiveAttribOrUniform", "writeGLArray", "registerWebGlEventCallback", "runAndAbortIfError", "ALLOC_NORMAL", "ALLOC_STACK", "allocate", "writeStringToMemory", "writeAsciiToMemory", "setErrNo", "demangle", "stackTrace" ];

missingLibrarySymbols.forEach(missingLibrarySymbol);

var unexportedSymbols = [ "run", "addOnPreRun", "addOnInit", "addOnPreMain", "addOnExit", "addOnPostRun", "addRunDependency", "removeRunDependency", "out", "err", "callMain", "abort", "wasmMemory", "wasmExports", "writeStackCookie", "checkStackCookie", "readI53FromI64", "convertI32PairToI53Checked", "stackSave", "stackRestore", "stackAlloc", "ptrToString", "exitJS", "getHeapMax", "abortOnCannotGrowMemory", "ENV", "ERRNO_CODES", "DNS", "Protocols", "Sockets", "timers", "warnOnce", "readEmAsmArgsArray", "jstoi_s", "handleException", "keepRuntimeAlive", "callUserCallback", "maybeExit", "alignMemory", "wasmTable", "noExitRuntime", "freeTableIndexes", "functionsInTableMap", "unSign", "setValue", "getValue", "PATH", "PATH_FS", "UTF8Decoder", "UTF8ArrayToString", "UTF8ToString", "stringToUTF8Array", "stringToUTF8", "lengthBytesUTF8", "UTF16Decoder", "stringToUTF8OnStack", "JSEvents", "specialHTMLTargets", "maybeCStringToJsString", "findEventTarget", "findCanvasEventTarget", "currentFullscreenStrategy", "restoreOldWindowedStyle", "UNWIND_CACHE", "ExitStatus", "flush_NO_FILESYSTEM", "safeSetTimeout", "promiseMap", "Browser", "setMainLoop", "getPreloadedImageData__data", "wget", "MONTH_DAYS_REGULAR", "MONTH_DAYS_LEAP", "MONTH_DAYS_REGULAR_CUMULATIVE", "MONTH_DAYS_LEAP_CUMULATIVE", "SYSCALLS", "preloadPlugins", "FS_stdin_getChar_buffer", "FS_createPath", "FS_createDevice", "FS_readFile", "FS", "FS_createLazyFile", "MEMFS", "TTY", "PIPEFS", "SOCKFS", "tempFixedLengthArray", "miniTempWebGLFloatBuffers", "miniTempWebGLIntBuffers", "GL", "AL", "GLUT", "EGL", "GLEW", "IDBStore", "SDL", "SDL_gfx", "allocateUTF8", "allocateUTF8OnStack", "print", "printErr", "WebGPU", "JsValStore" ];

unexportedSymbols.forEach(unexportedRuntimeSymbol);

var calledRun;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!calledRun) run();
  if (!calledRun) dependenciesFulfilled = runCaller;
};

// try this again later, after new deps are fulfilled
function callMain() {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
  assert(__ATPRERUN__.length == 0, "cannot call main when preRun functions remain to be called");
  var entryFunction = _main;
  var argc = 0;
  var argv = 0;
  try {
    var ret = entryFunction(argc, argv);
    // if we're not running an evented main loop, it's time to exit
    exitJS(ret, /* implicit = */ true);
    return ret;
  } catch (e) {
    return handleException(e);
  }
}

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

function run() {
  if (runDependencies > 0) {
    return;
  }
  stackCheckInit();
  preRun();
  // a preRun added a dependency, run will be called later
  if (runDependencies > 0) {
    return;
  }
  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    if (calledRun) return;
    calledRun = true;
    Module["calledRun"] = true;
    if (ABORT) return;
    initRuntime();
    preMain();
    Module["onRuntimeInitialized"]?.();
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
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = x => {
    has = true;
  };
  try {
    // it doesn't matter if it fails
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

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;

if (Module["noInitialRun"]) shouldRunNow = false;

run();
