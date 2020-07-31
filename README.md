## Native build:

```sh
./setup.sh
mkdir -p out/native
cd out/native
cmake ../..
make clean all
```

## Web build:

**Note:** The active emsdk must include commit #11737, #11779, and #11782!
If it doesn't, you can delete its copy of Emscripten and git clone the correct
one. Right now these patches haven't all landed, so you can use:
https://github.com/kainino0x/emscripten/tree/with_11779_and_11782

```sh
pushd path/to/emsdk
source emsdk_env.sh
popd
mkdir -p out/web
cd out/web
emcmake cmake ../..
make clean all
```
