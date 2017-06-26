/*jshint esversion:6*/
var fsTools = require("./lib/fslib.js");


function importMedia(origin, destiny){
    fsTools.copyFolder(origin, destiny);
}

exports = module.exports = {
    importMedia : importMedia
};
