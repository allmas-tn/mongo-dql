'use strict';

var util = require('util');
var should = require('should');
var DQL = require('./dql');

describe('DQL Parser', function() {
  var dql;

  beforeEach(function() {
    dql = new DQL.Parser();
  });

  it('should throw on invalid input', function(done) {
    [undefined, null, '()', 'id', 'id=', 'id=id', 'order by', 'order by id a'].forEach(function(input) {
      should.throws(function() {
        dql.parse(input);
      });
    });

    done();
  });

  it('should return nulls on empty string', function(done) {
    var input = '';
    var expected = {where: null, orderBy: null};

    should(dql.parse(input)).be.eql(expected);

    done();
  });

  it('should parse a simple condition', function(done) {
    var input = 'identifier=\'value\'';
    var expected = {where: {identifier: 'value'}, orderBy: null};

    should(dql.parse(input)).be.eql(expected);
    should(dql.parse(util.format('(%s)', input))).be.eql(expected);

    done();
  });

  it('should parse a simple AND condition', function(done) {
    var input = 'identifier1=\'value1\' AND identifier2=\'value2\'';
    var expected = {
      where: {
        $and: [
          {identifier1: 'value1'},
          {identifier2: 'value2'}
        ]
      },
      orderBy: null
    };

    should(dql.parse(input)).be.eql(expected);
    should(dql.parse(util.format('(%s)', input))).be.eql(expected);

    done();
  });

  it('should parse a simple OR condition', function(done) {
    var input = 'identifier1=\'value1\' OR identifier2=\'value2\'';
    var expected = {
      where: {
        $or: [
          {identifier1: 'value1'},
          {identifier2: 'value2'}
        ]
      },
      orderBy: null
    };

    should(dql.parse(input)).be.eql(expected);
    should(dql.parse(util.format('(%s)', input))).be.eql(expected);

    done();
  });

  it('should run custom formatter', function(done) {
    var input = 'identifier1=\'value1\' OR identifier2=\'value2\' OR identifier3=10';
    var expected = {
      where: {
        $or: [
          {identifier1: 'value1'},
          {identifier2: 'value2 changed'},
          {id3: {$lt: 10}}
        ]
      },
      orderBy: null
    };

    dql.yy.transform = function(identifier, operator, value) {
      var condition;

      switch (identifier) {
        case 'identifier2':
          condition = {identifier2: value + ' changed'};
          break;

        case 'identifier3':
          condition = {'id3': {$lt: value}};
          break;
      }

      return condition;
    };

    should(dql.parse(input)).be.eql(expected);

    done();
  });

  it('should not run custom formatter defined in another instance (from last test)', function(done) {
    var input = 'identifier1=\'value1\' OR identifier2=\'value2\' OR identifier3=10';
    var expected = {
      where: {
        $or: [
          {identifier1: 'value1'},
          {identifier2: 'value2'},
          {identifier3: 10}
        ]
      },
      orderBy: null
    };

    should(dql.parse(input)).be.eql(expected);

    done();
  });

  it('should parse a simple order by clause', function(done) {
    var input = 'ORDER BY identifier ASC, qualified.identifier DESC';
    var expected = {
      where: null,
      orderBy: {
        identifier: 1,
        'qualified.identifier': -1
      }
    };

    should(dql.parse(input)).be.eql(expected);

    done();
  });

  it('should parse a complex condition and convert values', function(done) {
    var input = 'str=\'string\' AND qualified.in IN (1, \'two\', null, false) AND nin NOT IN (\'n1\', \'n2\') AND (or1 > 100 OR or2 < 10 OR (ora >= 1 AND ora <= 20)) ORDER BY asc1, desc1 DESC, asc2 ASC, desc2 DESC';
    var expected = {
      where: {
        $and: [
          {str: 'string'},
          {'qualified.in': {$in: [1, 'two', null, false]}},
          {nin: {$nin: ['n1', 'n2']}},
          {
            $or: [
              {or1: {$gt: 100}},
              {or2: {$lt: 10}},
              {
                $and: [
                  {ora: {$gte: 1}},
                  {ora: {$lte: 20}}
                ]
              }
            ]
          }
        ]
      },
      orderBy: {
        asc1: 1,
        desc1: -1,
        asc2: 1,
        desc2: -1
      }
    };

    should(dql.parse(input)).be.eql(expected);

    done();
  });

});
