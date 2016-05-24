'use strict';

const expect = require('chai').expect;
const MongoDQL = require('./mongo-dql');

describe('Mongo DQL', () => {

  describe('defaults', () => {
    const whereDefault = {};
    const orderByDefault = {};
    const mongoDQL = new MongoDQL(null, null, {where: whereDefault, orderBy: orderByDefault});

    it('should use all', (done) => {
      const result = mongoDQL.parse('');

      expect(result.where).to.equal(whereDefault);
      expect(result.orderBy).to.equal(orderByDefault);

      done();
    });

    it('should use orderBy only', (done) => {
      const result = mongoDQL.parse('x=1');

      expect(result.where).to.not.equal(whereDefault);
      expect(result.orderBy).to.equal(orderByDefault);

      done();
    });

    it('should use where only', (done) => {
      const result = mongoDQL.parse('ORDER BY y');

      expect(result.where).to.equal(whereDefault);
      expect(result.orderBy).to.not.equal(orderByDefault);

      done();
    });

    it('should not use any', (done) => {
      const result = mongoDQL.parse('x=1 ORDER BY y');

      expect(result.where).to.not.equal(whereDefault);
      expect(result.orderBy).to.not.equal(orderByDefault);

      done();
    });
  });

  describe('orderByMappings', () => {
    it('should map orderBy identifiers', (done) => {
      const input = 'ORDER BY identifier ASC, qualified.identifier DESC, unmapped ASC';
      const expected = {mapped1: 1, mapped2: -1, unmapped: 1};

      const orderByMappings = {
        identifier: 'mapped1',
        'qualified.identifier': 'mapped2'
      };

      const mongoDQL = new MongoDQL(null, orderByMappings, null);

      expect(mongoDQL.parse(input).orderBy).to.eql(expected);

      done();
    });
  });

  describe('whereTransformer', () => {
    it('should transform conditions', (done) => {
      const input = `name='foulen' AND age < 10`;
      const expected = {
        $and: [
          {
            $or: [
              {firstName: {$regexp: 'foulen'}},
              {lastName: {$regexp: 'foulen'}}
            ]
          },
          {age: {$lt: 10}}
        ]
      };

      const transform = (identifier, operator, value) => {
        if (identifier === 'name') {
          return {
            $or: [
              {firstName: {$regexp: value}},
              {lastName: {$regexp: value}}
            ]
          };
        }
      };

      const mongoDQL = new MongoDQL(transform, null, null);

      expect(mongoDQL.parse(input).where).to.eql(expected);

      done();
    });
  });

});
