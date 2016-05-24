'use strict';

const DQL = require('./dql');

class MongoDQL {
  constructor(conditionTransform, sortMappings, defaults) {
    this.parser = new DQL.Parser();

    if (typeof conditionTransform === 'function')
      this.parser.yy.transform = conditionTransform;

    this.sortMappings = sortMappings;
    this.defaults = defaults;
  }

  parse(str) {
    const result = this.parser.parse(str || '');

    if (result.orderBy && this.sortMappings) {
      let orderBy = {};

      Object.keys(result.orderBy).forEach((property) => {
        let mappedProperty = this.sortMappings[property] || property;

        orderBy[mappedProperty] = result.orderBy[property];
      });

      result.orderBy = orderBy;
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
