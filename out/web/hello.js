var Module = typeof Module != "undefined" ? Module : {};

var moduleOverrides = Object.assign({}, Module);

var arguments_ = [];

var thisProgram = "./this.program";

var quit_ = (status, toThrow) => {
 throw toThrow;
};

var ENVIRONMENT_IS_WEB = typeof window == "object";

var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";

var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";

var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (Module["ENVIRONMENT"]) {
 throw new Error("Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)");
}

var scriptDirectory = "";

function locateFile(path) {
 if (Module["locateFile"]) {
  return Module["locateFile"](path, scriptDirectory);
 }
 return scriptDirectory + path;
}

var read_, readAsync, readBinary, setWindowTitle;

function logExceptionOnExit(e) {
 if (e instanceof ExitStatus) return;
 let toLog = e;
 if (e && typeof e == "object" && e.stack) {
  toLog = [ e, e.stack ];
 }
 err("exiting due to exception: " + toLog);
}

if (ENVIRONMENT_IS_NODE) {
 if (typeof process == "undefined" || !process.release || process.release.name !== "node") throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = require("path").dirname(scriptDirectory) + "/";
 } else {
  scriptDirectory = __dirname + "/";
 }
 var fs, nodePath;
 if (typeof require === "function") {
  fs = require("fs");
  nodePath = require("path");
 }
 read_ = (filename, binary) => {
  filename = nodePath["normalize"](filename);
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
 readAsync = (filename, onload, onerror) => {
  filename = nodePath["normalize"](filename);
  fs.readFile(filename, function(err, data) {
   if (err) onerror(err); else onload(data.buffer);
  });
 };
 if (process["argv"].length > 1) {
  thisProgram = process["argv"][1].replace(/\\/g, "/");
 }
 arguments_ = process["argv"].slice(2);
 if (typeof module != "undefined") {
  module["exports"] = Module;
 }
 process["on"]("uncaughtException", function(ex) {
  if (!(ex instanceof ExitStatus)) {
   throw ex;
  }
 });
 process["on"]("unhandledRejection", function(reason) {
  throw reason;
 });
 quit_ = (status, toThrow) => {
  if (keepRuntimeAlive()) {
   process["exitCode"] = status;
   throw toThrow;
  }
  logExceptionOnExit(toThrow);
  process["exit"](status);
 };
 Module["inspect"] = function() {
  return "[Emscripten Module object]";
 };
} else if (ENVIRONMENT_IS_SHELL) {
 if (typeof process == "object" && typeof require === "function" || typeof window == "object" || typeof importScripts == "function") throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
 if (typeof read != "undefined") {
  read_ = function shell_read(f) {
   return read(f);
  };
 }
 readBinary = function readBinary(f) {
  let data;
  if (typeof readbuffer == "function") {
   return new Uint8Array(readbuffer(f));
  }
  data = read(f, "binary");
  assert(typeof data == "object");
  return data;
 };
 readAsync = function readAsync(f, onload, onerror) {
  setTimeout(() => onload(readBinary(f)), 0);
 };
 if (typeof scriptArgs != "undefined") {
  arguments_ = scriptArgs;
 } else if (typeof arguments != "undefined") {
  arguments_ = arguments;
 }
 if (typeof quit == "function") {
  quit_ = (status, toThrow) => {
   logExceptionOnExit(toThrow);
   quit(status);
  };
 }
 if (typeof print != "undefined") {
  if (typeof console == "undefined") console = {};
  console.log = print;
  console.warn = console.error = typeof printErr != "undefined" ? printErr : print;
 }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 if (ENVIRONMENT_IS_WORKER) {
  scriptDirectory = self.location.href;
 } else if (typeof document != "undefined" && document.currentScript) {
  scriptDirectory = document.currentScript.src;
 }
 if (scriptDirectory.indexOf("blob:") !== 0) {
  scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1);
 } else {
  scriptDirectory = "";
 }
 if (!(typeof window == "object" || typeof importScripts == "function")) throw new Error("not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)");
 {
  read_ = url => {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", url, false);
   xhr.send(null);
   return xhr.responseText;
  };
  if (ENVIRONMENT_IS_WORKER) {
   readBinary = url => {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.responseType = "arraybuffer";
    xhr.send(null);
    return new Uint8Array(xhr.response);
   };
  }
  readAsync = (url, onload, onerror) => {
   var xhr = new XMLHttpRequest();
   xhr.open("GET", url, true);
   xhr.responseType = "arraybuffer";
   xhr.onload = () => {
    if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
     onload(xhr.response);
     return;
    }
    onerror();
   };
   xhr.onerror = onerror;
   xhr.send(null);
  };
 }
 setWindowTitle = title => document.title = title;
} else {
 throw new Error("environment detection error");
}

var out = Module["print"] || console.log.bind(console);

var err = Module["printErr"] || console.warn.bind(console);

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

assert(typeof Module["setWindowTitle"] == "undefined", "Module.setWindowTitle option was removed (modify setWindowTitle in JS)");

assert(typeof Module["TOTAL_MEMORY"] == "undefined", "Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY");

legacyModuleProp("read", "read_");

legacyModuleProp("readAsync", "readAsync");

legacyModuleProp("readBinary", "readBinary");

legacyModuleProp("setWindowTitle", "setWindowTitle");

var IDBFS = "IDBFS is no longer included by default; build with -lidbfs.js";

var PROXYFS = "PROXYFS is no longer included by default; build with -lproxyfs.js";

var WORKERFS = "WORKERFS is no longer included by default; build with -lworkerfs.js";

var NODEFS = "NODEFS is no longer included by default; build with -lnodefs.js";

assert(!ENVIRONMENT_IS_SHELL, "shell environment detected but not enabled at build time.  Add 'shell' to `-sENVIRONMENT` to enable.");

var STACK_ALIGN = 16;

var POINTER_SIZE = 4;

function getNativeTypeSize(type) {
 switch (type) {
 case "i1":
 case "i8":
 case "u8":
  return 1;

 case "i16":
 case "u16":
  return 2;

 case "i32":
 case "u32":
  return 4;

 case "i64":
 case "u64":
  return 8;

 case "float":
  return 4;

 case "double":
  return 8;

 default:
  {
   if (type[type.length - 1] === "*") {
    return POINTER_SIZE;
   }
   if (type[0] === "i") {
    const bits = Number(type.substr(1));
    assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
    return bits / 8;
   }
   return 0;
  }
 }
}

function legacyModuleProp(prop, newName) {
 if (!Object.getOwnPropertyDescriptor(Module, prop)) {
  Object.defineProperty(Module, prop, {
   configurable: true,
   get: function() {
    abort("Module." + prop + " has been replaced with plain " + newName + " (the initial value can be provided on Module, but after startup the value is only looked for on a local variable of that name)");
   }
  });
 }
}

function ignoredModuleProp(prop) {
 if (Object.getOwnPropertyDescriptor(Module, prop)) {
  abort("`Module." + prop + "` was supplied but `" + prop + "` not included in INCOMING_MODULE_JS_API");
 }
}

function isExportedByForceFilesystem(name) {
 return name === "FS_createPath" || name === "FS_createDataFile" || name === "FS_createPreloadedFile" || name === "FS_unlink" || name === "addRunDependency" || name === "FS_createLazyFile" || name === "FS_createDevice" || name === "removeRunDependency";
}

function missingLibrarySymbol(sym) {
 if (typeof globalThis !== "undefined" && !Object.getOwnPropertyDescriptor(globalThis, sym)) {
  Object.defineProperty(globalThis, sym, {
   configurable: true,
   get: function() {
    var msg = "`" + sym + "` is a library symbol and not included by default; add it to your library.js __deps or to DEFAULT_LIBRARY_FUNCS_TO_INCLUDE on the command line";
    var librarySymbol = sym;
    if (!librarySymbol.startsWith("_")) {
     librarySymbol = "$" + sym;
    }
    msg += " (e.g. -sDEFAULT_LIBRARY_FUNCS_TO_INCLUDE=" + librarySymbol + ")";
    if (isExportedByForceFilesystem(sym)) {
     msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
    }
    warnOnce(msg);
    return undefined;
   }
  });
 }
}

function unexportedRuntimeSymbol(sym) {
 if (!Object.getOwnPropertyDescriptor(Module, sym)) {
  Object.defineProperty(Module, sym, {
   configurable: true,
   get: function() {
    var msg = "'" + sym + "' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the FAQ)";
    if (isExportedByForceFilesystem(sym)) {
     msg += ". Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you";
    }
    abort(msg);
   }
  });
 }
}

var wasmBinary;

if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];

legacyModuleProp("wasmBinary", "wasmBinary");

var noExitRuntime = Module["noExitRuntime"] || true;

legacyModuleProp("noExitRuntime", "noExitRuntime");

if (typeof WebAssembly != "object") {
 abort("no native wasm support detected");
}

function getSafeHeapType(bytes, isFloat) {
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
  assert(0);
 }
}

function SAFE_HEAP_STORE(dest, value, bytes, isFloat) {
 if (dest <= 0) abort("segmentation fault storing " + bytes + " bytes to address " + dest);
 if (dest % bytes !== 0) abort("alignment error storing to address " + dest + ", which was expected to be aligned to a multiple of " + bytes);
 if (runtimeInitialized) {
  var brk = _sbrk() >>> 0;
  if (dest + bytes > brk) abort("segmentation fault, exceeded the top of the available dynamic heap when storing " + bytes + " bytes to address " + dest + ". DYNAMICTOP=" + brk);
  assert(brk >= _emscripten_stack_get_base());
  assert(brk <= HEAP8.length);
 }
 setValue_safe(dest, value, getSafeHeapType(bytes, isFloat));
 return value;
}

function SAFE_HEAP_STORE_D(dest, value, bytes) {
 return SAFE_HEAP_STORE(dest, value, bytes, true);
}

function SAFE_HEAP_LOAD(dest, bytes, unsigned, isFloat) {
 if (dest <= 0) abort("segmentation fault loading " + bytes + " bytes from address " + dest);
 if (dest % bytes !== 0) abort("alignment error loading from address " + dest + ", which was expected to be aligned to a multiple of " + bytes);
 if (runtimeInitialized) {
  var brk = _sbrk() >>> 0;
  if (dest + bytes > brk) abort("segmentation fault, exceeded the top of the available dynamic heap when loading " + bytes + " bytes from address " + dest + ". DYNAMICTOP=" + brk);
  assert(brk >= _emscripten_stack_get_base());
  assert(brk <= HEAP8.length);
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
  abort("Function table mask error: function pointer is " + value + " which is masked by " + mask + ", the likely cause of this is that the function pointer is being called by the wrong type.");
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

function assert(condition, text) {
 if (!condition) {
  abort("Assertion failed" + (text ? ": " + text : ""));
 }
}

var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;

function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
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
   str += String.fromCharCode((u0 & 31) << 6 | u1);
   continue;
  }
  var u2 = heapOrArray[idx++] & 63;
  if ((u0 & 240) == 224) {
   u0 = (u0 & 15) << 12 | u1 << 6 | u2;
  } else {
   if ((u0 & 248) != 240) warnOnce("Invalid UTF-8 leading byte 0x" + u0.toString(16) + " encountered when deserializing a UTF-8 string in wasm memory to a JS string!");
   u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63;
  }
  if (u0 < 65536) {
   str += String.fromCharCode(u0);
  } else {
   var ch = u0 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  }
 }
 return str;
}

function UTF8ToString(ptr, maxBytesToRead) {
 return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : "";
}

function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) {
   var u1 = str.charCodeAt(++i);
   u = 65536 + ((u & 1023) << 10) | u1 & 1023;
  }
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   heap[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   heap[outIdx++] = 192 | u >> 6;
   heap[outIdx++] = 128 | u & 63;
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   heap[outIdx++] = 224 | u >> 12;
   heap[outIdx++] = 128 | u >> 6 & 63;
   heap[outIdx++] = 128 | u & 63;
  } else {
   if (outIdx + 3 >= endIdx) break;
   if (u > 1114111) warnOnce("Invalid Unicode code point 0x" + u.toString(16) + " encountered when serializing a JS string to a UTF-8 string in wasm memory! (Valid unicode code points should be in range 0-0x10FFFF).");
   heap[outIdx++] = 240 | u >> 18;
   heap[outIdx++] = 128 | u >> 12 & 63;
   heap[outIdx++] = 128 | u >> 6 & 63;
   heap[outIdx++] = 128 | u & 63;
  }
 }
 heap[outIdx] = 0;
 return outIdx - startIdx;
}

function stringToUTF8(str, outPtr, maxBytesToWrite) {
 assert(typeof maxBytesToWrite == "number", "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
 return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}

function lengthBytesUTF8(str) {
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
}

var HEAP, buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

function updateGlobalBufferAndViews(buf) {
 buffer = buf;
 Module["HEAP8"] = HEAP8 = new Int8Array(buf);
 Module["HEAP16"] = HEAP16 = new Int16Array(buf);
 Module["HEAP32"] = HEAP32 = new Int32Array(buf);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(buf);
}

var TOTAL_STACK = 5242880;

if (Module["TOTAL_STACK"]) assert(TOTAL_STACK === Module["TOTAL_STACK"], "the stack size can no longer be determined at runtime");

var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;

legacyModuleProp("INITIAL_MEMORY", "INITIAL_MEMORY");

assert(INITIAL_MEMORY >= TOTAL_STACK, "INITIAL_MEMORY should be larger than TOTAL_STACK, was " + INITIAL_MEMORY + "! (TOTAL_STACK=" + TOTAL_STACK + ")");

assert(typeof Int32Array != "undefined" && typeof Float64Array !== "undefined" && Int32Array.prototype.subarray != undefined && Int32Array.prototype.set != undefined, "JS engine does not provide full typed array support");

assert(!Module["wasmMemory"], "Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally");

assert(INITIAL_MEMORY == 16777216, "Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically");

var wasmTable;

function writeStackCookie() {
 var max = _emscripten_stack_get_end();
 assert((max & 3) == 0);
 SAFE_HEAP_STORE((max >> 2) * 4, 34821223, 4);
 SAFE_HEAP_STORE((max + 4 >> 2) * 4, 2310721022, 4);
}

function checkStackCookie() {
 if (ABORT) return;
 var max = _emscripten_stack_get_end();
 var cookie1 = SAFE_HEAP_LOAD((max >> 2) * 4, 4, 1);
 var cookie2 = SAFE_HEAP_LOAD((max + 4 >> 2) * 4, 4, 1);
 if (cookie1 != 34821223 || cookie2 != 2310721022) {
  abort("Stack overflow! Stack cookie has been overwritten at 0x" + max.toString(16) + ", expected hex dwords 0x89BACDFE and 0x2135467, but received 0x" + cookie2.toString(16) + " 0x" + cookie1.toString(16));
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

function keepRuntimeAlive() {
 return noExitRuntime;
}

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
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (id) {
  assert(!runDependencyTracking[id]);
  runDependencyTracking[id] = 1;
  if (runDependencyWatcher === null && typeof setInterval != "undefined") {
   runDependencyWatcher = setInterval(function() {
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
     err("dependency: " + dep);
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
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
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

function abort(what) {
 {
  if (Module["onAbort"]) {
   Module["onAbort"](what);
  }
 }
 what = "Aborted(" + what + ")";
 err(what);
 ABORT = true;
 EXITSTATUS = 1;
 var e = new WebAssembly.RuntimeError(what);
 throw e;
}

var FS = {
 error: function() {
  abort("Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM");
 },
 init: function() {
  FS.error();
 },
 createDataFile: function() {
  FS.error();
 },
 createPreloadedFile: function() {
  FS.error();
 },
 createLazyFile: function() {
  FS.error();
 },
 open: function() {
  FS.error();
 },
 mkdev: function() {
  FS.error();
 },
 registerDevice: function() {
  FS.error();
 },
 analyzePath: function() {
  FS.error();
 },
 loadFilesFromDB: function() {
  FS.error();
 },
 ErrnoError: function ErrnoError() {
  FS.error();
 }
};

Module["FS_createDataFile"] = FS.createDataFile;

Module["FS_createPreloadedFile"] = FS.createPreloadedFile;

var dataURIPrefix = "data:application/octet-stream;base64,";

function isDataURI(filename) {
 return filename.startsWith(dataURIPrefix);
}

function isFileURI(filename) {
 return filename.startsWith("file://");
}

function createExportWrapper(name, fixedasm) {
 return function() {
  var displayName = name;
  var asm = fixedasm;
  if (!fixedasm) {
   asm = Module["asm"];
  }
  assert(runtimeInitialized, "native function `" + displayName + "` called before runtime initialization");
  if (!asm[name]) {
   assert(asm[name], "exported native function `" + displayName + "` not found");
  }
  return asm[name].apply(null, arguments);
 };
}

var wasmBinaryFile;

wasmBinaryFile = "hello.wasm";

if (!isDataURI(wasmBinaryFile)) {
 wasmBinaryFile = locateFile(wasmBinaryFile);
}

function getBinary(file) {
 try {
  if (file == wasmBinaryFile && wasmBinary) {
   return new Uint8Array(wasmBinary);
  }
  if (readBinary) {
   return readBinary(file);
  }
  throw "both async and sync fetching of the wasm failed";
 } catch (err) {
  abort(err);
 }
}

function getBinaryPromise() {
 if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
  if (typeof fetch == "function" && !isFileURI(wasmBinaryFile)) {
   return fetch(wasmBinaryFile, {
    credentials: "same-origin"
   }).then(function(response) {
    if (!response["ok"]) {
     throw "failed to load wasm binary file at '" + wasmBinaryFile + "'";
    }
    return response["arrayBuffer"]();
   }).catch(function() {
    return getBinary(wasmBinaryFile);
   });
  } else {
   if (readAsync) {
    return new Promise(function(resolve, reject) {
     readAsync(wasmBinaryFile, function(response) {
      resolve(new Uint8Array(response));
     }, reject);
    });
   }
  }
 }
 return Promise.resolve().then(function() {
  return getBinary(wasmBinaryFile);
 });
}

function createWasm() {
 var info = {
  "env": asmLibraryArg,
  "wasi_snapshot_preview1": asmLibraryArg
 };
 function receiveInstance(instance, module) {
  var exports = instance.exports;
  Module["asm"] = exports;
  wasmMemory = Module["asm"]["memory"];
  assert(wasmMemory, "memory not found in wasm exports");
  updateGlobalBufferAndViews(wasmMemory.buffer);
  wasmTable = Module["asm"]["__indirect_function_table"];
  assert(wasmTable, "table not found in wasm exports");
  addOnInit(Module["asm"]["__wasm_call_ctors"]);
  removeRunDependency("wasm-instantiate");
 }
 addRunDependency("wasm-instantiate");
 var trueModule = Module;
 function receiveInstantiationResult(result) {
  assert(Module === trueModule, "the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?");
  trueModule = null;
  receiveInstance(result["instance"]);
 }
 function instantiateArrayBuffer(receiver) {
  return getBinaryPromise().then(function(binary) {
   return WebAssembly.instantiate(binary, info);
  }).then(function(instance) {
   return instance;
  }).then(receiver, function(reason) {
   err("failed to asynchronously prepare wasm: " + reason);
   if (isFileURI(wasmBinaryFile)) {
    err("warning: Loading from a file URI (" + wasmBinaryFile + ") is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing");
   }
   abort(reason);
  });
 }
 function instantiateAsync() {
  if (!wasmBinary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(wasmBinaryFile) && !isFileURI(wasmBinaryFile) && !ENVIRONMENT_IS_NODE && typeof fetch == "function") {
   return fetch(wasmBinaryFile, {
    credentials: "same-origin"
   }).then(function(response) {
    var result = WebAssembly.instantiateStreaming(response, info);
    return result.then(receiveInstantiationResult, function(reason) {
     err("wasm streaming compile failed: " + reason);
     err("falling back to ArrayBuffer instantiation");
     return instantiateArrayBuffer(receiveInstantiationResult);
    });
   });
  } else {
   return instantiateArrayBuffer(receiveInstantiationResult);
  }
 }
 if (Module["instantiateWasm"]) {
  try {
   var exports = Module["instantiateWasm"](info, receiveInstance);
   return exports;
  } catch (e) {
   err("Module.instantiateWasm callback failed with error: " + e);
   return false;
  }
 }
 instantiateAsync();
 return {};
}

var tempDouble;

var tempI64;

var ASM_CONSTS = {};

function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = "Program terminated with exit(" + status + ")";
 this.status = status;
}

function callRuntimeCallbacks(callbacks) {
 while (callbacks.length > 0) {
  callbacks.shift()(Module);
 }
}

function withStackSave(f) {
 var stack = stackSave();
 var ret = f();
 stackRestore(stack);
 return ret;
}

function demangle(func) {
 warnOnce("warning: build with -sDEMANGLE_SUPPORT to link in libcxxabi demangling");
 return func;
}

function demangleAll(text) {
 var regex = /\b_Z[\w\d_]+/g;
 return text.replace(regex, function(x) {
  var y = demangle(x);
  return x === y ? x : y + " [" + x + "]";
 });
}

function getValue(ptr, type = "i8") {
 if (type.endsWith("*")) type = "*";
 switch (type) {
 case "i1":
  return SAFE_HEAP_LOAD(ptr >> 0, 1, 0);

 case "i8":
  return SAFE_HEAP_LOAD(ptr >> 0, 1, 0);

 case "i16":
  return SAFE_HEAP_LOAD((ptr >> 1) * 2, 2, 0);

 case "i32":
  return SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 0);

 case "i64":
  return SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 0);

 case "float":
  return SAFE_HEAP_LOAD_D((ptr >> 2) * 4, 4, 0);

 case "double":
  return SAFE_HEAP_LOAD_D((ptr >> 3) * 8, 8, 0);

 case "*":
  return SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 1);

 default:
  abort("invalid type for getValue: " + type);
 }
 return null;
}

function getValue_safe(ptr, type) {
 switch (type) {
 case "i1":
  return HEAP8[ptr >> 0];

 case "i8":
  return HEAP8[ptr >> 0];

 case "i16":
  return HEAP16[ptr >> 1];

 case "i32":
  return HEAP32[ptr >> 2];

 case "i64":
  return HEAP32[ptr >> 2];

 case "float":
  return HEAPF32[ptr >> 2];

 case "double":
  return HEAPF64[ptr >> 3];

 default:
  abort("invalid type for getValue: " + type);
 }
}

function handleException(e) {
 if (e instanceof ExitStatus || e == "unwind") {
  return EXITSTATUS;
 }
 quit_(1, e);
}

function jsStackTrace() {
 var error = new Error();
 if (!error.stack) {
  try {
   throw new Error();
  } catch (e) {
   error = e;
  }
  if (!error.stack) {
   return "(no stack trace available)";
  }
 }
 return error.stack.toString();
}

function setValue(ptr, value, type = "i8") {
 if (type.endsWith("*")) type = "*";
 switch (type) {
 case "i1":
  SAFE_HEAP_STORE(ptr >> 0, value, 1);
  break;

 case "i8":
  SAFE_HEAP_STORE(ptr >> 0, value, 1);
  break;

 case "i16":
  SAFE_HEAP_STORE((ptr >> 1) * 2, value, 2);
  break;

 case "i32":
  SAFE_HEAP_STORE((ptr >> 2) * 4, value, 4);
  break;

 case "i64":
  tempI64 = [ value >>> 0, (tempDouble = value, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
  SAFE_HEAP_STORE((ptr >> 2) * 4, tempI64[0], 4), SAFE_HEAP_STORE((ptr + 4 >> 2) * 4, tempI64[1], 4);
  break;

 case "float":
  SAFE_HEAP_STORE_D((ptr >> 2) * 4, value, 4);
  break;

 case "double":
  SAFE_HEAP_STORE_D((ptr >> 3) * 8, value, 8);
  break;

 case "*":
  SAFE_HEAP_STORE((ptr >> 2) * 4, value, 4);
  break;

 default:
  abort("invalid type for setValue: " + type);
 }
}

function setValue_safe(ptr, value, type) {
 switch (type) {
 case "i1":
  HEAP8[ptr >> 0] = value;
  break;

 case "i8":
  HEAP8[ptr >> 0] = value;
  break;

 case "i16":
  HEAP16[ptr >> 1] = value;
  break;

 case "i32":
  HEAP32[ptr >> 2] = value;
  break;

 case "i64":
  tempI64 = [ value >>> 0, (tempDouble = value, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0) ], 
  HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
  break;

 case "float":
  HEAPF32[ptr >> 2] = value;
  break;

 case "double":
  HEAPF64[ptr >> 3] = value;
  break;

 default:
  abort("invalid type for setValue: " + type);
 }
}

function stackTrace() {
 var js = jsStackTrace();
 if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
 return demangleAll(js);
}

function unSign(value, bits) {
 if (value >= 0) {
  return value;
 }
 return bits <= 32 ? 2 * Math.abs(1 << bits - 1) + value : Math.pow(2, bits) + value;
}

function warnOnce(text) {
 if (!warnOnce.shown) warnOnce.shown = {};
 if (!warnOnce.shown[text]) {
  warnOnce.shown[text] = 1;
  if (ENVIRONMENT_IS_NODE) text = "warning: " + text;
  err(text);
 }
}

function writeArrayToMemory(array, buffer) {
 assert(array.length >= 0, "writeArrayToMemory array must have a length (should be an array or typed array)");
 HEAP8.set(array, buffer);
}

function ___assert_fail(condition, filename, line, func) {
 abort("Assertion failed: " + UTF8ToString(condition) + ", at: " + [ filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function" ]);
}

function _abort() {
 abort("native code called abort()");
}

function _emscripten_set_main_loop_timing(mode, value) {
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
  if (typeof setImmediate == "undefined") {
   var setImmediates = [];
   var emscriptenMainLoopMessageId = "setimmediate";
   var Browser_setImmediate_messageHandler = event => {
    if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
     event.stopPropagation();
     setImmediates.shift()();
    }
   };
   addEventListener("message", Browser_setImmediate_messageHandler, true);
   setImmediate = function Browser_emulated_setImmediate(func) {
    setImmediates.push(func);
    if (ENVIRONMENT_IS_WORKER) {
     if (Module["setImmediates"] === undefined) Module["setImmediates"] = [];
     Module["setImmediates"].push(func);
     postMessage({
      target: emscriptenMainLoopMessageId
     });
    } else postMessage(emscriptenMainLoopMessageId, "*");
   };
  }
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
   setImmediate(Browser.mainLoop.runner);
  };
  Browser.mainLoop.method = "immediate";
 }
 return 0;
}

var _emscripten_get_now;

if (ENVIRONMENT_IS_NODE) {
 _emscripten_get_now = () => {
  var t = process["hrtime"]();
  return t[0] * 1e3 + t[1] / 1e6;
 };
} else _emscripten_get_now = () => performance.now();

var SYSCALLS = {
 varargs: undefined,
 get: function() {
  assert(SYSCALLS.varargs != undefined);
  SYSCALLS.varargs += 4;
  var ret = SAFE_HEAP_LOAD((SYSCALLS.varargs - 4 >> 2) * 4, 4, 0);
  return ret;
 },
 getStr: function(ptr) {
  var ret = UTF8ToString(ptr);
  return ret;
 }
};

function _proc_exit(code) {
 EXITSTATUS = code;
 if (!keepRuntimeAlive()) {
  if (Module["onExit"]) Module["onExit"](code);
  ABORT = true;
 }
 quit_(code, new ExitStatus(code));
}

function exitJS(status, implicit) {
 EXITSTATUS = status;
 checkUnflushedContent();
 if (keepRuntimeAlive() && !implicit) {
  var msg = "program exited (with status: " + status + "), but EXIT_RUNTIME is not set, so halting execution but not exiting the runtime or preventing further async execution (build with EXIT_RUNTIME=1, if you want a true shutdown)";
  err(msg);
 }
 _proc_exit(status);
}

var _exit = exitJS;

function maybeExit() {}

function setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop, arg, noSetTiming) {
 assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
 Browser.mainLoop.func = browserIterationFunc;
 Browser.mainLoop.arg = arg;
 var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
 function checkIsRunning() {
  if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) {
   maybeExit();
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
   out('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
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
  if (typeof SDL == "object" && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
  Browser.mainLoop.scheduler();
 };
 if (!noSetTiming) {
  if (fps && fps > 0) _emscripten_set_main_loop_timing(0, 1e3 / fps); else _emscripten_set_main_loop_timing(1, 1);
  Browser.mainLoop.scheduler();
 }
 if (simulateInfiniteLoop) {
  throw "unwind";
 }
}

function callUserCallback(func) {
 if (ABORT) {
  err("user callback triggered after runtime exited or application aborted.  Ignoring.");
  return;
 }
 try {
  func();
 } catch (e) {
  handleException(e);
 }
}

function safeSetTimeout(func, timeout) {
 return setTimeout(function() {
  callUserCallback(func);
 }, timeout);
}

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
  pause: function() {
   Browser.mainLoop.scheduler = null;
   Browser.mainLoop.currentlyRunningMainloop++;
  },
  resume: function() {
   Browser.mainLoop.currentlyRunningMainloop++;
   var timingMode = Browser.mainLoop.timingMode;
   var timingValue = Browser.mainLoop.timingValue;
   var func = Browser.mainLoop.func;
   Browser.mainLoop.func = null;
   setMainLoop(func, 0, false, Browser.mainLoop.arg, true);
   _emscripten_set_main_loop_timing(timingMode, timingValue);
   Browser.mainLoop.scheduler();
  },
  updateStatus: function() {
   if (Module["setStatus"]) {
    var message = Module["statusMessage"] || "Please wait...";
    var remaining = Browser.mainLoop.remainingBlockers;
    var expected = Browser.mainLoop.expectedBlockers;
    if (remaining) {
     if (remaining < expected) {
      Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")");
     } else {
      Module["setStatus"](message);
     }
    } else {
     Module["setStatus"]("");
    }
   }
  },
  runIter: function(func) {
   if (ABORT) return;
   if (Module["preMainLoop"]) {
    var preRet = Module["preMainLoop"]();
    if (preRet === false) {
     return;
    }
   }
   callUserCallback(func);
   if (Module["postMainLoop"]) Module["postMainLoop"]();
  }
 },
 isFullscreen: false,
 pointerLock: false,
 moduleContextCreatedCallbacks: [],
 workers: [],
 init: function() {
  if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
  if (Browser.initted) return;
  Browser.initted = true;
  try {
   new Blob();
   Browser.hasBlobConstructor = true;
  } catch (e) {
   Browser.hasBlobConstructor = false;
   err("warning: no blob constructor, cannot create blobs with mimetypes");
  }
  Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : !Browser.hasBlobConstructor ? err("warning: no BlobBuilder") : null;
  Browser.URLObject = typeof window != "undefined" ? window.URL ? window.URL : window.webkitURL : undefined;
  if (!Module.noImageDecoding && typeof Browser.URLObject == "undefined") {
   err("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
   Module.noImageDecoding = true;
  }
  var imagePlugin = {};
  imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
   return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
  };
  imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
   var b = null;
   if (Browser.hasBlobConstructor) {
    try {
     b = new Blob([ byteArray ], {
      type: Browser.getMimetype(name)
     });
     if (b.size !== byteArray.length) {
      b = new Blob([ new Uint8Array(byteArray).buffer ], {
       type: Browser.getMimetype(name)
      });
     }
    } catch (e) {
     warnOnce("Blob constructor present but fails: " + e + "; falling back to blob builder");
    }
   }
   if (!b) {
    var bb = new Browser.BlobBuilder();
    bb.append(new Uint8Array(byteArray).buffer);
    b = bb.getBlob();
   }
   var url = Browser.URLObject.createObjectURL(b);
   assert(typeof url == "string", "createObjectURL must return a url as a string");
   var img = new Image();
   img.onload = () => {
    assert(img.complete, "Image " + name + " could not be decoded");
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    preloadedImages[name] = canvas;
    Browser.URLObject.revokeObjectURL(url);
    if (onload) onload(byteArray);
   };
   img.onerror = event => {
    out("Image " + url + " could not be decoded");
    if (onerror) onerror();
   };
   img.src = url;
  };
  Module["preloadPlugins"].push(imagePlugin);
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
    if (onload) onload(byteArray);
   }
   function fail() {
    if (done) return;
    done = true;
    preloadedAudios[name] = new Audio();
    if (onerror) onerror();
   }
   if (Browser.hasBlobConstructor) {
    try {
     var b = new Blob([ byteArray ], {
      type: Browser.getMimetype(name)
     });
    } catch (e) {
     return fail();
    }
    var url = Browser.URLObject.createObjectURL(b);
    assert(typeof url == "string", "createObjectURL must return a url as a string");
    var audio = new Audio();
    audio.addEventListener("canplaythrough", () => finish(audio), false);
    audio.onerror = function audio_onerror(event) {
     if (done) return;
     err("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");
     function encode64(data) {
      var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      var PAD = "=";
      var ret = "";
      var leftchar = 0;
      var leftbits = 0;
      for (var i = 0; i < data.length; i++) {
       leftchar = leftchar << 8 | data[i];
       leftbits += 8;
       while (leftbits >= 6) {
        var curr = leftchar >> leftbits - 6 & 63;
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
    safeSetTimeout(function() {
     finish(audio);
    }, 1e4);
   } else {
    return fail();
   }
  };
  Module["preloadPlugins"].push(audioPlugin);
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
 handledByPreloadPlugin: function(byteArray, fullname, finish, onerror) {
  Browser.init();
  var handled = false;
  Module["preloadPlugins"].forEach(function(plugin) {
   if (handled) return;
   if (plugin["canHandle"](fullname)) {
    plugin["handle"](byteArray, fullname, finish, onerror);
    handled = true;
   }
  });
  return handled;
 },
 createContext: function(canvas, useWebGL, setInModule, webGLContextAttributes) {
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
   Browser.moduleContextCreatedCallbacks.forEach(function(callback) {
    callback();
   });
   Browser.init();
  }
  return ctx;
 },
 destroyContext: function(canvas, useWebGL, setInModule) {},
 fullscreenHandlersInstalled: false,
 lockPointer: undefined,
 resizeCanvas: undefined,
 requestFullscreen: function(lockPointer, resizeCanvas) {
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
   if (Module["onFullScreen"]) Module["onFullScreen"](Browser.isFullscreen);
   if (Module["onFullscreen"]) Module["onFullscreen"](Browser.isFullscreen);
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
 requestFullScreen: function() {
  abort("Module.requestFullScreen has been replaced by Module.requestFullscreen (without a capital S)");
 },
 exitFullscreen: function() {
  if (!Browser.isFullscreen) {
   return false;
  }
  var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] || function() {};
  CFS.apply(document, []);
  return true;
 },
 nextRAF: 0,
 fakeRequestAnimationFrame: function(func) {
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
 requestAnimationFrame: function(func) {
  if (typeof requestAnimationFrame == "function") {
   requestAnimationFrame(func);
   return;
  }
  var RAF = Browser.fakeRequestAnimationFrame;
  RAF(func);
 },
 safeSetTimeout: function(func) {
  return safeSetTimeout(func);
 },
 safeRequestAnimationFrame: function(func) {
  return Browser.requestAnimationFrame(function() {
   callUserCallback(func);
  });
 },
 getMimetype: function(name) {
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
 getUserMedia: function(func) {
  if (!window.getUserMedia) {
   window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"];
  }
  window.getUserMedia(func);
 },
 getMovementX: function(event) {
  return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
 },
 getMovementY: function(event) {
  return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
 },
 getMouseWheelDelta: function(event) {
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
 calculateMouseEvent: function(event) {
  if (Browser.pointerLock) {
   if (event.type != "mousemove" && "mozMovementX" in event) {
    Browser.mouseMovementX = Browser.mouseMovementY = 0;
   } else {
    Browser.mouseMovementX = Browser.getMovementX(event);
    Browser.mouseMovementY = Browser.getMovementY(event);
   }
   if (typeof SDL != "undefined") {
    Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
    Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
   } else {
    Browser.mouseX += Browser.mouseMovementX;
    Browser.mouseY += Browser.mouseMovementY;
   }
  } else {
   var rect = Module["canvas"].getBoundingClientRect();
   var cw = Module["canvas"].width;
   var ch = Module["canvas"].height;
   var scrollX = typeof window.scrollX != "undefined" ? window.scrollX : window.pageXOffset;
   var scrollY = typeof window.scrollY != "undefined" ? window.scrollY : window.pageYOffset;
   assert(typeof scrollX != "undefined" && typeof scrollY != "undefined", "Unable to retrieve scroll position, mouse positions likely broken.");
   if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
    var touch = event.touch;
    if (touch === undefined) {
     return;
    }
    var adjustedX = touch.pageX - (scrollX + rect.left);
    var adjustedY = touch.pageY - (scrollY + rect.top);
    adjustedX = adjustedX * (cw / rect.width);
    adjustedY = adjustedY * (ch / rect.height);
    var coords = {
     x: adjustedX,
     y: adjustedY
    };
    if (event.type === "touchstart") {
     Browser.lastTouches[touch.identifier] = coords;
     Browser.touches[touch.identifier] = coords;
    } else if (event.type === "touchend" || event.type === "touchmove") {
     var last = Browser.touches[touch.identifier];
     if (!last) last = coords;
     Browser.lastTouches[touch.identifier] = last;
     Browser.touches[touch.identifier] = coords;
    }
    return;
   }
   var x = event.pageX - (scrollX + rect.left);
   var y = event.pageY - (scrollY + rect.top);
   x = x * (cw / rect.width);
   y = y * (ch / rect.height);
   Browser.mouseMovementX = x - Browser.mouseX;
   Browser.mouseMovementY = y - Browser.mouseY;
   Browser.mouseX = x;
   Browser.mouseY = y;
  }
 },
 resizeListeners: [],
 updateResizeListeners: function() {
  var canvas = Module["canvas"];
  Browser.resizeListeners.forEach(function(listener) {
   listener(canvas.width, canvas.height);
  });
 },
 setCanvasSize: function(width, height, noUpdates) {
  var canvas = Module["canvas"];
  Browser.updateCanvasDimensions(canvas, width, height);
  if (!noUpdates) Browser.updateResizeListeners();
 },
 windowedWidth: 0,
 windowedHeight: 0,
 setFullscreenCanvasSize: function() {
  if (typeof SDL != "undefined") {
   var flags = SAFE_HEAP_LOAD((SDL.screen >> 2) * 4, 4, 1);
   flags = flags | 8388608;
   SAFE_HEAP_STORE((SDL.screen >> 2) * 4, flags, 4);
  }
  Browser.updateCanvasDimensions(Module["canvas"]);
  Browser.updateResizeListeners();
 },
 setWindowedCanvasSize: function() {
  if (typeof SDL != "undefined") {
   var flags = SAFE_HEAP_LOAD((SDL.screen >> 2) * 4, 4, 1);
   flags = flags & ~8388608;
   SAFE_HEAP_STORE((SDL.screen >> 2) * 4, flags, 4);
  }
  Browser.updateCanvasDimensions(Module["canvas"]);
  Browser.updateResizeListeners();
 },
 updateCanvasDimensions: function(canvas, wNative, hNative) {
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
  if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
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

function _emscripten_cancel_main_loop() {
 Browser.mainLoop.pause();
 Browser.mainLoop.func = null;
}

function _emscripten_memcpy_big(dest, src, num) {
 HEAPU8.copyWithin(dest, src, src + num);
}

function getHeapMax() {
 return HEAPU8.length;
}

function abortOnCannotGrowMemory(requestedSize) {
 abort("Cannot enlarge memory arrays to size " + requestedSize + " bytes (OOM). Either (1) compile with -sINITIAL_MEMORY=X with X higher than the current value " + HEAP8.length + ", (2) compile with -sALLOW_MEMORY_GROWTH which allows increasing the size at runtime, or (3) if you want malloc to return NULL (0) instead of this abort, compile with -sABORTING_MALLOC=0");
}

function _emscripten_resize_heap(requestedSize) {
 var oldSize = HEAPU8.length;
 requestedSize = requestedSize >>> 0;
 abortOnCannotGrowMemory(requestedSize);
}

var wasmTableMirror = [];

function getWasmTableEntry(funcPtr) {
 var func = wasmTableMirror[funcPtr];
 if (!func) {
  if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
  wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr);
 }
 assert(wasmTable.get(funcPtr) == func, "JavaScript-side Wasm function table mirror is out of date!");
 return func;
}

function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop) {
 var browserIterationFunc = getWasmTableEntry(func);
 setMainLoop(browserIterationFunc, fps, simulateInfiniteLoop);
}

var printCharBuffers = [ null, [], [] ];

function printChar(stream, curr) {
 var buffer = printCharBuffers[stream];
 assert(buffer);
 if (curr === 0 || curr === 10) {
  (stream === 1 ? out : err)(UTF8ArrayToString(buffer, 0));
  buffer.length = 0;
 } else {
  buffer.push(curr);
 }
}

function flush_NO_FILESYSTEM() {
 _fflush(0);
 if (printCharBuffers[1].length) printChar(1, 10);
 if (printCharBuffers[2].length) printChar(2, 10);
}

function _fd_write(fd, iov, iovcnt, pnum) {
 var num = 0;
 for (var i = 0; i < iovcnt; i++) {
  var ptr = SAFE_HEAP_LOAD((iov >> 2) * 4, 4, 1);
  var len = SAFE_HEAP_LOAD((iov + 4 >> 2) * 4, 4, 1);
  iov += 8;
  for (var j = 0; j < len; j++) {
   printChar(fd, SAFE_HEAP_LOAD(ptr + j, 1, 1));
  }
  num += len;
 }
 SAFE_HEAP_STORE((pnum >> 2) * 4, num, 4);
 return 0;
}

function allocateUTF8(str) {
 var size = lengthBytesUTF8(str) + 1;
 var ret = _malloc(size);
 if (ret) stringToUTF8Array(str, HEAP8, ret, size);
 return ret;
}

var WebGPU = {
 initManagers: function() {
  if (WebGPU.mgrDevice) return;
  function Manager() {
   this.objects = {};
   this.nextId = 1;
   this.create = function(object, wrapper) {
    wrapper = wrapper || {};
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
   this.reference = function(id) {
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
  WebGPU.mgrSurface = WebGPU.mgrSurface || new Manager();
  WebGPU.mgrSwapChain = WebGPU.mgrSwapChain || new Manager();
  WebGPU.mgrAdapter = WebGPU.mgrAdapter || new Manager();
  WebGPU.mgrDevice = WebGPU.mgrDevice || new Manager();
  WebGPU.mgrQueue = WebGPU.mgrQueue || new Manager();
  WebGPU.mgrCommandBuffer = WebGPU.mgrCommandBuffer || new Manager();
  WebGPU.mgrCommandEncoder = WebGPU.mgrCommandEncoder || new Manager();
  WebGPU.mgrRenderPassEncoder = WebGPU.mgrRenderPassEncoder || new Manager();
  WebGPU.mgrComputePassEncoder = WebGPU.mgrComputePassEncoder || new Manager();
  WebGPU.mgrBindGroup = WebGPU.mgrBindGroup || new Manager();
  WebGPU.mgrBuffer = WebGPU.mgrBuffer || new Manager();
  WebGPU.mgrSampler = WebGPU.mgrSampler || new Manager();
  WebGPU.mgrTexture = WebGPU.mgrTexture || new Manager();
  WebGPU.mgrTextureView = WebGPU.mgrTextureView || new Manager();
  WebGPU.mgrQuerySet = WebGPU.mgrQuerySet || new Manager();
  WebGPU.mgrBindGroupLayout = WebGPU.mgrBindGroupLayout || new Manager();
  WebGPU.mgrPipelineLayout = WebGPU.mgrPipelineLayout || new Manager();
  WebGPU.mgrRenderPipeline = WebGPU.mgrRenderPipeline || new Manager();
  WebGPU.mgrComputePipeline = WebGPU.mgrComputePipeline || new Manager();
  WebGPU.mgrShaderModule = WebGPU.mgrShaderModule || new Manager();
  WebGPU.mgrRenderBundleEncoder = WebGPU.mgrRenderBundleEncoder || new Manager();
  WebGPU.mgrRenderBundle = WebGPU.mgrRenderBundle || new Manager();
 },
 makeColor: function(ptr) {
  return {
   "r": SAFE_HEAP_LOAD_D((ptr >> 3) * 8, 8, 0),
   "g": SAFE_HEAP_LOAD_D((ptr + 8 >> 3) * 8, 8, 0),
   "b": SAFE_HEAP_LOAD_D((ptr + 16 >> 3) * 8, 8, 0),
   "a": SAFE_HEAP_LOAD_D((ptr + 24 >> 3) * 8, 8, 0)
  };
 },
 makeExtent3D: function(ptr) {
  return {
   "width": SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 1),
   "height": SAFE_HEAP_LOAD((ptr + 4 >> 2) * 4, 4, 1),
   "depthOrArrayLayers": SAFE_HEAP_LOAD((ptr + 8 >> 2) * 4, 4, 1)
  };
 },
 makeOrigin3D: function(ptr) {
  return {
   "x": SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 1),
   "y": SAFE_HEAP_LOAD((ptr + 4 >> 2) * 4, 4, 1),
   "z": SAFE_HEAP_LOAD((ptr + 8 >> 2) * 4, 4, 1)
  };
 },
 makeImageCopyTexture: function(ptr) {
  assert(ptr);
  assert(SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 1) === 0);
  return {
   "texture": WebGPU.mgrTexture.get(SAFE_HEAP_LOAD((ptr + 4 >> 2) * 4, 4, 1)),
   "mipLevel": SAFE_HEAP_LOAD((ptr + 8 >> 2) * 4, 4, 1),
   "origin": WebGPU.makeOrigin3D(ptr + 12),
   "aspect": WebGPU.TextureAspect[SAFE_HEAP_LOAD((ptr + 24 >> 2) * 4, 4, 1)]
  };
 },
 makeTextureDataLayout: function(ptr) {
  assert(ptr);
  assert(SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 1) === 0);
  var bytesPerRow = SAFE_HEAP_LOAD((ptr + 16 >> 2) * 4, 4, 1);
  var rowsPerImage = SAFE_HEAP_LOAD((ptr + 20 >> 2) * 4, 4, 1);
  return {
   "offset": SAFE_HEAP_LOAD((ptr + 4 + 8 >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD((ptr + 8 >> 2) * 4, 4, 1),
   "bytesPerRow": bytesPerRow === 4294967295 ? undefined : bytesPerRow,
   "rowsPerImage": rowsPerImage === 4294967295 ? undefined : rowsPerImage
  };
 },
 makeImageCopyBuffer: function(ptr) {
  assert(ptr);
  assert(SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 1) === 0);
  var layoutPtr = ptr + 8;
  var bufferCopyView = WebGPU.makeTextureDataLayout(layoutPtr);
  bufferCopyView["buffer"] = WebGPU.mgrBuffer.get(SAFE_HEAP_LOAD((ptr + 32 >> 2) * 4, 4, 1));
  return bufferCopyView;
 },
 makePipelineConstants: function(constantCount, constantsPtr) {
  if (!constantCount) return;
  var constants = {};
  for (var i = 0; i < constantCount; ++i) {
   var entryPtr = constantsPtr + 16 * i;
   var key = UTF8ToString(SAFE_HEAP_LOAD((entryPtr + 4 >> 2) * 4, 4, 1));
   constants[key] = SAFE_HEAP_LOAD_D((entryPtr + 8 >> 3) * 8, 8, 0);
  }
  return constants;
 },
 makeProgrammableStageDescriptor: function(ptr) {
  if (!ptr) return undefined;
  assert(ptr);
  assert(SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 1) === 0);
  return {
   "module": WebGPU.mgrShaderModule.get(SAFE_HEAP_LOAD((ptr + 4 >> 2) * 4, 4, 1)),
   "entryPoint": UTF8ToString(SAFE_HEAP_LOAD((ptr + 8 >> 2) * 4, 4, 1)),
   "constants": WebGPU.makePipelineConstants(SAFE_HEAP_LOAD((ptr + 12 >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((ptr + 16 >> 2) * 4, 4, 1))
  };
 },
 DeviceLostReason: {
  undefined: 0,
  destroyed: 1
 },
 PreferredFormat: {
  rgba8unorm: 18,
  bgra8unorm: 23
 },
 AddressMode: [ "repeat", "mirror-repeat", "clamp-to-edge" ],
 BlendFactor: [ "zero", "one", "src", "one-minus-src", "src-alpha", "one-minus-src-alpha", "dst", "one-minus-dst", "dst-alpha", "one-minus-dst-alpha", "src-alpha-saturated", "constant", "one-minus-constant" ],
 BlendOperation: [ "add", "subtract", "reverse-subtract", "min", "max" ],
 BufferBindingType: [ , "uniform", "storage", "read-only-storage" ],
 CompareFunction: [ , "never", "less", "less-equal", "greater", "greater-equal", "equal", "not-equal", "always" ],
 CompilationInfoRequestStatus: [ "success", "error", "device-lost", "unknown" ],
 ComputePassTimestampLocation: [ "beginning", "end" ],
 CullMode: [ "none", "front", "back" ],
 ErrorFilter: [ "validation", "out-of-memory" ],
 FeatureName: [ , "depth-clip-control", "depth32float-stencil8", "timestamp-query", "pipeline-statistics-query", "texture-compression-bc", "texture-compression-etc2", "texture-compression-astc", "indirect-first-instance" ],
 FilterMode: [ "nearest", "linear" ],
 FrontFace: [ "ccw", "cw" ],
 IndexFormat: [ , "uint16", "uint32" ],
 LoadOp: [ , "clear", "load" ],
 PipelineStatisticName: [ "vertex-shader-invocations", "clipper-invocations", "clipper-primitives-out", "fragment-shader-invocations", "compute-shader-invocations" ],
 PowerPreference: [ , "low-power", "high-performance" ],
 PrimitiveTopology: [ "point-list", "line-list", "line-strip", "triangle-list", "triangle-strip" ],
 QueryType: [ "occlusion", "pipeline-statistics", "timestamp" ],
 RenderPassTimestampLocation: [ "beginning", "end" ],
 SamplerBindingType: [ , "filtering", "non-filtering", "comparison" ],
 StencilOperation: [ "keep", "zero", "replace", "invert", "increment-clamp", "decrement-clamp", "increment-wrap", "decrement-wrap" ],
 StorageTextureAccess: [ , "write-only" ],
 StoreOp: [ , "store", "discard" ],
 TextureAspect: [ "all", "stencil-only", "depth-only" ],
 TextureComponentType: [ "float", "sint", "uint", "depth-comparison" ],
 TextureDimension: [ "1d", "2d", "3d" ],
 TextureFormat: [ , "r8unorm", "r8snorm", "r8uint", "r8sint", "r16uint", "r16sint", "r16float", "rg8unorm", "rg8snorm", "rg8uint", "rg8sint", "r32float", "r32uint", "r32sint", "rg16uint", "rg16sint", "rg16float", "rgba8unorm", "rgba8unorm-srgb", "rgba8snorm", "rgba8uint", "rgba8sint", "bgra8unorm", "bgra8unorm-srgb", "rgb10a2unorm", "rg11b10ufloat", "rgb9e5ufloat", "rg32float", "rg32uint", "rg32sint", "rgba16uint", "rgba16sint", "rgba16float", "rgba32float", "rgba32uint", "rgba32sint", "stencil8", "depth16unorm", "depth24plus", "depth24plus-stencil8", "depth32float", "depth32float-stencil8", "bc1-rgba-unorm", "bc1-rgba-unorm-srgb", "bc2-rgba-unorm", "bc2-rgba-unorm-srgb", "bc3-rgba-unorm", "bc3-rgba-unorm-srgb", "bc4-r-unorm", "bc4-r-snorm", "bc5-rg-unorm", "bc5-rg-snorm", "bc6h-rgb-ufloat", "bc6h-rgb-float", "bc7-rgba-unorm", "bc7-rgba-unorm-srgb", "etc2-rgb8unorm", "etc2-rgb8unorm-srgb", "etc2-rgb8a1unorm", "etc2-rgb8a1unorm-srgb", "etc2-rgba8unorm", "etc2-rgba8unorm-srgb", "eac-r11unorm", "eac-r11snorm", "eac-rg11unorm", "eac-rg11snorm", "astc-4x4-unorm", "astc-4x4-unorm-srgb", "astc-5x4-unorm", "astc-5x4-unorm-srgb", "astc-5x5-unorm", "astc-5x5-unorm-srgb", "astc-6x5-unorm", "astc-6x5-unorm-srgb", "astc-6x6-unorm", "astc-6x6-unorm-srgb", "astc-8x5-unorm", "astc-8x5-unorm-srgb", "astc-8x6-unorm", "astc-8x6-unorm-srgb", "astc-8x8-unorm", "astc-8x8-unorm-srgb", "astc-10x5-unorm", "astc-10x5-unorm-srgb", "astc-10x6-unorm", "astc-10x6-unorm-srgb", "astc-10x8-unorm", "astc-10x8-unorm-srgb", "astc-10x10-unorm", "astc-10x10-unorm-srgb", "astc-12x10-unorm", "astc-12x10-unorm-srgb", "astc-12x12-unorm", "astc-12x12-unorm-srgb" ],
 TextureSampleType: [ , "float", "unfilterable-float", "depth", "sint", "uint" ],
 TextureViewDimension: [ , "1d", "2d", "2d-array", "cube", "cube-array", "3d" ],
 VertexFormat: [ , "uint8x2", "uint8x4", "sint8x2", "sint8x4", "unorm8x2", "unorm8x4", "snorm8x2", "snorm8x4", "uint16x2", "uint16x4", "sint16x2", "sint16x4", "unorm16x2", "unorm16x4", "snorm16x2", "snorm16x4", "float16x2", "float16x4", "float32", "float32x2", "float32x3", "float32x4", "uint32", "uint32x2", "uint32x3", "uint32x4", "sint32", "sint32x2", "sint32x3", "sint32x4" ],
 VertexStepMode: [ "vertex", "instance" ],
 FeatureNameString2Enum: {
  undefined: "0",
  "depth-clip-control": "1",
  "depth32float-stencil8": "2",
  "timestamp-query": "3",
  "pipeline-statistics-query": "4",
  "texture-compression-bc": "5",
  "texture-compression-etc2": "6",
  "texture-compression-astc": "7",
  "indirect-first-instance": "8"
 }
};

function _wgpuAdapterRequestDevice(adapterId, descriptor, callback, userdata) {
 var adapter = WebGPU.mgrAdapter.get(adapterId);
 var desc = {};
 if (descriptor) {
  assert(descriptor);
  assert(SAFE_HEAP_LOAD((descriptor >> 2) * 4, 4, 1) === 0);
  var requiredFeaturesCount = SAFE_HEAP_LOAD((descriptor + 8 >> 2) * 4, 4, 1);
  if (requiredFeaturesCount) {
   var requiredFeaturesPtr = SAFE_HEAP_LOAD((descriptor + 12 >> 2) * 4, 4, 1);
   desc["requiredFeatures"] = Array.from(HEAP32.subarray(requiredFeaturesPtr >> 2, (requiredFeaturesPtr >> 2) + requiredFeaturesCount), function(feature) {
    return WebGPU.FeatureName[feature];
   });
  }
  var requiredLimitsPtr = SAFE_HEAP_LOAD((descriptor + 16 >> 2) * 4, 4, 1);
  if (requiredLimitsPtr) {
   assert(requiredLimitsPtr);
   assert(SAFE_HEAP_LOAD((requiredLimitsPtr >> 2) * 4, 4, 1) === 0);
   var limitsPtr = requiredLimitsPtr + 8;
   var requiredLimits = {};
   function setLimitU32IfDefined(name, limitOffset) {
    var ptr = limitsPtr + limitOffset;
    var value = SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 1);
    if (value != 4294967295) {
     requiredLimits[name] = value;
    }
   }
   function setLimitU64IfDefined(name, limitOffset) {
    var ptr = limitsPtr + limitOffset;
    var limitPart1 = SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 1);
    var limitPart2 = SAFE_HEAP_LOAD((ptr + 4 >> 2) * 4, 4, 1);
    if (limitPart1 != 4294967295 || limitPart2 != 4294967295) {
     requiredLimits[name] = SAFE_HEAP_LOAD((ptr + 4 >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD((ptr >> 2) * 4, 4, 1);
    }
   }
   setLimitU32IfDefined("maxTextureDimension1D", 0);
   setLimitU32IfDefined("maxTextureDimension2D", 4);
   setLimitU32IfDefined("maxTextureDimension3D", 8);
   setLimitU32IfDefined("maxTextureArrayLayers", 12);
   setLimitU32IfDefined("maxBindGroups", 16);
   setLimitU32IfDefined("maxDynamicUniformBuffersPerPipelineLayout", 20);
   setLimitU32IfDefined("maxDynamicStorageBuffersPerPipelineLayout", 24);
   setLimitU32IfDefined("maxSampledTexturesPerShaderStage", 28);
   setLimitU32IfDefined("maxSamplersPerShaderStage", 32);
   setLimitU32IfDefined("maxStorageBuffersPerShaderStage", 36);
   setLimitU32IfDefined("maxStorageTexturesPerShaderStage", 40);
   setLimitU32IfDefined("maxUniformBuffersPerShaderStage", 44);
   setLimitU32IfDefined("minUniformBufferOffsetAlignment", 64);
   setLimitU32IfDefined("minStorageBufferOffsetAlignment", 68);
   setLimitU64IfDefined("maxUniformBufferBindingSize", 48);
   setLimitU64IfDefined("maxStorageBufferBindingSize", 56);
   setLimitU32IfDefined("maxVertexBuffers", 72);
   setLimitU32IfDefined("maxVertexAttributes", 76);
   setLimitU32IfDefined("maxVertexBufferArrayStride", 80);
   setLimitU32IfDefined("maxInterStageShaderComponents", 84);
   setLimitU32IfDefined("maxInterStageShaderVariables", 88);
   setLimitU32IfDefined("maxColorAttachments", 92);
   setLimitU32IfDefined("maxComputeWorkgroupStorageSize", 96);
   setLimitU32IfDefined("maxComputeInvocationsPerWorkgroup", 100);
   setLimitU32IfDefined("maxComputeWorkgroupSizeX", 104);
   setLimitU32IfDefined("maxComputeWorkgroupSizeY", 108);
   setLimitU32IfDefined("maxComputeWorkgroupSizeZ", 112);
   setLimitU32IfDefined("maxComputeWorkgroupsPerDimension", 116);
   desc["requiredLimits"] = requiredLimits;
  }
  var defaultQueuePtr = SAFE_HEAP_LOAD((descriptor + 20 >> 2) * 4, 4, 1);
  if (defaultQueuePtr) {
   var defaultQueueDesc = {};
   var labelPtr = SAFE_HEAP_LOAD((defaultQueuePtr + 4 >> 2) * 4, 4, 1);
   if (labelPtr) defaultQueueDesc["label"] = UTF8ToString(labelPtr);
   desc["defaultQueue"] = defaultQueueDesc;
  }
  var labelPtr = SAFE_HEAP_LOAD((descriptor + 4 >> 2) * 4, 4, 1);
  if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
 }
 adapter["requestDevice"](desc).then(function(device) {
  callUserCallback(function() {
   var deviceWrapper = {
    queueId: WebGPU.mgrQueue.create(device["queue"])
   };
   var deviceId = WebGPU.mgrDevice.create(device, deviceWrapper);
   getWasmTableEntry(callback)(0, deviceId, 0, userdata);
  });
 }, function(ex) {
  callUserCallback(function() {
   var messagePtr = allocateUTF8(ex.message);
   getWasmTableEntry(callback)(1, 0, messagePtr, userdata);
   _free(messagePtr);
  });
 });
}

function _wgpuBindGroupLayoutReference(id) {
 WebGPU.mgrBindGroupLayout.reference(id);
}

function _wgpuBindGroupLayoutRelease(id) {
 WebGPU.mgrBindGroupLayout.release(id);
}

function _wgpuBindGroupRelease(id) {
 WebGPU.mgrBindGroup.release(id);
}

function _wgpuBufferGetConstMappedRange(bufferId, offset, size) {
 var bufferWrapper = WebGPU.mgrBuffer.objects[bufferId];
 assert(typeof bufferWrapper != "undefined");
 if (size === 0) warnOnce("getMappedRange size=0 no longer means WGPU_WHOLE_MAP_SIZE");
 size = size >>> 0;
 if (size === 4294967295) size = undefined;
 var mapped;
 try {
  mapped = bufferWrapper.object["getMappedRange"](offset, size);
 } catch (ex) {
  err("wgpuBufferGetConstMappedRange(" + offset + ", " + size + ") failed: " + ex);
  return 0;
 }
 var data = _malloc(mapped.byteLength);
 HEAPU8.set(new Uint8Array(mapped), data);
 bufferWrapper.onUnmap.push(function() {
  _free(data);
 });
 return data;
}

function _wgpuBufferGetMappedRange(bufferId, offset, size) {
 var bufferWrapper = WebGPU.mgrBuffer.objects[bufferId];
 assert(typeof bufferWrapper != "undefined");
 if (size === 0) warnOnce("getMappedRange size=0 no longer means WGPU_WHOLE_MAP_SIZE");
 size = size >>> 0;
 if (size === 4294967295) size = undefined;
 if (bufferWrapper.mapMode !== 2) {
  abort("GetMappedRange called, but buffer not mapped for writing");
  return 0;
 }
 var mapped;
 try {
  mapped = bufferWrapper.object["getMappedRange"](offset, size);
 } catch (ex) {
  err("wgpuBufferGetMappedRange(" + offset + ", " + size + ") failed: " + ex);
  return 0;
 }
 var data = _malloc(mapped.byteLength);
 HEAPU8.fill(0, data, mapped.byteLength);
 bufferWrapper.onUnmap.push(function() {
  new Uint8Array(mapped).set(HEAPU8.subarray(data, data + mapped.byteLength));
  _free(data);
 });
 return data;
}

function _wgpuBufferMapAsync(bufferId, mode, offset, size, callback, userdata) {
 var bufferWrapper = WebGPU.mgrBuffer.objects[bufferId];
 assert(typeof bufferWrapper != "undefined");
 bufferWrapper.mapMode = mode;
 bufferWrapper.onUnmap = [];
 var buffer = bufferWrapper.object;
 size = size >>> 0;
 if (size === 4294967295) size = undefined;
 buffer["mapAsync"](mode, offset, size).then(function() {
  callUserCallback(function() {
   getWasmTableEntry(callback)(0, userdata);
  });
 }, function() {
  callUserCallback(function() {
   getWasmTableEntry(callback)(1, userdata);
  });
 });
}

function _wgpuBufferReference(id) {
 WebGPU.mgrBuffer.reference(id);
}

function _wgpuBufferRelease(id) {
 WebGPU.mgrBuffer.release(id);
}

function _wgpuBufferUnmap(bufferId) {
 var bufferWrapper = WebGPU.mgrBuffer.objects[bufferId];
 assert(typeof bufferWrapper != "undefined");
 if (!bufferWrapper.onUnmap) {
  return;
 }
 for (var i = 0; i < bufferWrapper.onUnmap.length; ++i) {
  bufferWrapper.onUnmap[i]();
 }
 bufferWrapper.onUnmap = undefined;
 bufferWrapper.object["unmap"]();
}

function _wgpuCommandBufferRelease(id) {
 WebGPU.mgrCommandBuffer.release(id);
}

function _wgpuCommandEncoderBeginRenderPass(encoderId, descriptor) {
 assert(descriptor);
 function makeColorAttachment(caPtr) {
  var viewPtr = SAFE_HEAP_LOAD((caPtr >> 2) * 4, 4, 1);
  if (viewPtr === 0) {
   return undefined;
  }
  var loadOpInt = SAFE_HEAP_LOAD((caPtr + 8 >> 2) * 4, 4, 1);
  assert(loadOpInt !== 0);
  var storeOpInt = SAFE_HEAP_LOAD((caPtr + 12 >> 2) * 4, 4, 1);
  assert(storeOpInt !== 0);
  var clearValue = WebGPU.makeColor(caPtr + 16);
  return {
   "view": WebGPU.mgrTextureView.get(viewPtr),
   "resolveTarget": WebGPU.mgrTextureView.get(SAFE_HEAP_LOAD((caPtr + 4 >> 2) * 4, 4, 1)),
   "clearValue": clearValue,
   "loadOp": WebGPU.LoadOp[loadOpInt],
   "storeOp": WebGPU.StoreOp[storeOpInt]
  };
 }
 function makeColorAttachments(count, caPtr) {
  var attachments = [];
  for (var i = 0; i < count; ++i) {
   attachments.push(makeColorAttachment(caPtr + 48 * i));
  }
  return attachments;
 }
 function makeDepthStencilAttachment(dsaPtr) {
  if (dsaPtr === 0) return undefined;
  return {
   "view": WebGPU.mgrTextureView.get(SAFE_HEAP_LOAD((dsaPtr >> 2) * 4, 4, 1)),
   "depthClearValue": SAFE_HEAP_LOAD_D((dsaPtr + 12 >> 2) * 4, 4, 0),
   "depthLoadOp": WebGPU.LoadOp[SAFE_HEAP_LOAD((dsaPtr + 4 >> 2) * 4, 4, 1)],
   "depthStoreOp": WebGPU.StoreOp[SAFE_HEAP_LOAD((dsaPtr + 8 >> 2) * 4, 4, 1)],
   "depthReadOnly": SAFE_HEAP_LOAD(dsaPtr + 16 >> 0, 1, 0) !== 0,
   "stencilClearValue": SAFE_HEAP_LOAD((dsaPtr + 28 >> 2) * 4, 4, 1),
   "stencilLoadOp": WebGPU.LoadOp[SAFE_HEAP_LOAD((dsaPtr + 20 >> 2) * 4, 4, 1)],
   "stencilStoreOp": WebGPU.StoreOp[SAFE_HEAP_LOAD((dsaPtr + 24 >> 2) * 4, 4, 1)],
   "stencilReadOnly": SAFE_HEAP_LOAD(dsaPtr + 32 >> 0, 1, 0) !== 0
  };
 }
 function makeRenderPassTimestampWrite(twPtr) {
  return {
   "querySet": WebGPU.mgrQuerySet.get(SAFE_HEAP_LOAD((twPtr >> 2) * 4, 4, 1)),
   "queryIndex": SAFE_HEAP_LOAD((twPtr + 4 >> 2) * 4, 4, 1),
   "location": WebGPU.RenderPassTimestampLocation[SAFE_HEAP_LOAD((twPtr + 8 >> 2) * 4, 4, 1)]
  };
 }
 function makeRenderPassTimestampWrites(count, twPtr) {
  var timestampWrites = [];
  for (var i = 0; i < count; ++i) {
   timestampWrites.push(makeRenderPassTimestampWrite(twPtr + 12 * i));
  }
  return timestampWrites;
 }
 function makeRenderPassDescriptor(descriptor) {
  assert(descriptor);
  var nextInChainPtr = SAFE_HEAP_LOAD((descriptor >> 2) * 4, 4, 1);
  var maxDrawCount = undefined;
  if (nextInChainPtr !== 0) {
   var sType = SAFE_HEAP_LOAD((nextInChainPtr + 4 >> 2) * 4, 4, 1);
   assert(sType === 15);
   assert(0 === SAFE_HEAP_LOAD((nextInChainPtr >> 2) * 4, 4, 1));
   var renderPassDescriptorMaxDrawCount = nextInChainPtr;
   assert(renderPassDescriptorMaxDrawCount);
   assert(SAFE_HEAP_LOAD((renderPassDescriptorMaxDrawCount >> 2) * 4, 4, 1) === 0);
   maxDrawCount = SAFE_HEAP_LOAD((renderPassDescriptorMaxDrawCount + 4 + 8 >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD((renderPassDescriptorMaxDrawCount + 8 >> 2) * 4, 4, 1);
  }
  var desc = {
   "label": undefined,
   "colorAttachments": makeColorAttachments(SAFE_HEAP_LOAD((descriptor + 8 >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((descriptor + 12 >> 2) * 4, 4, 1)),
   "depthStencilAttachment": makeDepthStencilAttachment(SAFE_HEAP_LOAD((descriptor + 16 >> 2) * 4, 4, 1)),
   "occlusionQuerySet": WebGPU.mgrQuerySet.get(SAFE_HEAP_LOAD((descriptor + 20 >> 2) * 4, 4, 1)),
   "maxDrawCount": maxDrawCount
  };
  var labelPtr = SAFE_HEAP_LOAD((descriptor + 4 >> 2) * 4, 4, 1);
  if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
  var timestampWriteCount = SAFE_HEAP_LOAD((descriptor + 24 >> 2) * 4, 4, 1);
  if (timestampWriteCount) {
   desc["timestampWrites"] = makeRenderPassTimestampWrites(timestampWriteCount, SAFE_HEAP_LOAD((descriptor + 28 >> 2) * 4, 4, 1));
  }
  return desc;
 }
 var desc = makeRenderPassDescriptor(descriptor);
 var commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
 return WebGPU.mgrRenderPassEncoder.create(commandEncoder["beginRenderPass"](desc));
}

function _wgpuCommandEncoderCopyBufferToBuffer(encoderId, srcId, srcOffset_low, srcOffset_high, dstId, dstOffset_low, dstOffset_high, size_low, size_high) {
 var commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
 var src = WebGPU.mgrBuffer.get(srcId);
 var dst = WebGPU.mgrBuffer.get(dstId);
 commandEncoder["copyBufferToBuffer"](src, (assert(srcOffset_high < 2097152), srcOffset_high * 4294967296 + srcOffset_low), dst, (assert(dstOffset_high < 2097152), 
 dstOffset_high * 4294967296 + dstOffset_low), (assert(size_high < 2097152), size_high * 4294967296 + size_low));
}

function _wgpuCommandEncoderCopyTextureToBuffer(encoderId, srcPtr, dstPtr, copySizePtr) {
 var commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
 var copySize = WebGPU.makeExtent3D(copySizePtr);
 commandEncoder["copyTextureToBuffer"](WebGPU.makeImageCopyTexture(srcPtr), WebGPU.makeImageCopyBuffer(dstPtr), copySize);
}

function _wgpuCommandEncoderFinish(encoderId) {
 var commandEncoder = WebGPU.mgrCommandEncoder.get(encoderId);
 return WebGPU.mgrCommandBuffer.create(commandEncoder["finish"]());
}

function _wgpuCommandEncoderRelease(id) {
 WebGPU.mgrCommandEncoder.release(id);
}

function _wgpuDeviceCreateBindGroup(deviceId, descriptor) {
 assert(descriptor);
 assert(SAFE_HEAP_LOAD((descriptor >> 2) * 4, 4, 1) === 0);
 function makeEntry(entryPtr) {
  assert(entryPtr);
  var bufferId = SAFE_HEAP_LOAD((entryPtr + 8 >> 2) * 4, 4, 1);
  var samplerId = SAFE_HEAP_LOAD((entryPtr + 32 >> 2) * 4, 4, 1);
  var textureViewId = SAFE_HEAP_LOAD((entryPtr + 36 >> 2) * 4, 4, 1);
  assert((bufferId !== 0) + (samplerId !== 0) + (textureViewId !== 0) === 1);
  var binding = SAFE_HEAP_LOAD((entryPtr + 4 >> 2) * 4, 4, 1);
  if (bufferId) {
   var size_low = SAFE_HEAP_LOAD((entryPtr + 24 >> 2) * 4, 4, 1);
   var size_high = SAFE_HEAP_LOAD((entryPtr + 28 >> 2) * 4, 4, 1);
   var size = size_high === -1 && size_low === -1 ? undefined : (assert(size_high < 2097152), 
   size_high * 4294967296 + size_low);
   return {
    "binding": binding,
    "resource": {
     "buffer": WebGPU.mgrBuffer.get(bufferId),
     "offset": SAFE_HEAP_LOAD((entryPtr + 4 + 16 >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD((entryPtr + 16 >> 2) * 4, 4, 1),
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
  "layout": WebGPU.mgrBindGroupLayout.get(SAFE_HEAP_LOAD((descriptor + 8 >> 2) * 4, 4, 1)),
  "entries": makeEntries(SAFE_HEAP_LOAD((descriptor + 12 >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((descriptor + 16 >> 2) * 4, 4, 1))
 };
 var labelPtr = SAFE_HEAP_LOAD((descriptor + 4 >> 2) * 4, 4, 1);
 if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
 var device = WebGPU.mgrDevice.get(deviceId);
 return WebGPU.mgrBindGroup.create(device["createBindGroup"](desc));
}

function _wgpuDeviceCreateBindGroupLayout(deviceId, descriptor) {
 assert(descriptor);
 assert(SAFE_HEAP_LOAD((descriptor >> 2) * 4, 4, 1) === 0);
 function makeBufferEntry(entryPtr) {
  assert(entryPtr);
  var typeInt = SAFE_HEAP_LOAD((entryPtr + 4 >> 2) * 4, 4, 1);
  if (!typeInt) return undefined;
  return {
   "type": WebGPU.BufferBindingType[typeInt],
   "hasDynamicOffset": SAFE_HEAP_LOAD(entryPtr + 8 >> 0, 1, 0) !== 0,
   "minBindingSize": SAFE_HEAP_LOAD((entryPtr + 4 + 16 >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD((entryPtr + 16 >> 2) * 4, 4, 1)
  };
 }
 function makeSamplerEntry(entryPtr) {
  assert(entryPtr);
  var typeInt = SAFE_HEAP_LOAD((entryPtr + 4 >> 2) * 4, 4, 1);
  if (!typeInt) return undefined;
  return {
   "type": WebGPU.SamplerBindingType[typeInt]
  };
 }
 function makeTextureEntry(entryPtr) {
  assert(entryPtr);
  var sampleTypeInt = SAFE_HEAP_LOAD((entryPtr + 4 >> 2) * 4, 4, 1);
  if (!sampleTypeInt) return undefined;
  return {
   "sampleType": WebGPU.TextureSampleType[sampleTypeInt],
   "viewDimension": WebGPU.TextureViewDimension[SAFE_HEAP_LOAD((entryPtr + 8 >> 2) * 4, 4, 1)],
   "multisampled": SAFE_HEAP_LOAD(entryPtr + 12 >> 0, 1, 0) !== 0
  };
 }
 function makeStorageTextureEntry(entryPtr) {
  assert(entryPtr);
  var accessInt = SAFE_HEAP_LOAD((entryPtr + 4 >> 2) * 4, 4, 1);
  if (!accessInt) return undefined;
  return {
   "access": WebGPU.StorageTextureAccess[accessInt],
   "format": WebGPU.TextureFormat[SAFE_HEAP_LOAD((entryPtr + 8 >> 2) * 4, 4, 1)],
   "viewDimension": WebGPU.TextureViewDimension[SAFE_HEAP_LOAD((entryPtr + 12 >> 2) * 4, 4, 1)]
  };
 }
 function makeEntry(entryPtr) {
  assert(entryPtr);
  return {
   "binding": SAFE_HEAP_LOAD((entryPtr + 4 >> 2) * 4, 4, 1),
   "visibility": SAFE_HEAP_LOAD((entryPtr + 8 >> 2) * 4, 4, 1),
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
  "entries": makeEntries(SAFE_HEAP_LOAD((descriptor + 8 >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((descriptor + 12 >> 2) * 4, 4, 1))
 };
 var labelPtr = SAFE_HEAP_LOAD((descriptor + 4 >> 2) * 4, 4, 1);
 if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
 var device = WebGPU.mgrDevice.get(deviceId);
 return WebGPU.mgrBindGroupLayout.create(device["createBindGroupLayout"](desc));
}

function _wgpuDeviceCreateBuffer(deviceId, descriptor) {
 assert(descriptor);
 assert(SAFE_HEAP_LOAD((descriptor >> 2) * 4, 4, 1) === 0);
 var mappedAtCreation = SAFE_HEAP_LOAD(descriptor + 24 >> 0, 1, 0) !== 0;
 var desc = {
  "label": undefined,
  "usage": SAFE_HEAP_LOAD((descriptor + 8 >> 2) * 4, 4, 1),
  "size": SAFE_HEAP_LOAD((descriptor + 4 + 16 >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD((descriptor + 16 >> 2) * 4, 4, 1),
  "mappedAtCreation": mappedAtCreation
 };
 var labelPtr = SAFE_HEAP_LOAD((descriptor + 4 >> 2) * 4, 4, 1);
 if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
 var device = WebGPU.mgrDevice.get(deviceId);
 var bufferWrapper = {};
 var id = WebGPU.mgrBuffer.create(device["createBuffer"](desc), bufferWrapper);
 if (mappedAtCreation) {
  bufferWrapper.mapMode = 2;
  bufferWrapper.onUnmap = [];
 }
 return id;
}

function _wgpuDeviceCreateCommandEncoder(deviceId, descriptor) {
 var desc;
 if (descriptor) {
  assert(descriptor);
  assert(SAFE_HEAP_LOAD((descriptor >> 2) * 4, 4, 1) === 0);
  desc = {
   "label": undefined
  };
  var labelPtr = SAFE_HEAP_LOAD((descriptor + 4 >> 2) * 4, 4, 1);
  if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
 }
 var device = WebGPU.mgrDevice.get(deviceId);
 return WebGPU.mgrCommandEncoder.create(device["createCommandEncoder"](desc));
}

function _wgpuDeviceCreatePipelineLayout(deviceId, descriptor) {
 assert(descriptor);
 assert(SAFE_HEAP_LOAD((descriptor >> 2) * 4, 4, 1) === 0);
 var bglCount = SAFE_HEAP_LOAD((descriptor + 8 >> 2) * 4, 4, 1);
 var bglPtr = SAFE_HEAP_LOAD((descriptor + 12 >> 2) * 4, 4, 1);
 var bgls = [];
 for (var i = 0; i < bglCount; ++i) {
  bgls.push(WebGPU.mgrBindGroupLayout.get(SAFE_HEAP_LOAD((bglPtr + 4 * i >> 2) * 4, 4, 1)));
 }
 var desc = {
  "label": undefined,
  "bindGroupLayouts": bgls
 };
 var labelPtr = SAFE_HEAP_LOAD((descriptor + 4 >> 2) * 4, 4, 1);
 if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
 var device = WebGPU.mgrDevice.get(deviceId);
 return WebGPU.mgrPipelineLayout.create(device["createPipelineLayout"](desc));
}

function _wgpuDeviceCreateRenderPipeline(deviceId, descriptor) {
 assert(descriptor);
 assert(SAFE_HEAP_LOAD((descriptor >> 2) * 4, 4, 1) === 0);
 function makePrimitiveState(rsPtr) {
  if (!rsPtr) return undefined;
  assert(rsPtr);
  assert(SAFE_HEAP_LOAD((rsPtr >> 2) * 4, 4, 1) === 0);
  return {
   "topology": WebGPU.PrimitiveTopology[SAFE_HEAP_LOAD((rsPtr + 4 >> 2) * 4, 4, 1)],
   "stripIndexFormat": WebGPU.IndexFormat[SAFE_HEAP_LOAD((rsPtr + 8 >> 2) * 4, 4, 1)],
   "frontFace": WebGPU.FrontFace[SAFE_HEAP_LOAD((rsPtr + 12 >> 2) * 4, 4, 1)],
   "cullMode": WebGPU.CullMode[SAFE_HEAP_LOAD((rsPtr + 16 >> 2) * 4, 4, 1)]
  };
 }
 function makeBlendComponent(bdPtr) {
  if (!bdPtr) return undefined;
  return {
   "operation": WebGPU.BlendOperation[SAFE_HEAP_LOAD((bdPtr >> 2) * 4, 4, 1)],
   "srcFactor": WebGPU.BlendFactor[SAFE_HEAP_LOAD((bdPtr + 4 >> 2) * 4, 4, 1)],
   "dstFactor": WebGPU.BlendFactor[SAFE_HEAP_LOAD((bdPtr + 8 >> 2) * 4, 4, 1)]
  };
 }
 function makeBlendState(bsPtr) {
  if (!bsPtr) return undefined;
  assert(bsPtr);
  assert(SAFE_HEAP_LOAD((bsPtr >> 2) * 4, 4, 1) === 0);
  return {
   "alpha": makeBlendComponent(bsPtr + 12),
   "color": makeBlendComponent(bsPtr + 0)
  };
 }
 function makeColorState(csPtr) {
  assert(csPtr);
  assert(SAFE_HEAP_LOAD((csPtr >> 2) * 4, 4, 1) === 0);
  var formatInt = SAFE_HEAP_LOAD((csPtr + 4 >> 2) * 4, 4, 1);
  return formatInt === 0 ? undefined : {
   "format": WebGPU.TextureFormat[formatInt],
   "blend": makeBlendState(SAFE_HEAP_LOAD((csPtr + 8 >> 2) * 4, 4, 1)),
   "writeMask": SAFE_HEAP_LOAD((csPtr + 12 >> 2) * 4, 4, 1)
  };
 }
 function makeColorStates(count, csArrayPtr) {
  var states = [];
  for (var i = 0; i < count; ++i) {
   states.push(makeColorState(csArrayPtr + 16 * i));
  }
  return states;
 }
 function makeStencilStateFace(ssfPtr) {
  assert(ssfPtr);
  return {
   "compare": WebGPU.CompareFunction[SAFE_HEAP_LOAD((ssfPtr >> 2) * 4, 4, 1)],
   "failOp": WebGPU.StencilOperation[SAFE_HEAP_LOAD((ssfPtr + 4 >> 2) * 4, 4, 1)],
   "depthFailOp": WebGPU.StencilOperation[SAFE_HEAP_LOAD((ssfPtr + 8 >> 2) * 4, 4, 1)],
   "passOp": WebGPU.StencilOperation[SAFE_HEAP_LOAD((ssfPtr + 12 >> 2) * 4, 4, 1)]
  };
 }
 function makeDepthStencilState(dssPtr) {
  if (!dssPtr) return undefined;
  assert(dssPtr);
  return {
   "format": WebGPU.TextureFormat[SAFE_HEAP_LOAD((dssPtr + 4 >> 2) * 4, 4, 1)],
   "depthWriteEnabled": SAFE_HEAP_LOAD(dssPtr + 8 >> 0, 1, 0) !== 0,
   "depthCompare": WebGPU.CompareFunction[SAFE_HEAP_LOAD((dssPtr + 12 >> 2) * 4, 4, 1)],
   "stencilFront": makeStencilStateFace(dssPtr + 16),
   "stencilBack": makeStencilStateFace(dssPtr + 32),
   "stencilReadMask": SAFE_HEAP_LOAD((dssPtr + 48 >> 2) * 4, 4, 1),
   "stencilWriteMask": SAFE_HEAP_LOAD((dssPtr + 52 >> 2) * 4, 4, 1),
   "depthBias": SAFE_HEAP_LOAD((dssPtr + 56 >> 2) * 4, 4, 1),
   "depthBiasSlopeScale": SAFE_HEAP_LOAD_D((dssPtr + 60 >> 2) * 4, 4, 0),
   "depthBiasClamp": SAFE_HEAP_LOAD_D((dssPtr + 64 >> 2) * 4, 4, 0)
  };
 }
 function makeVertexAttribute(vaPtr) {
  assert(vaPtr);
  return {
   "format": WebGPU.VertexFormat[SAFE_HEAP_LOAD((vaPtr >> 2) * 4, 4, 1)],
   "offset": SAFE_HEAP_LOAD((vaPtr + 4 + 8 >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD((vaPtr + 8 >> 2) * 4, 4, 1),
   "shaderLocation": SAFE_HEAP_LOAD((vaPtr + 16 >> 2) * 4, 4, 1)
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
  var stepModeInt = SAFE_HEAP_LOAD((vbPtr + 8 >> 2) * 4, 4, 1);
  return stepModeInt === 2 ? null : {
   "arrayStride": SAFE_HEAP_LOAD((vbPtr + 4 >> 2) * 4, 4, 1) * 4294967296 + SAFE_HEAP_LOAD((vbPtr >> 2) * 4, 4, 1),
   "stepMode": WebGPU.VertexStepMode[stepModeInt],
   "attributes": makeVertexAttributes(SAFE_HEAP_LOAD((vbPtr + 12 >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((vbPtr + 16 >> 2) * 4, 4, 1))
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
  assert(SAFE_HEAP_LOAD((viPtr >> 2) * 4, 4, 1) === 0);
  return {
   "module": WebGPU.mgrShaderModule.get(SAFE_HEAP_LOAD((viPtr + 4 >> 2) * 4, 4, 1)),
   "entryPoint": UTF8ToString(SAFE_HEAP_LOAD((viPtr + 8 >> 2) * 4, 4, 1)),
   "constants": WebGPU.makePipelineConstants(SAFE_HEAP_LOAD((viPtr + 12 >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((viPtr + 16 >> 2) * 4, 4, 1)),
   "buffers": makeVertexBuffers(SAFE_HEAP_LOAD((viPtr + 20 >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((viPtr + 24 >> 2) * 4, 4, 1))
  };
 }
 function makeMultisampleState(msPtr) {
  if (!msPtr) return undefined;
  assert(msPtr);
  assert(SAFE_HEAP_LOAD((msPtr >> 2) * 4, 4, 1) === 0);
  return {
   "count": SAFE_HEAP_LOAD((msPtr + 4 >> 2) * 4, 4, 1),
   "mask": SAFE_HEAP_LOAD((msPtr + 8 >> 2) * 4, 4, 1),
   "alphaToCoverageEnabled": SAFE_HEAP_LOAD(msPtr + 12 >> 0, 1, 0) !== 0
  };
 }
 function makeFragmentState(fsPtr) {
  if (!fsPtr) return undefined;
  assert(fsPtr);
  assert(SAFE_HEAP_LOAD((fsPtr >> 2) * 4, 4, 1) === 0);
  return {
   "module": WebGPU.mgrShaderModule.get(SAFE_HEAP_LOAD((fsPtr + 4 >> 2) * 4, 4, 1)),
   "entryPoint": UTF8ToString(SAFE_HEAP_LOAD((fsPtr + 8 >> 2) * 4, 4, 1)),
   "constants": WebGPU.makePipelineConstants(SAFE_HEAP_LOAD((fsPtr + 12 >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((fsPtr + 16 >> 2) * 4, 4, 1)),
   "targets": makeColorStates(SAFE_HEAP_LOAD((fsPtr + 20 >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((fsPtr + 24 >> 2) * 4, 4, 1))
  };
 }
 var desc = {
  "label": undefined,
  "layout": WebGPU.mgrPipelineLayout.get(SAFE_HEAP_LOAD((descriptor + 8 >> 2) * 4, 4, 1)),
  "vertex": makeVertexState(descriptor + 12),
  "primitive": makePrimitiveState(descriptor + 40),
  "depthStencil": makeDepthStencilState(SAFE_HEAP_LOAD((descriptor + 60 >> 2) * 4, 4, 1)),
  "multisample": makeMultisampleState(descriptor + 64),
  "fragment": makeFragmentState(SAFE_HEAP_LOAD((descriptor + 80 >> 2) * 4, 4, 1))
 };
 var labelPtr = SAFE_HEAP_LOAD((descriptor + 4 >> 2) * 4, 4, 1);
 if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
 var device = WebGPU.mgrDevice.get(deviceId);
 return WebGPU.mgrRenderPipeline.create(device["createRenderPipeline"](desc));
}

function _wgpuDeviceCreateShaderModule(deviceId, descriptor) {
 assert(descriptor);
 var nextInChainPtr = SAFE_HEAP_LOAD((descriptor >> 2) * 4, 4, 1);
 assert(nextInChainPtr !== 0);
 var sType = SAFE_HEAP_LOAD((nextInChainPtr + 4 >> 2) * 4, 4, 1);
 var desc = {
  "label": undefined,
  "code": ""
 };
 var labelPtr = SAFE_HEAP_LOAD((descriptor + 4 >> 2) * 4, 4, 1);
 if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
 switch (sType) {
 case 5:
  {
   var count = SAFE_HEAP_LOAD((nextInChainPtr + 8 >> 2) * 4, 4, 1);
   var start = SAFE_HEAP_LOAD((nextInChainPtr + 12 >> 2) * 4, 4, 1);
   desc["code"] = HEAPU32.subarray(start >> 2, (start >> 2) + count);
   break;
  }

 case 6:
  {
   var sourcePtr = SAFE_HEAP_LOAD((nextInChainPtr + 8 >> 2) * 4, 4, 1);
   if (sourcePtr) {
    desc["code"] = UTF8ToString(sourcePtr);
   }
   break;
  }

 default:
  abort("unrecognized ShaderModule sType");
 }
 var device = WebGPU.mgrDevice.get(deviceId);
 return WebGPU.mgrShaderModule.create(device["createShaderModule"](desc));
}

function _wgpuDeviceCreateSwapChain(deviceId, surfaceId, descriptor) {
 assert(descriptor);
 assert(SAFE_HEAP_LOAD((descriptor >> 2) * 4, 4, 1) === 0);
 var device = WebGPU.mgrDevice.get(deviceId);
 var context = WebGPU.mgrSurface.get(surfaceId);
 assert(2 === SAFE_HEAP_LOAD((descriptor + 24 >> 2) * 4, 4, 1));
 var canvasSize = [ SAFE_HEAP_LOAD((descriptor + 16 >> 2) * 4, 4, 1), SAFE_HEAP_LOAD((descriptor + 20 >> 2) * 4, 4, 1) ];
 if (canvasSize[0] !== 0) {
  context["canvas"]["width"] = canvasSize[0];
 }
 if (canvasSize[1] !== 0) {
  context["canvas"]["height"] = canvasSize[1];
 }
 var configuration = {
  "device": device,
  "format": WebGPU.TextureFormat[SAFE_HEAP_LOAD((descriptor + 12 >> 2) * 4, 4, 1)],
  "usage": SAFE_HEAP_LOAD((descriptor + 8 >> 2) * 4, 4, 1),
  "alphaMode": "opaque"
 };
 context["configure"](configuration);
 return WebGPU.mgrSwapChain.create(context);
}

function _wgpuDeviceCreateTexture(deviceId, descriptor) {
 assert(descriptor);
 assert(SAFE_HEAP_LOAD((descriptor >> 2) * 4, 4, 1) === 0);
 var desc = {
  "label": undefined,
  "size": WebGPU.makeExtent3D(descriptor + 16),
  "mipLevelCount": SAFE_HEAP_LOAD((descriptor + 32 >> 2) * 4, 4, 1),
  "sampleCount": SAFE_HEAP_LOAD((descriptor + 36 >> 2) * 4, 4, 1),
  "dimension": WebGPU.TextureDimension[SAFE_HEAP_LOAD((descriptor + 12 >> 2) * 4, 4, 1)],
  "format": WebGPU.TextureFormat[SAFE_HEAP_LOAD((descriptor + 28 >> 2) * 4, 4, 1)],
  "usage": SAFE_HEAP_LOAD((descriptor + 8 >> 2) * 4, 4, 1)
 };
 var labelPtr = SAFE_HEAP_LOAD((descriptor + 4 >> 2) * 4, 4, 1);
 if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
 var viewFormatCount = SAFE_HEAP_LOAD((descriptor + 40 >> 2) * 4, 4, 1);
 if (viewFormatCount) {
  var viewFormatsPtr = SAFE_HEAP_LOAD((descriptor + 44 >> 2) * 4, 4, 1);
  desc["viewFormats"] = Array.from(HEAP32.subarray(viewFormatsPtr >> 2, (viewFormatsPtr >> 2) + viewFormatCount), function(format) {
   return WebGPU.TextureFormat[format];
  });
 }
 var device = WebGPU.mgrDevice.get(deviceId);
 return WebGPU.mgrTexture.create(device["createTexture"](desc));
}

function _wgpuDeviceGetQueue(deviceId) {
 var queueId = WebGPU.mgrDevice.objects[deviceId].queueId;
 assert(queueId, "wgpuDeviceGetQueue: queue was missing or null");
 WebGPU.mgrQueue.reference(queueId);
 return queueId;
}

function _wgpuDeviceReference(id) {
 WebGPU.mgrDevice.reference(id);
}

function _wgpuDeviceRelease(id) {
 WebGPU.mgrDevice.release(id);
}

function _wgpuDeviceSetUncapturedErrorCallback(deviceId, callback, userdata) {
 var device = WebGPU.mgrDevice.get(deviceId);
 device["onuncapturederror"] = function(ev) {
  callUserCallback(function() {
   var Validation = 1;
   var OutOfMemory = 2;
   var type;
   assert(typeof GPUValidationError != "undefined");
   assert(typeof GPUOutOfMemoryError != "undefined");
   if (ev.error instanceof GPUValidationError) type = Validation; else if (ev.error instanceof GPUOutOfMemoryError) type = OutOfMemory;
   var messagePtr = allocateUTF8(ev.error.message);
   getWasmTableEntry(callback)(type, messagePtr, userdata);
   _free(messagePtr);
  });
 };
}

function maybeCStringToJsString(cString) {
 return cString > 2 ? UTF8ToString(cString) : cString;
}

var specialHTMLTargets = [ 0, typeof document != "undefined" ? document : 0, typeof window != "undefined" ? window : 0 ];

function findEventTarget(target) {
 target = maybeCStringToJsString(target);
 var domElement = specialHTMLTargets[target] || (typeof document != "undefined" ? document.querySelector(target) : undefined);
 return domElement;
}

function findCanvasEventTarget(target) {
 return findEventTarget(target);
}

function _wgpuInstanceCreateSurface(instanceId, descriptor) {
 assert(descriptor);
 assert(instanceId === 0, "WGPUInstance is ignored");
 var nextInChainPtr = SAFE_HEAP_LOAD((descriptor >> 2) * 4, 4, 1);
 assert(nextInChainPtr !== 0);
 assert(4 === SAFE_HEAP_LOAD((nextInChainPtr + 4 >> 2) * 4, 4, 1));
 var descriptorFromCanvasHTMLSelector = nextInChainPtr;
 assert(descriptorFromCanvasHTMLSelector);
 assert(SAFE_HEAP_LOAD((descriptorFromCanvasHTMLSelector >> 2) * 4, 4, 1) === 0);
 var selectorPtr = SAFE_HEAP_LOAD((descriptorFromCanvasHTMLSelector + 8 >> 2) * 4, 4, 1);
 assert(selectorPtr);
 var canvas = findCanvasEventTarget(selectorPtr);
 var context = canvas.getContext("webgpu");
 assert(context);
 if (!context) return 0;
 var labelPtr = SAFE_HEAP_LOAD((descriptor + 4 >> 2) * 4, 4, 1);
 if (labelPtr) context.surfaceLabelWebGPU = UTF8ToString(labelPtr);
 return WebGPU.mgrSurface.create(context);
}

function _wgpuInstanceRelease() {
 abort("TODO: no WGPUInstance object should exist");
}

function _wgpuInstanceRequestAdapter(instanceId, options, callback, userdata) {
 assert(instanceId === 0, "WGPUInstance is ignored");
 var opts;
 if (options) {
  assert(options);
  assert(SAFE_HEAP_LOAD((options >> 2) * 4, 4, 1) === 0);
  opts = {
   "powerPreference": WebGPU.PowerPreference[SAFE_HEAP_LOAD((options + 8 >> 2) * 4, 4, 1)],
   "forceFallbackAdapter": SAFE_HEAP_LOAD(options + 12 >> 0, 1, 0) !== 0
  };
 }
 if (!("gpu" in navigator)) {
  var messagePtr = allocateUTF8("WebGPU not available on this browser (navigator.gpu is not available)");
  getWasmTableEntry(callback)(1, 0, messagePtr, userdata);
  _free(messagePtr);
  return;
 }
 navigator["gpu"]["requestAdapter"](opts).then(function(adapter) {
  callUserCallback(function() {
   if (adapter) {
    var adapterId = WebGPU.mgrAdapter.create(adapter);
    getWasmTableEntry(callback)(0, adapterId, 0, userdata);
   } else {
    var messagePtr = allocateUTF8("WebGPU not available on this system (requestAdapter returned null)");
    getWasmTableEntry(callback)(1, 0, messagePtr, userdata);
    _free(messagePtr);
   }
  });
 }, function(ex) {
  callUserCallback(function() {
   var messagePtr = allocateUTF8(ex.message);
   getWasmTableEntry(callback)(2, 0, messagePtr, userdata);
   _free(messagePtr);
  });
 });
}

function _wgpuPipelineLayoutRelease(id) {
 WebGPU.mgrPipelineLayout.release(id);
}

function _wgpuQuerySetRelease(id) {
 WebGPU.mgrQuerySet.release(id);
}

function _wgpuQueueRelease(id) {
 WebGPU.mgrQueue.release(id);
}

function _wgpuQueueSubmit(queueId, commandCount, commands) {
 assert(commands % 4 === 0);
 var queue = WebGPU.mgrQueue.get(queueId);
 var cmds = Array.from(HEAP32.subarray(commands >> 2, (commands >> 2) + commandCount), function(id) {
  return WebGPU.mgrCommandBuffer.get(id);
 });
 queue["submit"](cmds);
}

function _wgpuRenderPassEncoderDraw(passId, vertexCount, instanceCount, firstVertex, firstInstance) {
 var pass = WebGPU.mgrRenderPassEncoder.get(passId);
 pass["draw"](vertexCount, instanceCount, firstVertex, firstInstance);
}

function _wgpuRenderPassEncoderEnd(passId) {
 var pass = WebGPU.mgrRenderPassEncoder.get(passId);
 pass["end"]();
}

function _wgpuRenderPassEncoderRelease(id) {
 WebGPU.mgrRenderPassEncoder.release(id);
}

function _wgpuRenderPassEncoderSetPipeline(passId, pipelineId) {
 var pass = WebGPU.mgrRenderPassEncoder.get(passId);
 var pipeline = WebGPU.mgrRenderPipeline.get(pipelineId);
 pass["setPipeline"](pipeline);
}

function _wgpuRenderPipelineRelease(id) {
 WebGPU.mgrRenderPipeline.release(id);
}

function _wgpuShaderModuleReference(id) {
 WebGPU.mgrShaderModule.reference(id);
}

function _wgpuShaderModuleRelease(id) {
 WebGPU.mgrShaderModule.release(id);
}

function _wgpuSurfaceRelease(id) {
 WebGPU.mgrSurface.release(id);
}

function _wgpuSwapChainGetCurrentTextureView(swapChainId) {
 var context = WebGPU.mgrSwapChain.get(swapChainId);
 return WebGPU.mgrTextureView.create(context["getCurrentTexture"]()["createView"]());
}

function _wgpuSwapChainRelease(id) {
 WebGPU.mgrSwapChain.release(id);
}

function _wgpuTextureCreateView(textureId, descriptor) {
 var desc;
 if (descriptor) {
  assert(descriptor);
  assert(SAFE_HEAP_LOAD((descriptor >> 2) * 4, 4, 1) === 0);
  var mipLevelCount = SAFE_HEAP_LOAD((descriptor + 20 >> 2) * 4, 4, 1);
  var arrayLayerCount = SAFE_HEAP_LOAD((descriptor + 28 >> 2) * 4, 4, 1);
  desc = {
   "format": WebGPU.TextureFormat[SAFE_HEAP_LOAD((descriptor + 8 >> 2) * 4, 4, 1)],
   "dimension": WebGPU.TextureViewDimension[SAFE_HEAP_LOAD((descriptor + 12 >> 2) * 4, 4, 1)],
   "baseMipLevel": SAFE_HEAP_LOAD((descriptor + 16 >> 2) * 4, 4, 1),
   "mipLevelCount": mipLevelCount === 4294967295 ? undefined : mipLevelCount,
   "baseArrayLayer": SAFE_HEAP_LOAD((descriptor + 24 >> 2) * 4, 4, 1),
   "arrayLayerCount": arrayLayerCount === 4294967295 ? undefined : arrayLayerCount,
   "aspect": WebGPU.TextureAspect[SAFE_HEAP_LOAD((descriptor + 32 >> 2) * 4, 4, 1)]
  };
  var labelPtr = SAFE_HEAP_LOAD((descriptor + 4 >> 2) * 4, 4, 1);
  if (labelPtr) desc["label"] = UTF8ToString(labelPtr);
 }
 var texture = WebGPU.mgrTexture.get(textureId);
 return WebGPU.mgrTextureView.create(texture["createView"](desc));
}

function _wgpuTextureReference(id) {
 WebGPU.mgrTexture.reference(id);
}

function _wgpuTextureRelease(id) {
 WebGPU.mgrTexture.release(id);
}

function _wgpuTextureViewReference(id) {
 WebGPU.mgrTextureView.reference(id);
}

function _wgpuTextureViewRelease(id) {
 WebGPU.mgrTextureView.release(id);
}

Module["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas) {
 Browser.requestFullscreen(lockPointer, resizeCanvas);
};

Module["requestFullScreen"] = function Module_requestFullScreen() {
 Browser.requestFullScreen();
};

Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
 Browser.requestAnimationFrame(func);
};

Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
 Browser.setCanvasSize(width, height, noUpdates);
};

Module["pauseMainLoop"] = function Module_pauseMainLoop() {
 Browser.mainLoop.pause();
};

Module["resumeMainLoop"] = function Module_resumeMainLoop() {
 Browser.mainLoop.resume();
};

Module["getUserMedia"] = function Module_getUserMedia() {
 Browser.getUserMedia();
};

Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
 return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes);
};

var preloadedImages = {};

var preloadedAudios = {};

WebGPU.initManagers();

var ASSERTIONS = true;

function checkIncomingModuleAPI() {
 ignoredModuleProp("fetchSettings");
}

var asmLibraryArg = {
 "__assert_fail": ___assert_fail,
 "abort": _abort,
 "alignfault": alignfault,
 "emscripten_cancel_main_loop": _emscripten_cancel_main_loop,
 "emscripten_memcpy_big": _emscripten_memcpy_big,
 "emscripten_resize_heap": _emscripten_resize_heap,
 "emscripten_set_main_loop": _emscripten_set_main_loop,
 "exit": _exit,
 "fd_write": _fd_write,
 "segfault": segfault,
 "wgpuAdapterRequestDevice": _wgpuAdapterRequestDevice,
 "wgpuBindGroupLayoutReference": _wgpuBindGroupLayoutReference,
 "wgpuBindGroupLayoutRelease": _wgpuBindGroupLayoutRelease,
 "wgpuBindGroupRelease": _wgpuBindGroupRelease,
 "wgpuBufferGetConstMappedRange": _wgpuBufferGetConstMappedRange,
 "wgpuBufferGetMappedRange": _wgpuBufferGetMappedRange,
 "wgpuBufferMapAsync": _wgpuBufferMapAsync,
 "wgpuBufferReference": _wgpuBufferReference,
 "wgpuBufferRelease": _wgpuBufferRelease,
 "wgpuBufferUnmap": _wgpuBufferUnmap,
 "wgpuCommandBufferRelease": _wgpuCommandBufferRelease,
 "wgpuCommandEncoderBeginRenderPass": _wgpuCommandEncoderBeginRenderPass,
 "wgpuCommandEncoderCopyBufferToBuffer": _wgpuCommandEncoderCopyBufferToBuffer,
 "wgpuCommandEncoderCopyTextureToBuffer": _wgpuCommandEncoderCopyTextureToBuffer,
 "wgpuCommandEncoderFinish": _wgpuCommandEncoderFinish,
 "wgpuCommandEncoderRelease": _wgpuCommandEncoderRelease,
 "wgpuDeviceCreateBindGroup": _wgpuDeviceCreateBindGroup,
 "wgpuDeviceCreateBindGroupLayout": _wgpuDeviceCreateBindGroupLayout,
 "wgpuDeviceCreateBuffer": _wgpuDeviceCreateBuffer,
 "wgpuDeviceCreateCommandEncoder": _wgpuDeviceCreateCommandEncoder,
 "wgpuDeviceCreatePipelineLayout": _wgpuDeviceCreatePipelineLayout,
 "wgpuDeviceCreateRenderPipeline": _wgpuDeviceCreateRenderPipeline,
 "wgpuDeviceCreateShaderModule": _wgpuDeviceCreateShaderModule,
 "wgpuDeviceCreateSwapChain": _wgpuDeviceCreateSwapChain,
 "wgpuDeviceCreateTexture": _wgpuDeviceCreateTexture,
 "wgpuDeviceGetQueue": _wgpuDeviceGetQueue,
 "wgpuDeviceReference": _wgpuDeviceReference,
 "wgpuDeviceRelease": _wgpuDeviceRelease,
 "wgpuDeviceSetUncapturedErrorCallback": _wgpuDeviceSetUncapturedErrorCallback,
 "wgpuInstanceCreateSurface": _wgpuInstanceCreateSurface,
 "wgpuInstanceRelease": _wgpuInstanceRelease,
 "wgpuInstanceRequestAdapter": _wgpuInstanceRequestAdapter,
 "wgpuPipelineLayoutRelease": _wgpuPipelineLayoutRelease,
 "wgpuQuerySetRelease": _wgpuQuerySetRelease,
 "wgpuQueueRelease": _wgpuQueueRelease,
 "wgpuQueueSubmit": _wgpuQueueSubmit,
 "wgpuRenderPassEncoderDraw": _wgpuRenderPassEncoderDraw,
 "wgpuRenderPassEncoderEnd": _wgpuRenderPassEncoderEnd,
 "wgpuRenderPassEncoderRelease": _wgpuRenderPassEncoderRelease,
 "wgpuRenderPassEncoderSetPipeline": _wgpuRenderPassEncoderSetPipeline,
 "wgpuRenderPipelineRelease": _wgpuRenderPipelineRelease,
 "wgpuShaderModuleReference": _wgpuShaderModuleReference,
 "wgpuShaderModuleRelease": _wgpuShaderModuleRelease,
 "wgpuSurfaceRelease": _wgpuSurfaceRelease,
 "wgpuSwapChainGetCurrentTextureView": _wgpuSwapChainGetCurrentTextureView,
 "wgpuSwapChainRelease": _wgpuSwapChainRelease,
 "wgpuTextureCreateView": _wgpuTextureCreateView,
 "wgpuTextureReference": _wgpuTextureReference,
 "wgpuTextureRelease": _wgpuTextureRelease,
 "wgpuTextureViewReference": _wgpuTextureViewReference,
 "wgpuTextureViewRelease": _wgpuTextureViewRelease
};

var asm = createWasm();

var ___wasm_call_ctors = Module["___wasm_call_ctors"] = createExportWrapper("__wasm_call_ctors");

var _main = Module["_main"] = createExportWrapper("main");

var ___errno_location = Module["___errno_location"] = createExportWrapper("__errno_location");

var _fflush = Module["_fflush"] = createExportWrapper("fflush");

var _malloc = Module["_malloc"] = createExportWrapper("malloc");

var _free = Module["_free"] = createExportWrapper("free");

var _emscripten_get_sbrk_ptr = Module["_emscripten_get_sbrk_ptr"] = createExportWrapper("emscripten_get_sbrk_ptr");

var _sbrk = Module["_sbrk"] = createExportWrapper("sbrk");

var _emscripten_stack_init = Module["_emscripten_stack_init"] = function() {
 return (_emscripten_stack_init = Module["_emscripten_stack_init"] = Module["asm"]["emscripten_stack_init"]).apply(null, arguments);
};

var _emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = function() {
 return (_emscripten_stack_get_free = Module["_emscripten_stack_get_free"] = Module["asm"]["emscripten_stack_get_free"]).apply(null, arguments);
};

var _emscripten_stack_get_base = Module["_emscripten_stack_get_base"] = function() {
 return (_emscripten_stack_get_base = Module["_emscripten_stack_get_base"] = Module["asm"]["emscripten_stack_get_base"]).apply(null, arguments);
};

var _emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = function() {
 return (_emscripten_stack_get_end = Module["_emscripten_stack_get_end"] = Module["asm"]["emscripten_stack_get_end"]).apply(null, arguments);
};

var stackSave = Module["stackSave"] = createExportWrapper("stackSave");

var stackRestore = Module["stackRestore"] = createExportWrapper("stackRestore");

var stackAlloc = Module["stackAlloc"] = createExportWrapper("stackAlloc");

var dynCall_jiji = Module["dynCall_jiji"] = createExportWrapper("dynCall_jiji");

var unexportedRuntimeSymbols = [ "run", "UTF8ArrayToString", "UTF8ToString", "stringToUTF8Array", "stringToUTF8", "lengthBytesUTF8", "addOnPreRun", "addOnInit", "addOnPreMain", "addOnExit", "addOnPostRun", "addRunDependency", "removeRunDependency", "FS_createFolder", "FS_createPath", "FS_createDataFile", "FS_createPreloadedFile", "FS_createLazyFile", "FS_createLink", "FS_createDevice", "FS_unlink", "getLEB", "getFunctionTables", "alignFunctionTables", "registerFunctions", "prettyPrint", "getCompilerSetting", "print", "printErr", "callMain", "abort", "keepRuntimeAlive", "wasmMemory", "stackAlloc", "stackSave", "stackRestore", "getTempRet0", "setTempRet0", "writeStackCookie", "checkStackCookie", "ptrToString", "zeroMemory", "stringToNewUTF8", "exitJS", "getHeapMax", "abortOnCannotGrowMemory", "emscripten_realloc_buffer", "ENV", "ERRNO_CODES", "ERRNO_MESSAGES", "setErrNo", "inetPton4", "inetNtop4", "inetPton6", "inetNtop6", "readSockaddr", "writeSockaddr", "DNS", "getHostByName", "Protocols", "Sockets", "getRandomDevice", "warnOnce", "traverseStack", "UNWIND_CACHE", "convertPCtoSourceLocation", "readAsmConstArgsArray", "readAsmConstArgs", "mainThreadEM_ASM", "jstoi_q", "jstoi_s", "getExecutableName", "listenOnce", "autoResumeAudioContext", "dynCallLegacy", "getDynCaller", "dynCall", "handleException", "runtimeKeepalivePush", "runtimeKeepalivePop", "callUserCallback", "maybeExit", "safeSetTimeout", "asmjsMangle", "asyncLoad", "alignMemory", "mmapAlloc", "writeI53ToI64", "writeI53ToI64Clamped", "writeI53ToI64Signaling", "writeI53ToU64Clamped", "writeI53ToU64Signaling", "readI53FromI64", "readI53FromU64", "convertI32PairToI53", "convertI32PairToI53Checked", "convertU32PairToI53", "getCFunc", "ccall", "cwrap", "uleb128Encode", "sigToWasmTypes", "generateFuncType", "convertJsFunctionToWasm", "freeTableIndexes", "functionsInTableMap", "getEmptyTableSlot", "updateTableMap", "addFunction", "removeFunction", "reallyNegative", "unSign", "strLen", "reSign", "formatString", "setValue", "getValue", "PATH", "PATH_FS", "intArrayFromString", "intArrayToString", "AsciiToString", "stringToAscii", "UTF16Decoder", "UTF16ToString", "stringToUTF16", "lengthBytesUTF16", "UTF32ToString", "stringToUTF32", "lengthBytesUTF32", "allocateUTF8", "allocateUTF8OnStack", "writeStringToMemory", "writeArrayToMemory", "writeAsciiToMemory", "SYSCALLS", "getSocketFromFD", "getSocketAddress", "JSEvents", "registerKeyEventCallback", "specialHTMLTargets", "maybeCStringToJsString", "findEventTarget", "findCanvasEventTarget", "getBoundingClientRect", "fillMouseEventData", "registerMouseEventCallback", "registerWheelEventCallback", "registerUiEventCallback", "registerFocusEventCallback", "fillDeviceOrientationEventData", "registerDeviceOrientationEventCallback", "fillDeviceMotionEventData", "registerDeviceMotionEventCallback", "screenOrientation", "fillOrientationChangeEventData", "registerOrientationChangeEventCallback", "fillFullscreenChangeEventData", "registerFullscreenChangeEventCallback", "JSEvents_requestFullscreen", "JSEvents_resizeCanvasForFullscreen", "registerRestoreOldStyle", "hideEverythingExceptGivenElement", "restoreHiddenElements", "setLetterbox", "currentFullscreenStrategy", "restoreOldWindowedStyle", "softFullscreenResizeWebGLRenderTarget", "doRequestFullscreen", "fillPointerlockChangeEventData", "registerPointerlockChangeEventCallback", "registerPointerlockErrorEventCallback", "requestPointerLock", "fillVisibilityChangeEventData", "registerVisibilityChangeEventCallback", "registerTouchEventCallback", "fillGamepadEventData", "registerGamepadEventCallback", "registerBeforeUnloadEventCallback", "fillBatteryEventData", "battery", "registerBatteryEventCallback", "setCanvasElementSize", "getCanvasElementSize", "demangle", "demangleAll", "jsStackTrace", "stackTrace", "ExitStatus", "getEnvStrings", "checkWasiClock", "flush_NO_FILESYSTEM", "dlopenMissingError", "createDyncallWrapper", "setImmediateWrapped", "clearImmediateWrapped", "polyfillSetImmediate", "uncaughtExceptionCount", "exceptionLast", "exceptionCaught", "ExceptionInfo", "exception_addRef", "exception_decRef", "Browser", "setMainLoop", "wget", "FS", "MEMFS", "TTY", "PIPEFS", "SOCKFS", "_setNetworkCallback", "tempFixedLengthArray", "miniTempWebGLFloatBuffers", "heapObjectForWebGLType", "heapAccessShiftForWebGLHeap", "GL", "emscriptenWebGLGet", "computeUnpackAlignedImageSize", "emscriptenWebGLGetTexPixelData", "emscriptenWebGLGetUniform", "webglGetUniformLocation", "webglPrepareUniformLocationsBeforeFirstUse", "webglGetLeftBracePos", "emscriptenWebGLGetVertexAttrib", "writeGLArray", "AL", "SDL_unicode", "SDL_ttfContext", "SDL_audio", "SDL", "SDL_gfx", "GLUT", "EGL", "GLFW_Window", "GLFW", "GLEW", "IDBStore", "runAndAbortIfError", "WebGPU", "JsValStore", "ALLOC_NORMAL", "ALLOC_STACK", "allocate" ];

unexportedRuntimeSymbols.forEach(unexportedRuntimeSymbol);

var missingLibrarySymbols = [ "ptrToString", "zeroMemory", "stringToNewUTF8", "emscripten_realloc_buffer", "setErrNo", "inetPton4", "inetNtop4", "inetPton6", "inetNtop6", "readSockaddr", "writeSockaddr", "getHostByName", "getRandomDevice", "traverseStack", "convertPCtoSourceLocation", "readAsmConstArgs", "mainThreadEM_ASM", "jstoi_q", "jstoi_s", "getExecutableName", "listenOnce", "autoResumeAudioContext", "dynCallLegacy", "getDynCaller", "dynCall", "runtimeKeepalivePush", "runtimeKeepalivePop", "asmjsMangle", "asyncLoad", "alignMemory", "mmapAlloc", "writeI53ToI64", "writeI53ToI64Clamped", "writeI53ToI64Signaling", "writeI53ToU64Clamped", "writeI53ToU64Signaling", "readI53FromI64", "readI53FromU64", "convertI32PairToI53", "convertI32PairToI53Checked", "convertU32PairToI53", "getCFunc", "ccall", "cwrap", "uleb128Encode", "sigToWasmTypes", "generateFuncType", "convertJsFunctionToWasm", "getEmptyTableSlot", "updateTableMap", "addFunction", "removeFunction", "reallyNegative", "strLen", "reSign", "formatString", "intArrayFromString", "intArrayToString", "AsciiToString", "stringToAscii", "UTF16ToString", "stringToUTF16", "lengthBytesUTF16", "UTF32ToString", "stringToUTF32", "lengthBytesUTF32", "allocateUTF8OnStack", "writeStringToMemory", "writeAsciiToMemory", "getSocketFromFD", "getSocketAddress", "registerKeyEventCallback", "getBoundingClientRect", "fillMouseEventData", "registerMouseEventCallback", "registerWheelEventCallback", "registerUiEventCallback", "registerFocusEventCallback", "fillDeviceOrientationEventData", "registerDeviceOrientationEventCallback", "fillDeviceMotionEventData", "registerDeviceMotionEventCallback", "screenOrientation", "fillOrientationChangeEventData", "registerOrientationChangeEventCallback", "fillFullscreenChangeEventData", "registerFullscreenChangeEventCallback", "JSEvents_requestFullscreen", "JSEvents_resizeCanvasForFullscreen", "registerRestoreOldStyle", "hideEverythingExceptGivenElement", "restoreHiddenElements", "setLetterbox", "softFullscreenResizeWebGLRenderTarget", "doRequestFullscreen", "fillPointerlockChangeEventData", "registerPointerlockChangeEventCallback", "registerPointerlockErrorEventCallback", "requestPointerLock", "fillVisibilityChangeEventData", "registerVisibilityChangeEventCallback", "registerTouchEventCallback", "fillGamepadEventData", "registerGamepadEventCallback", "registerBeforeUnloadEventCallback", "fillBatteryEventData", "battery", "registerBatteryEventCallback", "setCanvasElementSize", "getCanvasElementSize", "getEnvStrings", "checkWasiClock", "createDyncallWrapper", "setImmediateWrapped", "clearImmediateWrapped", "polyfillSetImmediate", "ExceptionInfo", "exception_addRef", "exception_decRef", "_setNetworkCallback", "heapObjectForWebGLType", "heapAccessShiftForWebGLHeap", "emscriptenWebGLGet", "computeUnpackAlignedImageSize", "emscriptenWebGLGetTexPixelData", "emscriptenWebGLGetUniform", "webglGetUniformLocation", "webglPrepareUniformLocationsBeforeFirstUse", "webglGetLeftBracePos", "emscriptenWebGLGetVertexAttrib", "writeGLArray", "SDL_unicode", "SDL_ttfContext", "SDL_audio", "GLFW_Window", "runAndAbortIfError", "ALLOC_NORMAL", "ALLOC_STACK", "allocate" ];

missingLibrarySymbols.forEach(missingLibrarySymbol);

var calledRun;

dependenciesFulfilled = function runCaller() {
 if (!calledRun) run();
 if (!calledRun) dependenciesFulfilled = runCaller;
};

function callMain(args) {
 assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on Module["onRuntimeInitialized"])');
 assert(__ATPRERUN__.length == 0, "cannot call main when preRun functions remain to be called");
 var entryFunction = Module["_main"];
 var argc = 0;
 var argv = 0;
 try {
  var ret = entryFunction(argc, argv);
  exitJS(ret, true);
  return ret;
 } catch (e) {
  return handleException(e);
 }
}

function stackCheckInit() {
 _emscripten_stack_init();
 writeStackCookie();
}

function run(args) {
 args = args || arguments_;
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
  if (shouldRunNow) callMain(args);
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
  warnOnce("stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the FAQ), or make sure to emit a newline when you printf etc.");
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
