'use strict';

var fs = require('fs');
var path = require('path');

var findRecurse = function(wanted, fullPath, dir, name) {
    var cwd = process.cwd(),
    stats = fs.statSync(fullPath);

    if (stats.isDirectory()) {
        try {
            process.chdir(fullPath);
            fs.readdirSync(fullPath).forEach(function(entry) {
                findRecurse(wanted,
                    path.join(fullPath, entry), fullPath, entry);
            });
        }
        finally {
            process.chdir(cwd);
        }
    }

    wanted(fullPath, dir, name);
}

var find = function(wanted, dirs) {
    var cwd = process.cwd();

    dirs.forEach(function(startDir) {
        var fullPath = path.resolve(startDir),
        dir = path.dirname(fullPath),
        name = path.basename(fullPath);

        try {
            process.chdir(dir);
            findRecurse(wanted, fullPath, dir, name);
        }
        finally {
            process.chdir(cwd);
        }
    });
}

var mkdirs = function(dirs) {
    dirs.forEach(function(dir) {
        fs.mkdirSync(dir);
    });
}

var rmdirs = function(dirs) {
    find(
            function(fullPath, dir, name) {
                var stats = fs.statSync(fullPath);
                if (stats.isDirectory()) {
                    retry(function() {fs.rmdirSync(fullPath);}, 3);
                }
                else if (stats.isFile()) {
                    retry(function() {fs.unlinkSync(fullPath);}, 3);
                }
                else {
                    console.log('dont know what to do with (%s)', stats);
                }
            }, dirs);
}

var retry = function(callback, times) {
    try {
        callback();
    }
    catch (e) {
        if (--times > 0) {
            console.log('try again in a second');
            setTimeout(function() {retry(callback, times);}, 1);
        }
        else {
            throw e;
        }
    }
}

module.exports = {
    find: find,
    mkdirs: mkdirs,
    rmdirs: rmdirs
};
