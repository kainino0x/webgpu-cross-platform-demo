var e;e||=typeof Module != 'undefined' ? Module : {};var aa="object"==typeof window,ba="function"==typeof importScripts,ca="object"==typeof process&&"object"==typeof process.versions&&"string"==typeof process.versions.node,da=Object.assign({},e),ea=(a,b)=>{throw b;},h="",fa,ha;
if(ca){var fs=require("fs"),ia=require("path");h=__dirname+"/";ha=a=>{a=ja(a)?new URL(a):ia.normalize(a);return fs.readFileSync(a)};fa=a=>{a=ja(a)?new URL(a):ia.normalize(a);return new Promise((b,c)=>{fs.readFile(a,void 0,(f,d)=>{f?c(f):b(d.buffer)})})};process.argv.slice(2);"undefined"!=typeof module&&(module.exports=e);process.on("uncaughtException",a=>{if(!("unwind"===a||a instanceof ka||a.context instanceof ka))throw a;});ea=(a,b)=>{process.exitCode=a;throw b;}}else if(aa||ba)ba?h=self.location.href:
"undefined"!=typeof document&&document.currentScript&&(h=document.currentScript.src),h=h.startsWith("blob:")?"":h.substr(0,h.replace(/[?#].*/,"").lastIndexOf("/")+1),ba&&(ha=a=>{var b=new XMLHttpRequest;b.open("GET",a,!1);b.responseType="arraybuffer";b.send(null);return new Uint8Array(b.response)}),fa=a=>ja(a)?new Promise((b,c)=>{var f=new XMLHttpRequest;f.open("GET",a,!0);f.responseType="arraybuffer";f.onload=()=>{(200==f.status||0==f.status&&f.response)&&c(f.response);b(f.status)};f.onerror=b;f.send(null)}):
fetch(a,{credentials:"same-origin"}).then(b=>b.ok?b.arrayBuffer():Promise.reject(Error(b.status+" : "+b.url)));var la=e.print||console.log.bind(console),t=e.printErr||console.error.bind(console);Object.assign(e,da);da=null;e.quit&&(ea=e.quit);var w;e.wasmBinary&&(w=e.wasmBinary);var ma,x=!1,z,A,B,C,na,D,qa=[],ra=[],sa=[],ta=[];function ua(){var a=e.preRun.shift();qa.unshift(a)}var E=0,va=null,wa=null;
function xa(a){e.onAbort?.(a);a="Aborted("+a+")";t(a);x=!0;z=1;throw new WebAssembly.RuntimeError(a+". Build with -sASSERTIONS for more info.");}var ya=a=>a.startsWith("data:application/octet-stream;base64,"),ja=a=>a.startsWith("file://"),za;function Aa(a){if(a==za&&w)return new Uint8Array(w);if(ha)return ha(a);throw"both async and sync fetching of the wasm failed";}function Ba(a){return w?Promise.resolve().then(()=>Aa(a)):fa(a).then(b=>new Uint8Array(b),()=>Aa(a))}
function Ca(a,b,c){return Ba(a).then(f=>WebAssembly.instantiate(f,b)).then(c,f=>{t(`failed to asynchronously prepare wasm: ${f}`);xa(f)})}function Da(a,b){var c=za;w||"function"!=typeof WebAssembly.instantiateStreaming||ya(c)||ja(c)||ca||"function"!=typeof fetch?Ca(c,a,b):fetch(c,{credentials:"same-origin"}).then(f=>WebAssembly.instantiateStreaming(f,a).then(b,function(d){t(`wasm streaming compile failed: ${d}`);t("falling back to ArrayBuffer instantiation");return Ca(c,a,b)}))}
function ka(a){this.name="ExitStatus";this.message=`Program terminated with exit(${a})`;this.status=a}
var Ea=a=>{for(;0<a.length;)a.shift()(e)},Ha=e.noExitRuntime||!0,Ia="undefined"!=typeof TextDecoder?new TextDecoder:void 0,F=(a,b)=>{for(var c=b+NaN,f=b;a[f]&&!(f>=c);)++f;if(16<f-b&&a.buffer&&Ia)return Ia.decode(a.subarray(b,f));for(c="";b<f;){var d=a[b++];if(d&128){var g=a[b++]&63;if(192==(d&224))c+=String.fromCharCode((d&31)<<6|g);else{var k=a[b++]&63;d=224==(d&240)?(d&15)<<12|g<<6|k:(d&7)<<18|g<<12|k<<6|a[b++]&63;65536>d?c+=String.fromCharCode(d):(d-=65536,c+=String.fromCharCode(55296|d>>10,56320|
d&1023))}}else c+=String.fromCharCode(d)}return c},Sa=(a,b)=>{Ja=a;Ka=b;if(La)if(Ma||=!0,0==a)G=function(){var f=Math.max(0,Na+b-Oa())|0;setTimeout(Pa,f)};else if(1==a)G=function(){Qa(Pa)};else if(2==a){if("undefined"==typeof Ra)if("undefined"==typeof setImmediate){var c=[];addEventListener("message",f=>{if("setimmediate"===f.data||"setimmediate"===f.data.target)f.stopPropagation(),c.shift()()},!0);Ra=function(f){c.push(f);if(ba){let d;(d=e).setImmediates??(d.setImmediates=[]);e.setImmediates.push(f);
postMessage({target:"setimmediate"})}else postMessage("setimmediate","*")}}else Ra=setImmediate;G=function(){Ra(Pa)}}},Oa;Oa=()=>performance.now();
var Ya=(a,b,c,f,d)=>{La=a;Ta=f;var g=H;Ma=!1;Pa=function(){if(!x)if(0<Ua.length){var k=Ua.shift();k.Ea(k.Aa);if(Va){var m=Va,n=0==m%1?m-1:Math.floor(m);Va=k.Ba?n:(8*m+(n+.5))/9}e.setStatus&&(k=e.statusMessage||"Please wait...",m=Va,n=Wa.Da,m?m<n?e.setStatus("{message} ({expected - remaining}/{expected})"):e.setStatus(k):e.setStatus(""));g<H||setTimeout(Pa,0)}else g<H||(Xa=Xa+1|0,1==Ja&&1<Ka&&0!=Xa%Ka?G():(0==Ja&&(Na=Oa()),x||e.preMainLoop&&!1===e.preMainLoop()||(I(a),e.postMainLoop?.()),g<H||("object"==
typeof SDL&&SDL.audio?.Ja?.(),G())))};d||(b&&0<b?Sa(0,1E3/b):Sa(1,1),G());if(c)throw"unwind";},Za=a=>{a instanceof ka||"unwind"==a||ea(1,a)},$a=a=>{z=a;Ha||(e.onExit?.(a),x=!0);ea(a,new ka(a))},I=a=>{if(!x)try{if(a(),!Ha)try{z=a=z,$a(a)}catch(b){Za(b)}}catch(b){Za(b)}},ab=a=>{setTimeout(()=>{I(a)},1E4)},J=()=>{var a="getMappedRange size=0 no longer means WGPU_WHOLE_MAP_SIZE";J.sa||(J.sa={});J.sa[a]||(J.sa[a]=1,ca&&(a="warning: "+a),t(a))},bb=e.preloadPlugins||[],Ma=!1,G=null,H=0,La=null,Ta=0,Ja=0,
Ka=0,Xa=0,Ua=[];function cb(){G=null;H++}var Wa={},Na,Pa,Va,db=!1,eb=!1,fb=[];
function gb(){function a(){eb=document.pointerLockElement===e.canvas||document.mozPointerLockElement===e.canvas||document.webkitPointerLockElement===e.canvas||document.msPointerLockElement===e.canvas}if(!hb){hb=!0;bb.push({canHandle:function(c){return!e.Ia&&/\.(jpg|jpeg|png|bmp)$/i.test(c)},handle:function(c,f,d,g){var k=new Blob([c],{type:ib(f)});k.size!==c.length&&(k=new Blob([(new Uint8Array(c)).buffer],{type:ib(f)}));var m=URL.createObjectURL(k),n=new Image;n.onload=()=>{var p=document.createElement("canvas");
p.width=n.width;p.height=n.height;p.getContext("2d").drawImage(n,0,0);URL.revokeObjectURL(m);d?.(c)};n.onerror=()=>{t(`Image ${m} could not be decoded`);g?.()};n.src=m}});bb.push({canHandle:function(c){return!e.Ha&&c.substr(-4)in{".ogg":1,".wav":1,".mp3":1}},handle:function(c,f,d){function g(){k||(k=!0,d?.(c))}var k=!1,m=URL.createObjectURL(new Blob([c],{type:ib(f)})),n=new Audio;n.addEventListener("canplaythrough",()=>g(n),!1);n.onerror=function(){if(!k){t(`warning: browser could not fully decode audio ${f}, trying slower base64 approach`);
for(var p="",u=0,l=0,v=0;v<c.length;v++)for(u=u<<8|c[v],l+=8;6<=l;){var q=u>>l-6&63;l-=6;p+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[q]}2==l?(p+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[(u&3)<<4],p+="=="):4==l&&(p+="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"[(u&15)<<2],p+="=");n.src="data:audio/x-"+f.substr(-3)+";base64,"+p;g(n)}};n.src=m;ab(()=>{g(n)})}});var b=e.canvas;b&&(b.requestPointerLock=b.requestPointerLock||b.mozRequestPointerLock||
b.webkitRequestPointerLock||b.msRequestPointerLock||(()=>{}),b.exitPointerLock=document.exitPointerLock||document.mozExitPointerLock||document.webkitExitPointerLock||document.msExitPointerLock||(()=>{}),b.exitPointerLock=b.exitPointerLock.bind(document),document.addEventListener("pointerlockchange",a,!1),document.addEventListener("mozpointerlockchange",a,!1),document.addEventListener("webkitpointerlockchange",a,!1),document.addEventListener("mspointerlockchange",a,!1),e.elementPointerLock&&b.addEventListener("click",
c=>{!eb&&e.canvas.requestPointerLock&&(e.canvas.requestPointerLock(),c.preventDefault())},!1))}}var jb=!1,kb=void 0,K=void 0;function lb(){if(!db)return!1;(document.exitFullscreen||document.cancelFullScreen||document.mozCancelFullScreen||document.msExitFullscreen||document.webkitCancelFullScreen||(()=>{})).apply(document,[]);return!0}var mb=0;
function Qa(a){if("function"==typeof requestAnimationFrame)requestAnimationFrame(a);else{var b=Date.now();if(0===mb)mb=b+1E3/60;else for(;b+2>=mb;)mb+=1E3/60;setTimeout(a,Math.max(mb-b,0))}}function ib(a){return{jpg:"image/jpeg",jpeg:"image/jpeg",png:"image/png",bmp:"image/bmp",ogg:"audio/ogg",wav:"audio/wav",mp3:"audio/mpeg"}[a.substr(a.lastIndexOf(".")+1)]}var nb=[];function ob(){var a=e.canvas;nb.forEach(b=>b(a.width,a.height))}
function pb(a,b,c){b&&c?(a.ya=b,a.va=c):(b=a.ya,c=a.va);var f=b,d=c;e.forcedAspectRatio&&0<e.forcedAspectRatio&&(f/d<e.forcedAspectRatio?f=Math.round(d*e.forcedAspectRatio):d=Math.round(f/e.forcedAspectRatio));if((document.fullscreenElement||document.mozFullScreenElement||document.msFullscreenElement||document.webkitFullscreenElement||document.webkitCurrentFullScreenElement)===a.parentNode&&"undefined"!=typeof screen){var g=Math.min(screen.width/f,screen.height/d);f=Math.round(f*g);d=Math.round(d*
g)}K?(a.width!=f&&(a.width=f),a.height!=d&&(a.height=d),"undefined"!=typeof a.style&&(a.style.removeProperty("width"),a.style.removeProperty("height"))):(a.width!=b&&(a.width=b),a.height!=c&&(a.height=c),"undefined"!=typeof a.style&&(f!=b||d!=c?(a.style.setProperty("width",f+"px","important"),a.style.setProperty("height",d+"px","important")):(a.style.removeProperty("width"),a.style.removeProperty("height"))))}
var Ra,hb,qb=[],rb,L=a=>{var b=qb[a];b||(a>=qb.length&&(qb.length=a+1),qb[a]=b=rb.get(a));return b},sb=[null,[],[]],M=a=>{for(var b=0,c=0;c<a.length;++c){var f=a.charCodeAt(c);127>=f?b++:2047>=f?b+=2:55296<=f&&57343>=f?(b+=4,++c):b+=3}var d=b+1;b=tb(d);c=b;f=A;if(0<d){d=c+d-1;for(var g=0;g<a.length;++g){var k=a.charCodeAt(g);if(55296<=k&&57343>=k){var m=a.charCodeAt(++g);k=65536+((k&1023)<<10)|m&1023}if(127>=k){if(c>=d)break;f[c++]=k}else{if(2047>=k){if(c+1>=d)break;f[c++]=192|k>>6}else{if(65535>=
k){if(c+2>=d)break;f[c++]=224|k>>12}else{if(c+3>=d)break;f[c++]=240|k>>18;f[c++]=128|k>>12&63}f[c++]=128|k>>6&63}f[c++]=128|k&63}}f[c]=0}return b},ub=a=>({width:C[a>>2],height:C[a+4>>2],depthOrArrayLayers:C[a+8>>2]}),vb=(a,b)=>{if(a){for(var c={},f=0;f<a;++f){var d=b+16*f;var g=(g=C[d+4>>2])?F(A,g):"";c[g]=D[d+8>>3]}return c}},xb=a=>a?wb.get(a):"auto",yb={undefined:1,La:1,Ca:2},zb=[,"zero","one","src","one-minus-src","src-alpha","one-minus-src-alpha","dst","one-minus-dst","dst-alpha","one-minus-dst-alpha",
"src-alpha-saturated","constant","one-minus-constant"],Ab=[,"add","subtract","reverse-subtract","min","max"],Bb=[,"uniform","storage","read-only-storage"],Cb=[,"never","less","equal","less-equal","greater","not-equal","greater-equal","always"],Db=[,"none","front","back"],Eb=[,"depth-clip-control","depth32float-stencil8","timestamp-query","texture-compression-bc","texture-compression-etc2","texture-compression-astc","indirect-first-instance","shader-f16","rg11b10ufloat-renderable","bgra8unorm-storage",
"float32-filterable"],Fb=[,"ccw","cw"],Hb=[,"uint16","uint32"],Ib=[,"clear","load"],Jb=[,"low-power","high-performance"],Kb=[,"point-list","line-list","line-strip","triangle-list","triangle-strip"],Lb=[,"filtering","non-filtering","comparison"],Mb=[,"keep","zero","replace","invert","increment-clamp","decrement-clamp","increment-wrap","decrement-wrap"],Nb=[,"write-only","read-only","read-write"],Ob=[,"store","discard"],Pb=[,"all","stencil-only","depth-only"],Qb=[,"1d","2d","3d"],N=[,"r8unorm","r8snorm",
"r8uint","r8sint","r16uint","r16sint","r16float","rg8unorm","rg8snorm","rg8uint","rg8sint","r32float","r32uint","r32sint","rg16uint","rg16sint","rg16float","rgba8unorm","rgba8unorm-srgb","rgba8snorm","rgba8uint","rgba8sint","bgra8unorm","bgra8unorm-srgb","rgb10a2uint","rgb10a2unorm","rg11b10ufloat","rgb9e5ufloat","rg32float","rg32uint","rg32sint","rgba16uint","rgba16sint","rgba16float","rgba32float","rgba32uint","rgba32sint","stencil8","depth16unorm","depth24plus","depth24plus-stencil8","depth32float",
"depth32float-stencil8","bc1-rgba-unorm","bc1-rgba-unorm-srgb","bc2-rgba-unorm","bc2-rgba-unorm-srgb","bc3-rgba-unorm","bc3-rgba-unorm-srgb","bc4-r-unorm","bc4-r-snorm","bc5-rg-unorm","bc5-rg-snorm","bc6h-rgb-ufloat","bc6h-rgb-float","bc7-rgba-unorm","bc7-rgba-unorm-srgb","etc2-rgb8unorm","etc2-rgb8unorm-srgb","etc2-rgb8a1unorm","etc2-rgb8a1unorm-srgb","etc2-rgba8unorm","etc2-rgba8unorm-srgb","eac-r11unorm","eac-r11snorm","eac-rg11unorm","eac-rg11snorm","astc-4x4-unorm","astc-4x4-unorm-srgb","astc-5x4-unorm",
"astc-5x4-unorm-srgb","astc-5x5-unorm","astc-5x5-unorm-srgb","astc-6x5-unorm","astc-6x5-unorm-srgb","astc-6x6-unorm","astc-6x6-unorm-srgb","astc-8x5-unorm","astc-8x5-unorm-srgb","astc-8x6-unorm","astc-8x6-unorm-srgb","astc-8x8-unorm","astc-8x8-unorm-srgb","astc-10x5-unorm","astc-10x5-unorm-srgb","astc-10x6-unorm","astc-10x6-unorm-srgb","astc-10x8-unorm","astc-10x8-unorm-srgb","astc-10x10-unorm","astc-10x10-unorm-srgb","astc-12x10-unorm","astc-12x10-unorm-srgb","astc-12x12-unorm","astc-12x12-unorm-srgb"],
Rb=[,"float","unfilterable-float","depth","sint","uint"],Sb=[,"1d","2d","2d-array","cube","cube-array","3d"],Tb=[,"uint8x2","uint8x4","sint8x2","sint8x4","unorm8x2","unorm8x4","snorm8x2","snorm8x4","uint16x2","uint16x4","sint16x2","sint16x4","unorm16x2","unorm16x4","snorm16x2","snorm16x4","float16x2","float16x4","float32","float32x2","float32x3","float32x4","uint32","uint32x2","uint32x3","uint32x4","sint32","sint32x2","sint32x3","sint32x4","unorm10-10-10-2"],Ub=[,"vertex-buffer-not-used","vertex",
"instance"],O,Vb,Wb,Xb,P,Yb,Q,R,Zb,$b,S,ac,T,U,bc,V,wb,cc,dc,W,ec,fc,gc=a=>{function b(d){if(d)return{operation:Ab[C[d>>2]],srcFactor:zb[C[d+4>>2]],dstFactor:zb[C[d+8>>2]]}}function c(d){return{compare:Cb[C[d>>2]],failOp:Mb[C[d+4>>2]],depthFailOp:Mb[C[d+8>>2]],passOp:Mb[C[d+12>>2]]}}var f={label:void 0,layout:xb(C[a+8>>2]),vertex:function(d){if(d){var g=W.get(C[d+4>>2]),k=vb(C[d+12>>2],C[d+16>>2]);var m=C[d+20>>2];var n=C[d+24>>2];if(m){for(var p=[],u=0;u<m;++u){var l=p,v=l.push;var q=n+24*u;if(q){var r=
C[q+8>>2];if(1===r)var y=null;else{y=4294967296*C[q+4>>2]+C[q>>2];r=Ub[r];var oa=C[q+12>>2];q=C[q+16>>2];for(var Fa=[],pa=0;pa<oa;++pa){var Gb=Fa,Ga=q+24*pa;Gb.push.call(Gb,{format:Tb[C[Ga>>2]],offset:4294967296*C[Ga+4+8>>2]+C[Ga+8>>2],shaderLocation:C[Ga+16>>2]})}y={arrayStride:y,stepMode:r,attributes:Fa}}}else y=void 0;v.call(l,y)}m=p}else m=void 0;g={module:g,constants:k,buffers:m};(d=C[d+8>>2])&&(g.entryPoint=d?F(A,d):"");return g}}(a+12),primitive:function(d){if(d){var g=C[d>>2];return{topology:Kb[C[d+
4>>2]],stripIndexFormat:Hb[C[d+8>>2]],frontFace:Fb[C[d+12>>2]],cullMode:Db[C[d+16>>2]],unclippedDepth:7===(g?C[g+4>>2]:0)&&!!C[g+8>>2]}}}(a+40),depthStencil:function(d){if(d)return{format:N[C[d+4>>2]],depthWriteEnabled:!!C[d+8>>2],depthCompare:Cb[C[d+12>>2]],stencilFront:c(d+16),stencilBack:c(d+32),stencilReadMask:C[d+48>>2],stencilWriteMask:C[d+52>>2],depthBias:B[d+56>>2],depthBiasSlopeScale:na[d+60>>2],depthBiasClamp:na[d+64>>2]}}(C[a+60>>2]),multisample:function(d){if(d)return{count:C[d+4>>2],
mask:C[d+8>>2],alphaToCoverageEnabled:!!C[d+12>>2]}}(a+64),fragment:function(d){if(d){for(var g=W.get(C[d+4>>2]),k=vb(C[d+12>>2],C[d+16>>2]),m=C[d+20>>2],n=C[d+24>>2],p=[],u=0;u<m;++u){var l=p,v=l.push,q=n+16*u,r=C[q+4>>2];if(0===r)q=void 0;else{r=N[r];var y=(y=C[q+8>>2])?{alpha:b(y+12),color:b(y+0)}:void 0;q={format:r,blend:y,writeMask:C[q+12>>2]}}v.call(l,q)}g={module:g,constants:k,targets:p};(d=C[d+8>>2])&&(g.entryPoint=d?F(A,d):"");return g}}(C[a+80>>2])};(a=C[a+4>>2])&&(f.label=a?F(A,a):"");
return f},hc=[0,"undefined"!=typeof document?document:0,"undefined"!=typeof window?window:0];
e.requestFullscreen=function(a,b){function c(){db=!1;var g=f.parentNode;(document.fullscreenElement||document.mozFullScreenElement||document.msFullscreenElement||document.webkitFullscreenElement||document.webkitCurrentFullScreenElement)===g?(f.exitFullscreen=lb,kb&&f.requestPointerLock(),db=!0,K?("undefined"!=typeof SDL&&(B[SDL.screen>>2]=C[SDL.screen>>2]|8388608),pb(e.canvas),ob()):pb(f)):(g.parentNode.insertBefore(f,g),g.parentNode.removeChild(g),K?("undefined"!=typeof SDL&&(B[SDL.screen>>2]=C[SDL.screen>>
2]&-8388609),pb(e.canvas),ob()):pb(f));e.onFullScreen?.(db);e.onFullscreen?.(db)}kb=a;K=b;"undefined"==typeof kb&&(kb=!0);"undefined"==typeof K&&(K=!1);var f=e.canvas;jb||(jb=!0,document.addEventListener("fullscreenchange",c,!1),document.addEventListener("mozfullscreenchange",c,!1),document.addEventListener("webkitfullscreenchange",c,!1),document.addEventListener("MSFullscreenChange",c,!1));var d=document.createElement("div");f.parentNode.insertBefore(d,f);d.appendChild(f);d.requestFullscreen=d.requestFullscreen||
d.mozRequestFullScreen||d.msRequestFullscreen||(d.webkitRequestFullscreen?()=>d.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT):null)||(d.webkitRequestFullScreen?()=>d.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT):null);d.requestFullscreen()};e.requestAnimationFrame=Qa;e.setCanvasSize=function(a,b,c){pb(e.canvas,a,b);c||ob()};e.pauseMainLoop=cb;e.resumeMainLoop=function(){H++;var a=Ja,b=Ka,c=La;La=null;Ya(c,0,!1,Ta,!0);Sa(a,b);G()};
e.getUserMedia=function(a){let b;(b=window).getUserMedia||(b.getUserMedia=navigator.getUserMedia||navigator.mozGetUserMedia);window.getUserMedia(a)};e.createContext=function(a,b,c,f){if(b&&e.ta&&a==e.canvas)return e.ta;var d;if(b){var g={antialias:!1,alpha:!1,Fa:1};if(f)for(var k in f)g[k]=f[k];if("undefined"!=typeof GL&&(d=GL.createContext(a,g)))var m=GL.getContext(d).za}else m=a.getContext("2d");if(!m)return null;c&&(e.ta=m,b&&GL.Ga(d),e.Ma=b,fb.forEach(n=>n()),gb());return m};
(()=>{function a(){this.oa={};this.wa=1;this.create=function(b,c={}){var f=this.wa++;c.ra=1;c.object=b;this.oa[f]=c;return f};this.get=function(b){if(b)return this.oa[b].object};this.qa=function(b){this.oa[b].ra++};this.release=function(b){var c=this.oa[b];c.ra--;0>=c.ra&&delete this.oa[b]}}O||(Vb=Vb||new a,Wb=Wb||new a,Xb=Xb||new a,O=O||new a,P=P||new a,Yb=Yb||new a,Q=Q||new a,R=R||new a,Zb=Zb||new a,$b=$b||new a,S=S||new a,ac=ac||new a,T=T||new a,U=U||new a,bc=bc||new a,V=V||new a,wb=wb||new a,
cc=cc||new a,dc=dc||new a,W=W||new a,ec=ec||new a,fc=fc||new a)})();
var kc={d:(a,b,c,f)=>{xa(`Assertion failed: ${a?F(A,a):""}, at: `+[b?b?F(A,b):"":"unknown filename",c,f?f?F(A,f):"":"unknown function"])},z:()=>{xa("")},O:(a,b,c)=>A.copyWithin(a,b,b+c),ea:()=>{cb();La=null},A:()=>{xa("OOM")},W:(a,b,c)=>{a=L(a);Ya(a,b,c)},v:a=>{z=a;$a(a)},G:(a,b,c,f)=>{for(var d=0,g=0;g<c;g++){var k=C[b>>2],m=C[b+4>>2];b+=8;for(var n=0;n<m;n++){var p=A[k+n],u=sb[a];0===p||10===p?((1===a?la:t)(F(u,0)),u.length=0):u.push(p)}d+=m}C[f>>2]=d;return 0},x:a=>Xb.release(a),y:(a,b,c,f)=>{a=
Xb.get(a);var d={};if(b){var g=C[b+8>>2];if(g){var k=C[b+12>>2];d.requiredFeatures=Array.from(B.subarray(k>>2,k+4*g>>2),l=>Eb[l])}if(g=C[b+16>>2]){var m=g+8,n={};function l(q,r){r=C[m+r>>2];4294967295!=r&&(n[q]=r)}function v(q,r){r=m+r;var y=C[r+4>>2];if(4294967295!=C[r>>2]||4294967295!=y)n[q]=4294967296*C[r+4>>2]+C[r>>2]}l("maxTextureDimension1D",0);l("maxTextureDimension2D",4);l("maxTextureDimension3D",8);l("maxTextureArrayLayers",12);l("maxBindGroups",16);l("maxBindGroupsPlusVertexBuffers",20);
l("maxDynamicUniformBuffersPerPipelineLayout",28);l("maxDynamicStorageBuffersPerPipelineLayout",32);l("maxSampledTexturesPerShaderStage",36);l("maxSamplersPerShaderStage",40);l("maxStorageBuffersPerShaderStage",44);l("maxStorageTexturesPerShaderStage",48);l("maxUniformBuffersPerShaderStage",52);l("minUniformBufferOffsetAlignment",72);l("minStorageBufferOffsetAlignment",76);v("maxUniformBufferBindingSize",56);v("maxStorageBufferBindingSize",64);l("maxVertexBuffers",80);l("maxBufferSize",88);l("maxVertexAttributes",
96);l("maxVertexBufferArrayStride",100);l("maxInterStageShaderComponents",104);l("maxInterStageShaderVariables",108);l("maxColorAttachments",112);l("maxColorAttachmentBytesPerSample",116);l("maxComputeWorkgroupStorageSize",120);l("maxComputeInvocationsPerWorkgroup",124);l("maxComputeWorkgroupSizeX",128);l("maxComputeWorkgroupSizeY",132);l("maxComputeWorkgroupSizeZ",136);l("maxComputeWorkgroupsPerDimension",140);d.requiredLimits=n}if(k=C[b+20>>2])g={},(k=C[k+4>>2])&&(g.label=k?F(A,k):""),d.defaultQueue=
g;var p=C[b+28>>2],u=C[b+32>>2];(k=C[b+4>>2])&&(d.label=k?F(A,k):"")}a.requestDevice(d).then(l=>{I(()=>{var v={xa:P.create(l.queue)};v=O.create(l,v);p&&l.lost.then(q=>{I(()=>{var r=p,y=yb[q.reason],oa=q.message,Fa=u,pa=X();oa=M(oa);L(r)(y,oa,Fa);Y(pa)})});L(c)(0,v,0,f)})},function(l){I(()=>{var v=X(),q=M(l.message);L(c)(1,0,q,f);Y(v)})})},ca:a=>V.qa(a),w:a=>V.release(a),da:a=>$b.release(a),ba:(a,b,c)=>{a=S.oa[a];0===c&&J();-1==c&&(c=void 0);try{var f=a.object.getMappedRange(b,c)}catch(g){return 0}var d=
ic(16,f.byteLength);A.set(new Uint8Array(f),d);a.pa.push(()=>jc(d));return d},m:(a,b,c)=>{a=S.oa[a];0===c&&J();-1==c&&(c=void 0);if(2!==a.ua)return 0;try{var f=a.object.getMappedRange(b,c)}catch(g){return 0}var d=ic(16,f.byteLength);A.fill(0,d,f.byteLength);a.pa.push(()=>{(new Uint8Array(f)).set(A.subarray(d,d+f.byteLength));jc(d)});return d},c:(a,b,c,f,d,g)=>{a=S.oa[a];a.ua=b;a.pa=[];a=a.object;-1==f&&(f=void 0);a.mapAsync(b,c,f).then(()=>{I(()=>{L(d)(0,g)})},()=>{I(()=>{L(d)(1,g)})})},b:a=>S.qa(a),
a:a=>S.release(a),s:a=>{a=S.oa[a];if(a.pa){for(var b=0;b<a.pa.length;++b)a.pa[b]();a.pa=void 0;a.object.unmap()}},l:a=>Yb.release(a),aa:(a,b)=>{var c=C[b>>2],f=void 0;0!==c&&(f=4294967296*C[c+12>>2]+C[c+8>>2]);var d=C[b+8>>2],g=C[b+12>>2];c=[];for(var k=0;k<d;++k){var m=c,n=m.push;var p=g+56*k;var u=C[p+4>>2];if(0!==u){var l=B[p+8>>2];-1==l&&(l=void 0);var v=C[p+16>>2],q=C[p+20>>2];var r=p+24;r={r:D[r>>3],g:D[r+8>>3],b:D[r+16>>3],a:D[r+24>>3]};p={view:U.get(u),depthSlice:l,resolveTarget:U.get(C[p+
12>>2]),clearValue:r,loadOp:Ib[v],storeOp:Ob[q]}}else p=void 0;n.call(m,p)}d=C[b+16>>2];d=0!==d?{view:U.get(C[d>>2]),depthClearValue:na[d+12>>2],depthLoadOp:Ib[C[d+4>>2]],depthStoreOp:Ob[C[d+8>>2]],depthReadOnly:!!C[d+16>>2],stencilClearValue:C[d+28>>2],stencilLoadOp:Ib[C[d+20>>2]],stencilStoreOp:Ob[C[d+24>>2]],stencilReadOnly:!!C[d+32>>2]}:void 0;g=bc.get(C[b+20>>2]);k=C[b+24>>2];k=0!==k?{querySet:bc.get(C[k>>2]),beginningOfPassWriteIndex:C[k+4>>2],endOfPassWriteIndex:C[k+8>>2]}:void 0;f={label:void 0,
colorAttachments:c,depthStencilAttachment:d,occlusionQuerySet:g,timestampWrites:k,maxDrawCount:f};(b=C[b+4>>2])&&(f.label=b?F(A,b):"");a=Q.get(a);return R.create(a.beginRenderPass(f))},B:function(a,b,c,f,d,g,k,m,n){c=f+2097152>>>0<4194305-!!c?(c>>>0)+4294967296*f:NaN;g=k+2097152>>>0<4194305-!!g?(g>>>0)+4294967296*k:NaN;m=n+2097152>>>0<4194305-!!m?(m>>>0)+4294967296*n:NaN;a=Q.get(a);b=S.get(b);d=S.get(d);a.copyBufferToBuffer(b,c,d,g,m)},$:(a,b,c,f)=>{a=Q.get(a);f=ub(f);var d=a.copyTextureToBuffer,
g=T.get(C[b+4>>2]),k=b+12;b={texture:g,mipLevel:C[b+8>>2],origin:{x:C[k>>2],y:C[k+4>>2],z:C[k+8>>2]},aspect:Pb[C[b+24>>2]]};g=c+8;k=C[g+16>>2];var m=C[g+20>>2];g={offset:4294967296*C[g+4+8>>2]+C[g+8>>2],bytesPerRow:4294967295===k?void 0:k,rowsPerImage:4294967295===m?void 0:m};g.buffer=S.get(C[c+32>>2]);d.call(a,b,g,f)},k:a=>{a=Q.get(a);return Yb.create(a.finish())},j:a=>Q.release(a),_:(a,b)=>{for(var c=V.get(C[b+8>>2]),f=C[b+12>>2],d=C[b+16>>2],g=[],k=0;k<f;++k){var m=g,n=m.push;var p=d+40*k;var u=
C[p+8>>2],l=C[p+32>>2],v=C[p+36>>2],q=C[p+4>>2];u?(l=p+24,l=C[l>>2]+4294967296*B[l+4>>2],-1==l&&(l=void 0),p={binding:q,resource:{buffer:S.get(u),offset:4294967296*C[p+4+16>>2]+C[p+16>>2],size:l}}):p=l?{binding:q,resource:ac.get(l)}:{binding:q,resource:U.get(v)};n.call(m,p)}c={label:void 0,layout:c,entries:g};(b=C[b+4>>2])&&(c.label=b?F(A,b):"");a=O.get(a);return $b.create(a.createBindGroup(c))},Z:(a,b)=>{for(var c=C[b+8>>2],f=C[b+12>>2],d=[],g=0;g<c;++g){var k=d,m=k.push,n=f+80*g,p=C[n+4>>2],u=C[n+
8>>2];var l=n+16;var v=C[l+4>>2];l=v?{type:Bb[v],hasDynamicOffset:!!C[l+8>>2],minBindingSize:4294967296*C[l+4+16>>2]+C[l+16>>2]}:void 0;v=(v=C[n+40+4>>2])?{type:Lb[v]}:void 0;var q=n+48;var r=C[q+4>>2];q=r?{sampleType:Rb[r],viewDimension:Sb[C[q+8>>2]],multisampled:!!C[q+12>>2]}:void 0;n+=64;n=(r=C[n+4>>2])?{access:Nb[r],format:N[C[n+8>>2]],viewDimension:Sb[C[n+12>>2]]}:void 0;m.call(k,{binding:p,visibility:u,buffer:l,sampler:v,texture:q,storageTexture:n})}c={entries:d};(b=C[b+4>>2])&&(c.label=b?F(A,
b):"");a=O.get(a);return V.create(a.createBindGroupLayout(c))},f:(a,b)=>{var c=!!C[b+24>>2],f={label:void 0,usage:C[b+8>>2],size:4294967296*C[b+4+16>>2]+C[b+16>>2],mappedAtCreation:c};(b=C[b+4>>2])&&(f.label=b?F(A,b):"");b=O.get(a);a={};f=S.create(b.createBuffer(f),a);c&&(a.ua=2,a.pa=[]);return f},i:(a,b)=>{if(b){var c={label:void 0};(b=C[b+4>>2])&&(c.label=b?F(A,b):"")}a=O.get(a);return Q.create(a.createCommandEncoder(c))},Y:(a,b)=>{for(var c=C[b+8>>2],f=C[b+12>>2],d=[],g=0;g<c;++g)d.push(V.get(C[f+
4*g>>2]));c={label:void 0,bindGroupLayouts:d};(b=C[b+4>>2])&&(c.label=b?F(A,b):"");a=O.get(a);return wb.create(a.createPipelineLayout(c))},X:(a,b)=>{b=gc(b);a=O.get(a);return cc.create(a.createRenderPipeline(b))},V:(a,b)=>{var c=C[b>>2],f=C[c+4>>2],d={label:void 0,code:""};(b=C[b+4>>2])&&(d.label=b?F(A,b):"");switch(f){case 5:f=C[c+12>>2]>>2;d.code=C.subarray(f,f+C[c+8>>2]);break;case 6:(c=C[c+8>>2])&&(d.code=c?F(A,c):"")}a=O.get(a);return W.create(a.createShaderModule(d))},U:(a,b,c)=>{a=O.get(a);
b=Vb.get(b);var f=[C[c+16>>2],C[c+20>>2]];0!==f[0]&&(b.canvas.width=f[0]);0!==f[1]&&(b.canvas.height=f[1]);b.configure({device:a,format:N[C[c+12>>2]],usage:C[c+8>>2],alphaMode:"opaque"});return Wb.create(b)},r:(a,b)=>{var c={label:void 0,size:ub(b+16),mipLevelCount:C[b+32>>2],sampleCount:C[b+36>>2],dimension:Qb[C[b+12>>2]],format:N[C[b+28>>2]],usage:C[b+8>>2]},f=C[b+4>>2];f&&(c.label=f?F(A,f):"");if(f=C[b+40>>2])b=C[b+44>>2],c.viewFormats=Array.from(B.subarray(b>>2,b+4*f>>2),function(d){return N[d]});
a=O.get(a);return T.create(a.createTexture(c))},T:a=>{a=O.oa[a].xa;P.qa(a);return a},u:a=>O.qa(a),q:a=>O.release(a),S:(a,b,c)=>{O.get(a).onuncapturederror=function(f){I(()=>{var d;f.error instanceof GPUValidationError?d=1:f.error instanceof GPUOutOfMemoryError&&(d=2);var g=f.error.message,k=X();g=M(g);L(b)(d,g,c);Y(k)})}},R:(a,b)=>{a=C[C[b>>2]+8>>2];a=2<a?a?F(A,a):"":a;a=(hc[a]||("undefined"!=typeof document?document.querySelector(a):void 0)).getContext("webgpu");if(!a)return 0;if(b=C[b+4>>2])a.Ka=
b?F(A,b):"";return Vb.create(a)},Q:(a,b,c,f)=>{var d;b&&(d={powerPreference:Jb[C[b+8>>2]],forceFallbackAdapter:!!C[b+16>>2]});"gpu"in navigator?navigator.gpu.requestAdapter(d).then(g=>{I(()=>{if(g){var k=Xb.create(g);L(c)(0,k,0,f)}else{k=X();var m=M("WebGPU not available on this system (requestAdapter returned null)");L(c)(1,0,m,f);Y(k)}})},g=>{I(()=>{var k=X(),m=M(g.message);L(c)(2,0,m,f);Y(k)})}):(a=X(),b=M("WebGPU not available on this browser (navigator.gpu is not available)"),L(c)(1,0,b,f),Y(a))},
P:a=>wb.release(a),N:a=>bc.release(a),M:a=>P.release(a),h:(a,b,c)=>{a=P.get(a);b=Array.from(B.subarray(c>>2,c+4*b>>2),f=>Yb.get(f));a.submit(b)},L:(a,b,c,f,d)=>{R.get(a).draw(b,c,f,d)},K:a=>{R.get(a).end()},I:a=>R.release(a),J:(a,b)=>{a=R.get(a);b=cc.get(b);a.setPipeline(b)},H:a=>cc.release(a),t:a=>W.qa(a),p:a=>W.release(a),F:a=>Vb.release(a),E:a=>{a=Wb.get(a);return U.create(a.getCurrentTexture().createView())},D:a=>Wb.release(a),o:(a,b)=>{if(b){var c=C[b+20>>2];var f=C[b+28>>2];c={format:N[C[b+
8>>2]],dimension:Sb[C[b+12>>2]],baseMipLevel:C[b+16>>2],mipLevelCount:4294967295===c?void 0:c,baseArrayLayer:C[b+24>>2],arrayLayerCount:4294967295===f?void 0:f,aspect:Pb[C[b+32>>2]]};(b=C[b+4>>2])&&(c.label=b?F(A,b):"")}a=T.get(a);return U.create(a.createView(c))},C:a=>T.qa(a),g:a=>T.release(a),n:a=>U.qa(a),e:a=>U.release(a)},Z=function(){function a(c){Z=c.exports;ma=Z.fa;c=ma.buffer;e.HEAP8=new Int8Array(c);e.HEAP16=new Int16Array(c);e.HEAPU8=A=new Uint8Array(c);e.HEAPU16=new Uint16Array(c);e.HEAP32=
B=new Int32Array(c);e.HEAPU32=C=new Uint32Array(c);e.HEAPF32=na=new Float32Array(c);e.HEAPF64=D=new Float64Array(c);rb=Z.ia;ra.unshift(Z.ga);E--;e.monitorRunDependencies?.(E);0==E&&(null!==va&&(clearInterval(va),va=null),wa&&(c=wa,wa=null,c()));return Z}var b={a:kc};E++;e.monitorRunDependencies?.(E);if(e.instantiateWasm)try{return e.instantiateWasm(b,a)}catch(c){return t(`Module.instantiateWasm callback failed with error: ${c}`),!1}za||=ya("hello.wasm")?"hello.wasm":e.locateFile?e.locateFile("hello.wasm",
h):h+"hello.wasm";Da(b,function(c){a(c.instance)});return{}}(),lc=e._main=(a,b)=>(lc=e._main=Z.ha)(a,b),jc=a=>(jc=Z.ja)(a),ic=(a,b)=>(ic=Z.ka)(a,b),Y=a=>(Y=Z.la)(a),tb=a=>(tb=Z.ma)(a),X=()=>(X=Z.na)(),mc;wa=function nc(){mc||oc();mc||(wa=nc)};
function oc(){function a(){if(!mc&&(mc=!0,e.calledRun=!0,!x)){Ea(ra);Ea(sa);e.onRuntimeInitialized?.();if(pc){var b=lc;try{var c=b(0,0);z=c;$a(c)}catch(f){Za(f)}}if(e.postRun)for("function"==typeof e.postRun&&(e.postRun=[e.postRun]);e.postRun.length;)b=e.postRun.shift(),ta.unshift(b);Ea(ta)}}if(!(0<E)){if(e.preRun)for("function"==typeof e.preRun&&(e.preRun=[e.preRun]);e.preRun.length;)ua();Ea(qa);0<E||(e.setStatus?(e.setStatus("Running..."),setTimeout(function(){setTimeout(function(){e.setStatus("")},
1);a()},1)):a())}}if(e.preInit)for("function"==typeof e.preInit&&(e.preInit=[e.preInit]);0<e.preInit.length;)e.preInit.pop()();var pc=!0;e.noInitialRun&&(pc=!1);oc();
