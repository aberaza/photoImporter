#!/usr/bin/env node

/*jshint esversion:6*/
var commander = require("commander");

commander
    .version(process.env.npm_package_version || "0.0.0")
    .usage('[options] <file>')
    .option('-c, --config [file]', 'Use the specified configuration [' + configFile + ']',configFile)
    .option('-t, --toto', 'One flag that does nothing...')
    .parse(process.argv);


