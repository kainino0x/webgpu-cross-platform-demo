## Setup:

```sh
git submodule update --init
./setup.sh
```

## Native build:

```sh
mkdir -p out/native
cd out/native
cmake ../..
make clean all
```

## Web build:

**Note:** The active emsdk must include commit #11737, #11779, and #11782!
If it doesn't, you can delete its copy of Emscripten and symlink it to the
`emscripten/` subrepo of this repository.

```sh
pushd path/to/emsdk
source emsdk_env.sh
popd
mkdir -p out/web
cd out/web
emcmake cmake ../..
make clean all
```
