/*
 * Copyright (c) 2013-2025 Vanessa Freudenberg
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import "./squeakjs/squeak_tauri.js";

const sqCanvas = document.getElementById("sqCanvas");
const sqSpinner = document.getElementById("sqSpinner");

async function run() {
    Squeak.debugFiles = true;

    // on macOS this is in ~/Library/Application Support/<app-id>/
    const appDataDir = await __TAURI__.path.appDataDir()

    // on macOS this is the .app bundle's Resources directory
    const resourceDir = await __TAURI__.path.resourceDir()
    const imagePath = await  __TAURI__.path.join(resourceDir, "Etoys", "etoys.image");

    SqueakJS.runSqueak(imagePath, sqCanvas, {
        appName: "Etoys",
        fixedWidth: 1200,
        fixedHeight: 900,
        spinner: sqSpinner,
        root: appDataDir,
        onStart: function(vm, display, options) {
            // debugger
            // vm.breakOn("Latin1Environment class>>systemConverterClass");
        },
    });
};

window.onload = run;
