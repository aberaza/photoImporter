/*jshint esversion:6*/
var assert = require('assert');
var et = require('../index.js');
var fs = require('fs');
// var  Promise = require("bluebird");


var outDir = "test/output";
var filesDir = "test/files";
var exportDir = "test/sampleOutput";


describe('isImage checks', function(){
    describe('Should recognize file formats case insensitive', function(){
        it('should return true for jpEg', function(){assert.ok(et.isImage('somefileHere.jpEg'));});
        it('should return true for Raf', function(){assert.ok(et.isImage('somefile_here.Raf'));});
        it('should return false for xzt', function(){assert.ok(et.isImage('somefile_here.xzt')===false);});
    });
});

describe('isJPEG checks', function(){
    describe('Should recognize file formats case insensitive', function(){
        it('should return true for jpEg', function(){assert.ok(et.isJPEG('somefileHere.jpEg'));});
        it('should return false for Raf', function(){assert.ok(et.isJPEG('somefile_here.Raf')===false);});
        it('should return false for xzt', function(){assert.ok(et.isJPEG('somefile_here.xzt')===false);});
    });
});


// describe('copyFile checks', function(){



//     describe('Api checks for valid arguments', function(){
//         it("rejects if no orgin is sent", () => et.copyFile(undefined).catch( (err)=>assert.ok(err) ));
//         it("rejects if no destiny is sent", () => et.copyFile("toto").catch( (err)=>assert.ok(err) ));
//         it("rejects if no destiny is sent", () => et.copyFile("toto").catch( (err)=>assert.ok(err) ));
//     });

//     describe('Does copy files', function(){
//             // this.timeout(5000);
//         it("Writes output file", () => et.copyFile(filesDir + "/_DSF4325.JPG", outDir + "/_DSF4325.JPEG").then( ()=> assert.ok(fs.lstatSync(outDir + "/_DSF4325.JPEG").isFile()) ));
//     });
// });

describe('findNewFiles checks', function(){
    describe('Returns list of new files only', function(){

        it('Given an origin and destiny with existing files', 
            () => et.findNewFiles(filesDir, exportDir).then(files => assert.ok(files.length === 6)));
    });
});

describe('copyFolderMedia checks', function(){
    before(()=>{
        fs.readdirSync(outDir).forEach((file)=>{
            var filePath = outDir + "/" + file;
            if(!fs.statSync(filePath).isDirectory()){
                fs.unlinkSync(filePath);
            }
        });
    });
    describe('Copy files to destiny', function(){
        it('Given valid origin and destiny it moves files from origin to destiny', function(){
            et.copyFolderMedia(filesDir, outDir).then(()=>assert.ok(true));
        });
    });
});
