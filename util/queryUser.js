'use strict';

var gutil = require('gulp-util');
var inquirer = require('inquirer');
var path = require('path');
var Q = require('q');
var semver = require('semver');

module.exports = function(options) {
    var deferred = Q.defer(),
        prompt,
        answers,
        files,
        cwd;

    options = options || {},
    answers = options.answers || {};
    cwd = options.cwd || process.cwd();
    files = options.files || ['package.json'];

    if (answers.version && answers.tag && answers.nextVersion) {
        deferred.resolve(answers);
    }
    else {
        prompt = inquirer.prompt([
            {
                type: 'input',
                name: 'version',
                message: 'Release version: ',
                when: function() {
                    return !answers.version;
                },
                default: function() {
                    var index = 0,
                        file,
                        version;

                    for (; index < files.length; index++) {
                        file = files[index];
                        try {
                            version = require(
                                path.join(cwd, file)).version;
                            gutil.log('Using %s version [%s]', file, version);
                            break;
                        }
                        catch (e) {
                            gutil.log('Cant find %s', file);
                        }
                    }

                    version = semver.inc(version, 'patch') || '1.0.0';
                    gutil.log('Default release version [%s]', version);
                    return version;
                }
            },
            {
                type: 'input',
                name: 'tag',
                message: 'Tag: ',
                when: function() {
                    return !answers.tag;
                },
                default: function(userAnswers) {
                    return 'v' + (userAnswers.version || answers.version);
                }
            },
            {
                type: 'input',
                name: 'nextVersion',
                message: 'Next version: ',
                when: function() {
                    return !answers.nextVersion;
                },
                default: function(userAnswers) {
                    return semver.inc(
                        (userAnswers.version || answers.version), 
                        'patch', false) + '-SNAPSHOT';
                }
            }], function(userAnswers) {
                deferred.resolve({
                    version: (userAnswers.version || answers.version),
                    tag: (userAnswers.tag || answers.tag),
                    nextVersion: (userAnswers.nextVersion || answers.nextVersion)
                });
            });

        if (options.withPrompt) {
            options.withPrompt(prompt);
        }
    }
    return deferred.promise;
};
