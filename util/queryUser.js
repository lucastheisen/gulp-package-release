'use strict';

var inquirer = require('inquirer');
var path = require('path');
var Q = require('q');
var semver = require('semver');

module.exports = function(config) {
    var deferred = Q.defer(),
        prompt,
        answers;

    config = config || {},
    answers = config.answers || {};

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
                    var version;
                    try {
                        version = require(
                            path.join(process.cwd(), '/bower.json')).version;
                    }
                    catch (e) {
                        try {
                            version = require(
                                path.join(process.cwd(), '/package.json')).version;
                        }
                        catch (e) {
                            throw e;
                        }
                    }
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

        if (config.withPrompt) {
            config.withPrompt(prompt);
        }
    }
    return deferred.promise;
};
