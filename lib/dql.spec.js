'use strict';

const util = require('util');
const expect = require('chai').expect;
const DQL = require('./dql');

describe('DQL Parser', () => {
  let dql;

  beforeEach(() => {
    dql = new DQL.Parser();
  });

  it('should throw on invalid input', (done) => {
    [undefined, null, '()', 'id', 'id=', 'id=id', 'order by', 'order by id a'].forEach((input) => {
      expect(() => {
        dql.parse(input);
      }).to.throw(Object);
    });

    done();
  });

  it('should return nulls on empty string', (done) => {
    const input = '';
    const expected = {where: null, orderBy: null};

    expect(dql.parse(input)).to.eql(expected);

    done();
  });

  it('should parse a simple condition', (done) => {
    const input = `identifier='value'`;
    const expected = {where: {identifier: 'value'}, orderBy: null};

    expect(dql.parse(input)).to.eql(expected);
    expect(dql.parse(util.format('(%s)', input))).to.eql(expected);

    done();
  });

  it('should parse a simple AND condition', (done) => {
    const input = `identifier1='value1' AND identifier2='value2'`;
    const expected = {
      where: {
        $and: [
          {identifier1: 'value1'},
          {identifier2: 'value2'}
        ]
      },
      orderBy: null
    };

    expect(dql.parse(input)).to.eql(expected);
    expect(dql.parse(util.format('(%s)', input))).to.eql(expected);

    done();
  });

  it('should parse a simple OR condition', (done) => {
    const input = `identifier1='value1' OR identifier2='value2'`;
    const expected = {
      where: {
        $or: [
          {identifier1: 'value1'},
          {identifier2: 'value2'}
        ]
      },
      orderBy: null
    };

    expect(dql.parse(input)).to.eql(expected);
    expect(dql.parse(util.format('(%s)', input))).to.eql(expected);

    done();
  });

  it('should run custom formatter', (done) => {
    const input = `identifier1='value1' OR identifier2='value2' OR identifier3=10`;
    const expected = {
      where: {
        $or: [
          {identifier1: 'value1'},
          {identifier2: 'value2 changed'},
          {id3: {$lt: 10}}
        ]
      },
      orderBy: null
    };

    dql.yy.transform = (identifier, operator, value) => {
      let condition;

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

    expect(dql.parse(input)).to.eql(expected);

    done();
  });

  it('should not run custom formatter defined in another instance (from last test)', (done) => {
    const input = `identifier1='value1' OR identifier2='value2' OR identifier3=10`;
    const expected = {
      where: {
        $or: [
          {identifier1: 'value1'},
          {identifier2: 'value2'},
          {identifier3: 10}
        ]
      },
      orderBy: null
    };

    expect(dql.parse(input)).to.eql(expected);

    done();
  });

  it('should parse a simple order by clause', (done) => {
    const input = 'ORDER BY identifier ASC, qualified.identifier DESC';
    const expected = {
      where: null,
      orderBy: {
        identifier: 1,
        'qualified.identifier': -1
      }
    };

    expect(dql.parse(input)).to.eql(expected);

    done();
  });

  it('should parse a complex condition and convert values', (done) => {
    const input = `str='string' AND qualified.in IN (1, 'two', null, false) AND nin NOT IN ('n1', 'n2') AND (or1 > 100 OR or2 < 10 OR (ora >= 1 AND ora <= 20)) ORDER BY asc1, desc1 DESC, asc2 ASC, desc2 DESC`;
    const expected = {
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

    expect(dql.parse(input)).to.eql(expected);

    done();
  });

});
