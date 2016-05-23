# Mongo DQL

A simple SQL-like data querying language to MongoDB converter.

The main aim of this module is to easily add support for filtering and sorting to MongoDB based web services. This is
done through a simple querying language that is converted to MongoDB queries and sort definitions.

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
