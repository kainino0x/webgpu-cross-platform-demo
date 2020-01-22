Setup:

```sh
git submodule update --init
./setup.sh
```

Native build:

```sh
mkdir -p out/native
cd out/native
cmake ../..
make clean all
```

Web build:

```sh
pushd path/to/emsdk
source emsdk_env.sh  # The active emsdk must point to the emscripten/ in this repo! (for now)
popd
mkdir -p out/web
cd out/web
emcmake cmake ../..
make clean all
```
