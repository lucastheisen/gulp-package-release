'use strict';

var gitPromise = require('../util/gitPromise');

module.exports = function() {
    return gitPromise('status', [], {args: '--porcelain', quiet: false},
        function(err, stdout) {
            if (stdout) {
                throw 'Uncommitted changes found' + (stdout ? ':\n' + stdout : '');
            }
        }).then(function() {
            return gitPromise('exec', [], {args: 'remote update'});
        }).then(function() {
            return gitPromise('revParse', [], {args: '--verify HEAD'});
        }).then(function(head) {
            return gitPromise('revParse', [], {args: '--verify @{upstream}'},
                function(err, upstream) {
                    if (head !== upstream) {
                        return deferred.reject('Latest changes not pushed to remote\n');
                    }
                });
        });
};
