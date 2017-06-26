#!/usr/bin/env node
/*jshint esversion:6*/

var photoImporter = require('../index.js');

var commander = require("commander");

var CONFIG_FILE = "config.json";

var origin, destiny;

commander
    .version(process.env.npm_package_version || "0.0.0")
    .usage('[options] <origin> <destiny>')
    .option('-c, --config [file]', 'Use the specified configuration [' + CONFIG_FILE + ']',CONFIG_FILE)
    .option('-t, --toto', 'One flag that does nothing...')
    .parse(process.argv);



console.dir(commander.args);
if(commander.args.length !== 2){
    commander.help();
}
[origin, destiny] = commander.args;

photoImporter.importMedia(origin, destiny);
