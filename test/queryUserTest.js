'use strict';

var chai = require('chai'),should = chai.should();
var fs = require('fs');
var fsExt = require('../util/fsExt');
var gutil = require('gulp-util');
var path = require('path');
var queryUser = require('../util/queryUser');
var Q = require('q');

describe('util-queryUser', function() {
    var originalCwd,
        runDir = path.resolve('./test/run'),
        baseDir = path.resolve(path.join(runDir, 'base')),
        repoDir = path.resolve(path.join(baseDir, 'repo'));

    afterEach(function() {
        return Q.fcall(function() {
                gutil.log('begin afterEach');
                process.chdir(originalCwd);
            })
            .then(function() {
                return fsExt.rmdirs([runDir]);
            })
            .then(function() {
                gutil.log('end afterEach');
            });
    });

    beforeEach(function() {
        return Q.fcall(function() {
                gutil.log('begin beforeEach');
                originalCwd = process.cwd();
            })
            .then(function() {
                return fsExt.mkdirs([runDir, baseDir, repoDir]);
            })
            .then(function() {    
                fs.writeFileSync(path.join(repoDir, 'package.json'), 
                    '{"version": "0.0.1-SNAPSHOT"}');
                process.chdir(repoDir);
            })
            .then(function() {
                gutil.log('end beforeEach');
            });
    });

    it('should not ask any questions', function() {
        return queryUser({answers: {version: '1.0.0', tag: 'v1.0.0', nextVersion: '1.0.1-SNAPSHOT'}})
            .then(function(answers) {
                answers.version.should.equal('1.0.0');
                answers.tag.should.equal('v1.0.0');
                answers.nextVersion.should.equal('1.0.1-SNAPSHOT');
            });
    });

    it('should ask for tag', function() {
        return queryUser(
            {
                answers: {version: '1.0.0', nextVersion: '1.0.1-SNAPSHOT'},
                withPrompt: function(prompt) {
                    prompt.rl.emit('line', 'v1.0.0');
                }
            })
            .then(function(answers) {
                answers.version.should.equal('1.0.0');
                answers.tag.should.equal('v1.0.0');
                answers.nextVersion.should.equal('1.0.1-SNAPSHOT');
            });
    });

    it('should ask for tag and nextVersion', function() {
        return queryUser(
            {
                answers: {version: '1.0.0'},
                withPrompt: function(prompt) {
                    prompt.rl.emit('line', 'v1.0.0');
                    prompt.rl.emit('line', '1.0.1-SNAPSHOT');
                }
            })
            .then(function(answers) {
                answers.version.should.equal('1.0.0');
                answers.tag.should.equal('v1.0.0');
                answers.nextVersion.should.equal('1.0.1-SNAPSHOT');
            });
    });

    it('should ask version, tag and nextVersion', function() {
        return queryUser(
            {
                withPrompt: function(prompt) {
                    prompt.rl.emit('line', '1.0.0');
                    prompt.rl.emit('line', 'v1.0.0');
                    prompt.rl.emit('line', '1.0.1-SNAPSHOT');
                }
            })
            .then(function(answers) {
                answers.version.should.equal('1.0.0');
                answers.tag.should.equal('v1.0.0');
                answers.nextVersion.should.equal('1.0.1-SNAPSHOT');
            });
    });
});
