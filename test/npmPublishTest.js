'use strict';

var chai = require('chai'),
    should = chai.should();
var npmPublish = require('../').npmPublish;

describe('publish', function() {
    it('should generate publish with all defaults', function() {
        return npmPublish({dryRun: true})
            .then(function(command) {
                command.should.deep.equal(['publish', '.', '--tag', 'latest', '--access', 'restricted']);
            });
    });

    it('should generate publish with tag foo', function() {
        return npmPublish({dryRun: true, tag: 'foo'})
            .then(function(command) {
                command.should.deep.equal(['publish', '.', '--tag', 'foo', '--access', 'restricted']);
            });
    });

    it('should generate publish with tag foo and access public', function() {
        return npmPublish({dryRun: true, tag: 'foo', access: 'public'})
            .then(function(command) {
                command.should.deep.equal(['publish', '.', '--tag', 'foo', '--access', 'public']);
            });
    });

    it('should generate publish with access public', function() {
        return npmPublish({dryRun: true, access: 'public'})
            .then(function(command) {
                command.should.deep.equal(['publish', '.', '--tag', 'latest', '--access', 'public']);
            });
    });
});
