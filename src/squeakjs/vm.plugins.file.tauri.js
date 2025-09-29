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

Object.extend(Squeak.Primitives.prototype,
'FilePlugin', {
    XprimitiveDirectoryCreate: function(argCount) {
        var dirNameObj = this.stackNonInteger(0);
        if (!this.success) return false;
        var dirName = this.filenameFromSqueak(dirNameObj.bytesAsString());
        this.success = Squeak.dirCreate(dirName);
        if (!this.success) {
            var path = Squeak.splitFilePath(dirName);
            if (Squeak.debugFiles) console.warn("Directory not created: " + path.fullname);
        }
        return this.popNIfOK(argCount);
    },
    XprimitiveDirectoryDelete: function(argCount) {
        var dirNameObj = this.stackNonInteger(0);
        if (!this.success) return false;
        var dirName = this.filenameFromSqueak(dirNameObj.bytesAsString());
        this.success = Squeak.dirDelete(dirName);
        return this.popNIfOK(argCount);
    },
    primitiveDirectoryDelimitor: function(argCount) {
        var delimitor = '/';
        return this.popNandPushIfOK(1, this.charFromInt(delimitor.charCodeAt(0)));
    },
    XprimitiveDirectoryEntry: function(argCount) {
        var dirNameObj = this.stackNonInteger(1),
            fileNameObj = this.stackNonInteger(0);
        if (!this.success) return false;
        var sqFileName = fileNameObj.bytesAsString();
        var fileName = this.filenameFromSqueak(sqFileName);
        var sqDirName = dirNameObj.bytesAsString();
        var dirName = this.filenameFromSqueak(sqDirName);
        var entries = Squeak.dirList(dirName, true);
        if (!entries) {
            var path = Squeak.splitFilePath(dirName);
            if (Squeak.debugFiles) console.log("Directory not found: " + path.fullname);
            return false;
        }
        var entry = fileName === "." ? [".", 0, 0, true, 0] // current directory
            : fileName === ".." ? ["..", 0, 0, true, 0] // parent directory
            : fileName === "/" && dirName === "/" ? [sqFileName, 0, 0, true, 0] // fake top-level dir
            : entries[fileName];
        this.popNandPushIfOK(argCount+1, this.makeStObject(entry));  // entry or nil
        return true;
    },
    primitiveDirectoryLookup: function(argCount) {
        var index = this.stackInteger(0),
            dirNameObj = this.stackNonInteger(1);
        if (!this.success) return false;
        var sqDirName = dirNameObj.bytesAsString();
        var dirName = this.filenameFromSqueak(sqDirName);
        // if (Squeak.debugFiles) console.log("primitiveDirectoryLookup", dirName, index);
        var force = index === 1;
        // cache directory contents and get entry
        if (!window.SqueakDirs) window.SqueakDirs = {};
        var entries = SqueakDirs[dirName];
        // if not cached or if forced, use async prim to fetch directory
        if (!entries || force) {
            return this.asyncDirectoryLookup(index, dirName, argCount);
        }
        var entry = entries[index - 1]; // undefined if past end
        // if (Squeak.debugFiles) console.log("primitiveDirectoryLookup result", index, entry);
        this.popNandPushIfOK(argCount+1, this.makeStObject(entry));  // entry or nil
        return true;
    },
    asyncDirectoryLookup: async function(index, dirName, argCount) {
        try {
            var entries = await Squeak.dirGet(dirName); // prim fails if this throws
            SqueakDirs[dirName] = entries; // cache it
            var entry = entries[index - 1]; // undefined if past end
            // if (Squeak.debugFiles) console.log("primitiveDirectoryLookup result", index, entry);
            this.popNandPushIfOK(argCount+1, this.makeStObject(entry));  // entry or nil
            return true;
        } catch (e) {
            if (Squeak.debugFiles) console.warn("Error in primitiveDirectoryLookup:", e);
            return false;
        }
    },
    primitiveDirectorySetMacTypeAndCreator: function(argCount) {
        return this.popNIfOK(argCount);
    },
    XprimitiveFileAtEnd: function(argCount) {
        var handle = this.stackNonInteger(0);
        if (!this.success || !handle.file) return false;
        this.popNandPushIfOK(argCount+1, this.makeStObject(handle.filePos >= handle.file.size));
        return true;
    },
    primitiveFileClose: async function(argCount) {
        var handle = this.stackNonInteger(0);
        if (!this.success || !handle.file) return false;
        if (Squeak.debugFiles) console.log("primitiveFileClose", handle.file.name || handle.file);
        try {
            if (typeof handle.file === "string") {
                 this.fileConsoleFlush(handle.file);
            } else {
                await this.fileClose(handle.file);
                handle.file = null;
            }
        } catch (e) {
            if (Squeak.debugFiles) console.warn("Error in primitiveFileClose:", e);
            return false;
        }
        return this.popNIfOK(argCount);
    },
    XprimitiveFileDelete: function(argCount) {
        var fileNameObj = this.stackNonInteger(0);
        if (!this.success) return false;
        var fileName = this.filenameFromSqueak(fileNameObj.bytesAsString());
        this.success = Squeak.fileDelete(fileName);
        return this.popNIfOK(argCount);
    },
    XprimitiveFileFlush: function(argCount) {
        var handle = this.stackNonInteger(0);
        if (!this.success || !handle.file) return false;
        if (typeof handle.file === "string") {
             this.fileConsoleFlush(handle.file);
        } else {
            Squeak.flushFile(handle.file);
            this.vm.breakOut();     // return to JS asap so async file handler can run
        }
        return this.popNIfOK(argCount);
    },
    XprimitiveFileGetPosition: function(argCount) {
        debugger
        var handle = this.stackNonInteger(0);
        if (!this.success || !handle.file) return false;
        this.popNandPushIfOK(argCount + 1, this.makeLargeIfNeeded(handle.filePos));
        return true;
    },
    makeFileHandle: function(filename, file, writeFlag) {
        var handle = this.makeStString("squeakjs:" + filename);
        handle.file = file;             // shared between handles
        handle.fileWrite = writeFlag;   // specific to this handle
        handle.filePos = 0;             // specific to this handle
        return handle;
    },
    primitiveFileOpen: async function(argCount) {
        var writeFlag = this.stackBoolean(0),
            fileNameObj = this.stackNonInteger(1);
        if (!this.success) return false;
        try {
            var fileName = this.filenameFromSqueak(fileNameObj.bytesAsString());
            if (Squeak.debugFiles) console.log("primitiveFileOpen", fileName, writeFlag);
            var file = await this.fileOpen(fileName, writeFlag);
            if (!file) return false;
            var handle = this.makeFileHandle(file.name, file, writeFlag);
            this.popNandPushIfOK(argCount+1, handle);
            return true;
        } catch (e) {
            if (Squeak.debugFiles) console.warn("Error in primitiveFileOpen:", e);
            return false;
        }
    },
    primitiveFileRead: function(argCount) {
        var count = this.stackInteger(0),
            startIndex = this.stackInteger(1) - 1, // make zero based
            arrayObj = this.stackNonInteger(2),
            handle = this.stackNonInteger(3);
        if (!this.success || !arrayObj.isWordsOrBytes() || !handle.file) return false;
        if (!count) return this.popNandPushIfOK(argCount+1, 0);
        var array = arrayObj.bytes;
        if (!array) {
            array = arrayObj.wordsAsUint8Array();
            startIndex *= 4;
            count *= 4;
        }
        if (startIndex < 0 || startIndex + count > array.length)
            return false;
        if (typeof handle.file === "string") {
            //this.fileConsoleRead(handle.file, array, startIndex, count);
            this.popNandPushIfOK(argCount+1, 0);
            return true;
        }
        if (!handle.file.contents)
            return this.popNandPushIfOK(argCount+1, 0);
        var srcArray = handle.file.contents,
            dstArray = array;
        count = Math.min(count, handle.file.size - handle.filePos);
        for (var i = 0; i < count; i++)
            dstArray[startIndex + i] = srcArray[handle.filePos++];
        if (!arrayObj.bytes) count >>= 2;  // words
        this.popNandPushIfOK(argCount+1, Math.max(0, count));
        // if (Squeak.debugFiles) console.log("primitiveFileRead", count, "bytes at", handle.filePos);
        return true;
    },
    XprimitiveFileRename: function(argCount) {
        var oldNameObj = this.stackNonInteger(1),
            newNameObj = this.stackNonInteger(0);
        if (!this.success) return false;
        var oldName = this.filenameFromSqueak(oldNameObj.bytesAsString()),
            newName = this.filenameFromSqueak(newNameObj.bytesAsString());
        this.success = Squeak.fileRename(oldName, newName);
        this.vm.breakOut();     // return to JS asap so async file handler can run
        return this.popNIfOK(argCount);
    },
    primitiveFileSetPosition: function(argCount) {
        var pos = this.stackPos32BitInt(0),
            handle = this.stackNonInteger(1);
        if (!this.success || !handle.file) return false;
        handle.filePos = pos;
        return this.popNIfOK(argCount);
    },
    XprimitiveFileSize: function(argCount) {
        var handle = this.stackNonInteger(0);
        if (!this.success || !handle.file) return false;
        this.popNandPushIfOK(argCount+1, this.makeLargeIfNeeded(handle.file.size));
        return true;
    },
    XprimitiveFileStdioHandles: function(argCount) {
        var handles = [
            null, // stdin
            this.makeFileHandle('console.log', 'log', true),
            this.makeFileHandle('console.error', 'error', true),
        ];
        this.popNandPushIfOK(argCount + 1, this.makeStArray(handles));
        return true;
    },
    XprimitiveFileTruncate: function(argCount) {
        var pos = this.stackPos32BitInt(0),
            handle = this.stackNonInteger(1);
        if (!this.success || !handle.file || !handle.fileWrite) return false;
        if (handle.file.size > pos) {
            handle.file.size = pos;
            handle.file.modified = true;
            if (handle.filePos > handle.file.size) handle.filePos = handle.file.size;
        }
        return this.popNIfOK(argCount);
    },
    primitiveDisableFileAccess: function(argCount) {
        return this.fakePrimitive("FilePlugin.primitiveDisableFileAccess", 0, argCount);
    },
    XprimitiveFileWrite: function(argCount) {
        debugger
        var count = this.stackInteger(0),
            startIndex = this.stackInteger(1) - 1, // make zero based
            arrayObj = this.stackNonInteger(2),
            handle = this.stackNonInteger(3);
        if (!this.success || !handle.file || !handle.fileWrite) return false;
        if (!count) return this.popNandPushIfOK(argCount+1, 0);
        var array = arrayObj.bytes;
        if (!array) {
            array = arrayObj.wordsAsUint8Array();
            startIndex *= 4;
            count *= 4;
        }
        if (!array) return false;
        if (startIndex < 0 || startIndex + count > array.length)
            return false;
        if (typeof handle.file === "string") {
            this.fileConsoleWrite(handle.file, array, startIndex, count);
            this.popNandPushIfOK(argCount+1, count);
            return true;
        }
        return this.fileContentsDo(handle.file, function(file) {
            var srcArray = array,
                dstArray = file.contents || [];
            if (handle.filePos + count > dstArray.length) {
                var newSize = dstArray.length === 0 ? handle.filePos + count :
                    Math.max(handle.filePos + count, dstArray.length + 10000);
                file.contents = new Uint8Array(newSize);
                file.contents.set(dstArray);
                dstArray = file.contents;
            }
            for (var i = 0; i < count; i++)
                dstArray[handle.filePos++] = srcArray[startIndex + i];
            if (handle.filePos > file.size) file.size = handle.filePos;
            file.modified = true;
            if (!arrayObj.bytes) count >>= 2;  // words
            this.popNandPushIfOK(argCount+1, count);
        }.bind(this));
    },
    fileOpen: async function(filename, writeFlag) {
        // if a file is opened for read and write at the same time,
        // they must share the contents. That's why all open files
        // are held in the ref-counted global SqueakFiles
        if (typeof SqueakFiles == 'undefined')
            window.SqueakFiles = {};
        var entry = null;
        try {
            entry = await __TAURI__.fs.stat(filename);
            if (!entry.isFile) {
                if (Squeak.debugFiles) console.log("Not a file: " + filename);
                return null;
            }
        } catch (err) {
            if (Squeak.debugFiles) console.warn("fileOpen stat error", filename, err);
            entry = null;
        }
        var contents = null;
        if (entry) {
            // if it is open already, return it
            var file = SqueakFiles[filename];
            if (file) {
                ++file.refCount;
                return file;
            }
            try {
                contents = await __TAURI__.fs.readFile(filename);
            } catch (err) {
                if (Squeak.debugFiles) console.warn("fileOpen read error", filename, err);
                return null;
            }
        } else {
            if (!writeFlag) {
                if (Squeak.debugFiles) console.log("File not found: " + filename);
                return null;
            }
            contents = new Uint8Array();
            try {
                await __TAURI__.fs.writeFile(filename, contents);
            } catch (err) {
                if (Squeak.debugFiles) console.log("Cannot create file: " + filename, err);
                return null;
            }
        }
        // make the file object
        var file = {
            name: filename,
            size: contents.length,
            contents: contents,
            modified: false,
            refCount: 1
        };
        SqueakFiles[file.name] = file;
        return file;
    },
    fileClose: async function(file) {
        try {
            await Squeak.flushFile(file);
        } catch (e) {
            if (Squeak.debugFiles) console.warn("Error in fileClose:", e);
        }
        if (--file.refCount == 0)
            delete SqueakFiles[file.name];
    },
    fileConsoleBuffer: {
        log: '',
        error: ''
    },
    fileConsoleWrite: function(logOrError, array, startIndex, count) {
        // buffer until there is a newline
        var bytes = array.subarray(startIndex, startIndex + count),
            buffer = this.fileConsoleBuffer[logOrError] + Squeak.bytesAsString(bytes),
            lines = buffer.match('([^]*)\n(.*)');
        if (lines) {
            console[logOrError](lines[1]);  // up to last newline
            buffer = lines[2];              // after last newline
        }
        this.fileConsoleBuffer[logOrError] = buffer;
    },
    fileConsoleFlush: function(logOrError) {
        var buffer = this.fileConsoleBuffer[logOrError];
        if (buffer) {
            console[logOrError](buffer);
            this.fileConsoleBuffer[logOrError] = '';
        }
    },
});
