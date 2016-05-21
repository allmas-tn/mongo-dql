'use strict';

const DQL = require('./dql');

class MongoDQL {
  constructor(whereTransformer, orderByMappings, defaults) {
    this.parser = new DQL.Parser();

    if (typeof whereTransformer === 'function')
      this.parser.yy.transform = whereTransformer;

    this.orderByMappings = orderByMappings;
    this.defaults = defaults;
  }

  parse(str) {
    const result = this.parser.parse(str || '');

    if (result.orderBy && this.orderByMappings) {
      let mappedOrderBy = {};

      Object.keys(result.orderBy).forEach((property) => {
        let mappedProperty = this.orderByMappings[property] || property;

        mappedOrderBy[mappedProperty] = result.orderBy[property];
      });

      result.orderBy = mappedOrderBy;
    }

    if (!result.where)
      result.where = this.defaults && this.defaults.where || {};

    if (!result.orderBy)
      result.orderBy = this.defaults && this.defaults.orderBy || {};

    return result;
  }
}

MongoDQL.Parser = DQL.Parser;

module.exports = MongoDQL;
