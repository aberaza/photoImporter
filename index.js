/*jshint esversion:6*/

var commander = require("commander");
var fs = require("fs");
var  Promise = require("bluebird");

// convert fs methods to promises
// Promise.promisifyAll(fs); 

// Promisified metho
const fsp = {
    readdir : Promise.promisify(fs.readdir),
    stat : Promise.promisify(fs.stat)
};

//EXIF CANDIDATES
var fastExif = require("fast-exif");

const JPEG_EXTENSIONS = ["jpeg", "jpg","jif","jfif","jp2","jpx","j2k","j2c"];
const RAW_EXTENSIONS = ["tiff","tif","3fr","ari","arw","bay","crw","cr2","cap","data","dcs","dcr","dng","drf","eip","erf","fff","gpr","iiq","k25","kdc","mdc","mef","mos","mrw","nef","nrw","obm","orf","pef","ptx","pxn","rwd","raf","raw","rwl","rw2","rwz","sr2","srf","srw","tif","x3f"];
const IMAGE_EXTENSIONS = JPEG_EXTENSIONS.concat(RAW_EXTENSIONS);
const configFile = "config.json";
// Command line
//
// commander
//     .version(process.env.npm_package_version || "0.0.0")
//     .usage('[options] <file>')
//     .option('-c, --config [file]', 'Use the specified configuration [' + configFile + ']',configFile)
//     .option('-t, --toto', 'One flag that does nothing...')
//     .parse(process.argv);

// var filesList = commander.args;

// console.log("Files: ", filesList.join(', '));


function isImage(filename){ 
    console.log(filename);
    var ext = filename.split(".").pop().toLowerCase();
    console.log(ext);
    return IMAGE_EXTENSIONS.indexOf(ext) > -1;
}

function isJPEG(filename){
    var ext = filename.split(".").pop().toLowerCase();
    return JPEG_EXTENSIONS.indexOf(ext) > -1;
}

function readConfig(configurationFile){
    var cfg = fs.readFileSync(configurationFile);
    return JSON.parse(cfg);
}

function checkFile(file){
    fs.exists(file, (exists)=>{
        console.log("File %s exists? %s", file, exists);
    });

    fastExif.read(file, 0)
        .then(console.log);
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
        console.log(filePath);
        return fsp.stat(filePath)
            .then((stat) => stat.isFile()? filePath : (stat.isDirectory()? getFileList(filePath) : undefined))
            .catch((err) => console.warn("WARNING: Could not read file %s . ", filePath, err));
    };


    return fsp.readdir(folder)
        .mapSeries(recurseFolders)
        .then(cleanAndFlatten);
}

function findNewFiles(media, existing){
    return Promise.all([getFileList(media), getFileList(existing)])
                .then((lists) => {
                    var existingFiles = lists[1].map(file => file.split("/").pop());
                    return lists[0].filter(file => existingFiles.indexOf( file.split("/").pop()) === -1);
                });
}

var TOTAL_FILES = 0;
var FILES_COPIED = [];
var FILES_FAILED = [];
function printProgress(file, ok){
    TOTAL_FILES--;
    (ok?FILES_COPIED : FILES_FAILED).push(file);
    console.log("Copied %s files, (%s err). %s files remaining", FILES_COPIED.length, FILES_FAILED.length, TOTAL_FILES);
}


function copyFolderMedia(origin, destiny){

    return findNewFiles(origin, destiny)
        .then( files => {
            TOTAL_FILES = files.length;
            return files;
        })
        .each( (file) => copyFile(file, destiny + "/" + file.split("/").pop()))
        .catch((err) => console.warn(err));
        //     .then(()=> printProgress(file, true))
        //     .catch((err) => {printProgress(file, false); console.warn(err);})); 
}


exports = module.exports = {
    isImage : isImage,
    isJPEG : isJPEG,
    readConfig : readConfig,
    // checkFile : checkFile,
    // copyFile : copyFile,
    getFileList : getFileList,
    findNewFiles : findNewFiles,
    copyFolderMedia : copyFolderMedia
};
