'use strict';

var chai = require('chai'),should = chai.should();
var semver = require('semver');

describe('semver', function() {
    it('should strip pre-release', function() {
        var parsed = semver.parse('0.0.1-SNAPSHOT', true);
        parsed.inc('patch');
        parsed.version.should.equal('0.0.1');

    });

    it('should strip pre-release', function() {
        semver.inc('0.0.1-SNAPSHOT', 'patch').should.equal('0.0.1');
    });
});
