'use strict';

var Q = require('q');
var git = require('gulp-git');

module.exports = function(command, args, options, callback) {
    var deferred = Q.defer();

    options && args.push(options);

    args.push(function(err, stdout) {
        var result = stdout;
        if (err) {
            deferred.reject(err);
        }

        if (callback) {
            result = callback(err, stdout);
        }

        deferred.resolve(result);
    });

    git[command].apply(this, args);

    return deferred.promise;
};
