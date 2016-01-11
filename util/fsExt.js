'use strict';

var fs = require('fs');
var gutil = require('gulp-util');
var path = require('path');
var Q = require('q');
var debug = false;

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

var mkdir = function(dir) {
    var deferred = Q.defer();

    fs.mkdir(dir, function(err) {
        if (err) {
            deferred.reject(err);
        }
        deferred.resolve();
    });

    return deferred.promise
}

var mkdirs = function(dirs) {
    var chain
    dirs.forEach(function(dir) {
        if (!chain) {
            chain = mkdir(dir);
        }
        else {
            chain = chain.then(function() {
                return mkdir(dir);
            });
        }
    });
    return chain;
}

var rmdir = function(dir, tries, deferred) {
    var deferred;
    if (deferred) {
        debug && gutil.log('retry %d', tries);
    }
    else {
        deferred = Q.defer();
    }

    debug && gutil.log('rmdir(%s)', dir);
    fs.rmdir(dir, function(err) {
        if (err) {
            if (err.code === 'ENOENT') {
                deferred.resolve();
            }
            else if (tries > 0) {
                setTimeout(
                    function() {
                        rmdir(dir, tries - 1, deferred);
                    }, 1000);
            }
            else {
                deferred.reject(err);
            }
        }
        else {
            deferred.resolve();
        }
    });

    return deferred.promise;
}

var rmdirs = function(dirs) {
    var chain = Q.fcall(function() {});
    find(
            function(fullPath, dir, name) {
                var stats = fs.statSync(fullPath);
                if (stats.isDirectory()) {
                    chain = chain.then(function() {
                        return rmdir(fullPath, 5);
                    });
                }
                else if (stats.isFile()) {
                    chain = chain.then(function() {
                        return unlink(fullPath, 5);
                    });
                }
                else {
                    gutil.log('dont know what to do with (%s)', stats);
                }
            }, dirs);
    return chain;
}

var unlink = function(file, tries, deferred) {
    var deferred;
    if (deferred) {
        debug && gutil.log('retry %d', tries);
    }
    else {
        deferred = Q.defer();
    }

    debug && gutil.log('unlink(%s)', file);

    fs.unlink(file, function(err) {
        if (err) {
            if (err.code === 'ENOENT') {
                deferred.resolve();
            }
            else if (tries > 0) {
                setTimeout(
                    function() {
                        unlink(file, tries - 1, deferred);
                    }, 1);
            }
            else {
                deferred.reject(err);
            }
        }
        else {
            deferred.resolve();
        }
    });

    return deferred.promise;
}

module.exports = {
    find: find,
    mkdirs: mkdirs,
    rmdirs: rmdirs
};
