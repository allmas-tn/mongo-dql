'use strict';

const util = require('util');
const should = require('should');
const MongoDQL = require('./mongo-dql');

describe('Mongo DQL', () => {

  describe('defaults', () => {
    const whereDefault = {};
    const orderByDefault = {};
    const mongoDQL = new MongoDQL(null, null, {where: whereDefault, orderBy: orderByDefault});

    it('should use all', (done) => {
      const result = mongoDQL.parse('');
      should(result.where).be.equal(whereDefault);
      should(result.orderBy).be.equal(orderByDefault);

      done();
    });

    it('should use orderBy only', (done) => {
      const result = mongoDQL.parse('x=1');
      should(result.where).not.be.equal(whereDefault);
      should(result.orderBy).be.equal(orderByDefault);

      done();
    });

    it('should use where only', (done) => {
      const result = mongoDQL.parse('ORDER BY y');
      should(result.where).be.equal(whereDefault);
      should(result.orderBy).not.be.equal(orderByDefault);

      done();
    });

    it('should not use any', (done) => {
      const result = mongoDQL.parse('x=1 ORDER BY y');
      should(result.where).not.be.equal(whereDefault);
      should(result.orderBy).not.be.equal(orderByDefault);

      done();
    });
  });

});
