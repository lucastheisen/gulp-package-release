'use strict';

var chai = require('chai'),should = chai.should();
var queryUser = require('../util/queryUser');
var Q = require('q');

describe('util-queryUser', function() {
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
});
