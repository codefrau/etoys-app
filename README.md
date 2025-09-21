# Etoys App

This is a native [Tauri](https://tauri.app) app that runs Squeak Etoys using the [SqueakJS](https://squeak.js.org) virtual machine.

_Squeak Etoys_ is an authoring environment for "children of all ages" created by Alan Kay's research group around 1999.

It is implemented in an older 32 bit version of [Squeak Smalltalk](https://squeak.org), which doesn't work anymore on some platforms (like macOS); hence the motivation for this app.

## Prerequisites

You need Node.js, Rust, and a WebView library. See
https://v2.tauri.app/start/prerequisites/ for installation instructions.

## To Try it

This runs the Tauri development server with hot reload enabled:

    npm run tauri dev

## To Build the App

This has only been tested on macOS so far. Please report back if you try it on other platforms.

    npm run tauri build -- --bundles app

## To Do

* implement native file access via Tauri
* test on all platforms
* publish app