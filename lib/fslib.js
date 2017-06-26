/*jshint esversion:6*/
var fs = require("fs");
var Promise = require("bluebird");

// var fastExif = require("fast-exif");
var pbar = require("cli-progress");

// convert fs methods to promises
// Promise.promisifyAll(fs); 

// Promisified methods
const fsp = {
    readdir : Promise.promisify(fs.readdir),
    stat : Promise.promisify(fs.stat)
};

//EXIF CANDIDATES

const JPEG_EXTENSIONS = ["jpeg", "jpg","jif","jfif","jp2","jpx","j2k","j2c"];
const RAW_EXTENSIONS = ["tiff","tif","3fr","ari","arw","bay","crw","cr2","cap","data","dcs","dcr","dng","drf","eip","erf","fff","gpr","iiq","k25","kdc","mdc","mef","mos","mrw","nef","nrw","obm","orf","pef","ptx","pxn","rwd","raf","raw","rwl","rw2","rwz","sr2","srf","srw","tif","x3f"];
const IMAGE_EXTENSIONS = JPEG_EXTENSIONS.concat(RAW_EXTENSIONS);


function isImage(filename){ 
    var ext = filename.split(".").pop().toLowerCase();
    return IMAGE_EXTENSIONS.indexOf(ext) > -1;
}

function isJPEG(filename){
    var ext = filename.split(".").pop().toLowerCase();
    return JPEG_EXTENSIONS.indexOf(ext) > -1;
}

function cleanAndFlatten(list){
    return list.reduce((acum, val) => {
        if(val){
            return acum.concat(Array.isArray(val)? cleanAndFlatten(val) : val );
        }
        return acum;
    }, []);
}

function getFileList(folder){

    var recurseFolders = function(file){
        var filePath = folder + "/" + file;
        return fsp.stat(filePath)
            .then((stat) => stat.isFile()? filePath : (stat.isDirectory()? getFileList(filePath) : undefined))
            .catch((err) => console.warn("WARNING: Could not read file %s . ", filePath, err));
    };


    return fsp.readdir(folder)
        .mapSeries(recurseFolders)
        .then(cleanAndFlatten);
}

function getNewFiles(media, existing){
    return Promise.all([getFileList(media), getFileList(existing)])
                .then((lists) => {
                    var existingFiles = lists[1].map(file => file.split("/").pop());
                    var newFiles = lists[0].filter(file => existingFiles.indexOf( file.split("/").pop()) === -1);
                    if(newFiles.length === 0){
                        throw "No new files detected";
                    }
                    return newFiles;
                });
}

function copyFolder(origin, destiny){
    // var TOTAL_FILES = 0;
    var FILES_COPIED = [];
    var FILES_FAILED = [];


    var bar = new pbar.Bar({
        format : "Copy files ({value}/{total} [{bar}] {percentage}% | ETA: {eta}s | Time: {duration}s",
        stopOnComplete : true,
    });
    
    const moveFile = function(file){
        return copyFile(file, destiny + "/" + file.split("/").pop())
            .tap(file =>  { FILES_COPIED.push(file);bar.increment();})
            .tapCatch(file => { FILES_FAILED.push(file);bar.increment();});
    };

    return getNewFiles(origin, destiny)
        .tap(files=> bar.start(files.length, 0))
        .each(moveFile);
}

function copyFile(origin, destiny){
    if(origin === undefined || destiny === undefined){
        return Promise.reject("Wrong number of parameters. Origin and destiny filenames are needed");
    }

    var inFileStream = fs.createReadStream(origin);
    var outFileStream = fs.createWriteStream(destiny);

    var copyPromise = new Promise((resolve, reject)=>{
        inFileStream.pipe(outFileStream);
        inFileStream.on("error", (err)=>{
            console.warn("Error during copy of file %s", origin);
            reject("Could not read file " + origin + "::" + err);
        });

        outFileStream.on("error", (err)=>{
            console.warn("Error while writing file %s", destiny);
            reject("Could not write file " + destiny + "::" + err);
        });

        outFileStream.on("finish", ()=>{
            resolve(outFileStream.bytesWritten);
        });
    });

    return copyPromise;
}



exports = module.exports = {
    isImage : isImage,
    isJPEG : isJPEG,
    getFileList : getFileList,
    getNewFiles : getNewFiles,
    copyFile : copyFile,
    copyFolder : copyFolder
};

