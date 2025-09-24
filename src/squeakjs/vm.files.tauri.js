"use strict";
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

Object.extend(Squeak,
"files", {
    splitFilePath: function(filepath) {
        if (filepath[0] !== '/') filepath = '/' + filepath;
        filepath = filepath.replace(/\/\//g, '/');      // replace double-slashes
        var matches = filepath.match(/(.*)\/(.*)/),
            dirname = matches[1] ? matches[1] : '/',
            basename = matches[2] ? matches[2] : null;
        return {fullname: filepath, dirname: dirname, basename: basename};
    },
    splitUrl: function(url, base) {
        var matches = url.match(/(.*\/)?(.*)/),
            uptoslash = matches[1] || '',
            filename = matches[2] || '';
        if (!uptoslash.match(/^[a-z]+:\/\//)) {
            if (base && !base.match(/\/$/)) base += '/';
            uptoslash = (base || '') + uptoslash;
            url = uptoslash + filename;
        }
        return {full: url, uptoslash: uptoslash, filename: filename};
    },
    dirCreate: async function(dirpath, withParents) {
        if (Squeak.debugFiles) console.log("dirCreate", dirpath, withParents);
        await __TAURI__.fs.mkdir(dirpath, { recursive: withParents });
        return true;
    },
    fileGet: function(filepath, thenDo, errorDo) {
        if (!errorDo) errorDo = function(err) { console.log(err) };
        if (Squeak.debugFiles) console.log("fileGet", filepath);
        __TAURI__.fs.readFile(filepath).then(function(data) {
            if (Squeak.debugFiles) console.log("fileGet ok", filepath, data.length);
            thenDo(data.buffer);
        }).catch(function(err) {
            if (Squeak.debugFiles) console.log("fileGet error", filepath, err);
            errorDo(err);
        });
    }
});
