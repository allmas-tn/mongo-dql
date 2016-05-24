# Mongo DQL

A simple SQL-like data querying language to MongoDB converter.

The main aim of this module is to easily add support for filtering and sorting to MongoDB based web services. This is
done through a simple querying language that is converted to MongoDB queries and sort definitions.

## Installation

```sh
npm install --save mongo-dql
```

## Usage

### Basic usage

Sample basic usage with Mongoose and Express:

```js
const MongoDQL = require('mongo-dql');
const mongoDQL = new MongoDQL();

exports.list = function(req, res, next) {
  const query = mongoDQL.parse(req.query.q);

  Model
    .find(query.where)
    .sort(query.orderBy)
    .then((models) => res.json(models));
}
```

### Advanced usage

The complete signature of the `MongoDQL` constructor is the following:

```js
MongoDQL(conditionTransform, sortMappings, defaults)
```

#### Condition transform

It's a function that can be used to transform conditions when they are created. The function must have the following
signature:

```js
function(identifier, operator, value)
```

For each parsed condition, the function receives the identifier, the mongo operator and the converted value as
parameters. If it returns a falsy value, the condition will be added as usual, otherwise the returned value is used as
the query for this condition.

This is useful in cases where a complex query should be simplified to clients, where a query should use internal model
properties that are not exposed or where a query can not be expressed with the DQL.

The following example uses the transform function to simplify a complex condition:

```js
function transform(identifier, operator, value) {
  if (identifier === 'name') {
    const pattern = new RegExp(_.escapeRegExp(value), 'i');

    return {$or: [
      {firstName: pattern},
      {lastName: pattern}
    ]}
  }
}

const mongoDQL = new MongoDQL(transform);
```

With this transform function, the condition `name = 'value'` would create a query that matches documents that contain
`value` in either the `firstName` or `lastName` properties.

#### Sort mappings

It's an object whose properties are identifier names as they will appear in the query string and the values the
corresponding properties to use in the final sort definition. This is mainly useful to use normalized fields for case
insensitive sorting without exposing them.

Example:

```js
const sortMappings = {name: 'normalized.name'};
const mongoDQL = new MongoDQL(null, sortMappings);
```

This would transform `ORDER BY name` into `{'normalized.name': 1}`.

#### Defaults

It's an object with the same structure as the result that defines default values to use for the `where` and `orderBy`
properties. So if the parsed query does not have conditions, the `where` property of the defaults object will be used
if defined, and the same goes for the sort definitions and the `orderBy` property.

## Data Querying Language

The DQL used is SQL-like but simpler and more constrained. The general syntax is:

```
[conditions] [ORDER BY sort definitions]
```

The result of parsing a query string is an object with the following properties:

* `where`: conditions converted to a MongoDB query
* `orderBy`: sort definitions in MongoDB format

For example, the following query string:

```
namee = 'foulen' AND age > 10 ORDER BY age DESC, name ASC
```

would create the following object:

```js
{
  where: {
    $and: [
      {name: 'foulen'},
      {age: {$gt: 10}}
    ]
  },
  orderBy: {
    age: -1,
    name: 1
  }
}
```

### Value types

The values used in the conditions and sort definitions are converted to different types based on the following syntax:

* String: `'.*'` (`'` can be escaped with `\'`), e.g. `'foulen\'s age is 18'`
* Number: `[0-9]+` or `[0-9]+.[0-9]+`, e.g. `10`, `10.1`
* Boolean: `true` or `false`
* Null: `null`

Anything else is considered an error and makes the parser throw an exception.

### Conditions

The supported conditions are:

* `identifier = value` : `{identifier: value}`
* `identifier < value` : `{identifier: {$lt: value}}`
* `identifier > value` : `{identifier: {$gt: value}}`
* `identifier <= value` : `{identifier: {$le: value}}`
* `identifier >= value` : `{identifier: {$ge: value}}`
* `identifier LIKE value` : `{identifier: {$regexp: new RegExp(value)}}`
* `identifier ILIKE value` : `{identifier: {$regexp: new RegExp(value, 'i')}}`
* `identifier IN (v1, v2 ...)` : `{identifier: {$in: [v1, v2, ...]}}`
* `identifier NOT IN (v1, v2 ...)` : `{identifier: {$nin: [v1, v2, ...]}}`

As in SQL, conditions can be combined using `AND` and `OR` and grouped with parentheses.

### Sort definitions

Sort definitions use the same syntax as in SQL, i.e. a comma separated list of `identifier [dir]` statements, where
`dir` is either `ASC` or `DESC` and defaults to `ASC` if omitted.

### Embedded documents

Identifiers can use dot-notation as supported by MongoDB to access properties of embedded documents, e.g.
`address.postcode = '123'`.
