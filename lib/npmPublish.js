'use strict';

var spawn = require('child_process').spawn;
var Q = require('q');

module.exports = function(options) {
    var deferred = Q.defer(),
        command = ['publish'],
        dryRun = false;

    if (options) {
        command.push(options.folder || options.tarball || '.');
        command.push('--tag', options.tag || 'latest');
        command.push('--access', options.access || 'restricted');
        dryRun = options.dryRun || false;
    }

    if (dryRun) {
        deferred.resolve(command);
    }
    else {
        spawn((process.platform === 'win32') ? 'npm.cmd' : 'npm',
            command,
            {
                stdio: 'inherit'
            })
            .on('close', function(err) {
                if (err) {
                    deferred.reject(err);
                }
                deferred.resolve();
            });
    }

    return deferred.promise;
};
