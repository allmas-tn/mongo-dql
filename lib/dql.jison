/* original file source: https://github.com/camilojd/sequeljs/blob/master/src/SqlParser.jison */
/* description: Simple data querying language */
/* :tabSize=4:indentSize=4:noTabs=true: */
%lex

%options case-insensitive

%%

[/][*](.|\n)*?[*][/]                             /* skip comments */
[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*   return 'QUALIFIED_IDENTIFIER'
\s+                                              /* skip whitespace */
ORDER\s+BY\b                                     return 'ORDER_BY'
','                                              return 'COMMA'
'='                                              return 'CMP_EQUALS'
'!='                                             return 'CMP_NOTEQUALS'
'>='                                             return 'CMP_GREATEROREQUAL'
'>'                                              return 'CMP_GREATER'
'<='                                             return 'CMP_LESSOREQUAL'
'<'                                              return 'CMP_LESS'
'('                                              return 'LPAREN'
')'                                              return 'RPAREN'
'LIKE'                                           return 'LIKE'
'ILIKE'                                          return 'ILIKE'
'IN'                                             return 'IN'
'AND'                                            return 'LOGICAL_AND'
'OR'                                             return 'LOGICAL_OR'
'NOT'                                            return 'LOGICAL_NOT'
'ASC'                                            return 'ASC'
'DESC'                                           return 'DESC'
['](\\.|[^'])*[']                                return 'STRING'
'NULL'                                           return 'NULL'
(true|false)\b                                   return 'BOOLEAN'
[0-9]+(\.[0-9]+)?                                return 'NUMERIC'
[a-zA-Z_][a-zA-Z0-9_]*                           return 'IDENTIFIER'
[?]                                              return 'BIND'
<<EOF>>                                          return 'EOF'
.                                                return 'INVALID'

/lex

%start main

%% /* language grammar */

main
    : optWhereClause optOrderByClause EOF { return {where: $1, orderBy: $2}; }
    ;

optWhereClause
    : { $$ = null; }
    | expression { $$ = $1; }
    ;

optOrderByClause
    : { $$ = null; }
    | ORDER_BY orderByList { $$ = $2; }
    ;

orderByList
    : orderByList COMMA orderByListItem { $$ = $1; $$[$3.identifier] = $3.direction.toLowerCase() === 'desc' ? -1 : 1; }
    | orderByListItem { $$ = {}; $$[$1.identifier] = $1.direction.toLowerCase() === 'desc' ? -1 : 1; }
    ;

orderByListItem
    : identifier optOrderByOrder { $$ = {identifier:$1, direction: $2}; }
    ;

optOrderByOrder
    : { $$ = ''; }
    | ASC { $$ = $1; }
    | DESC { $$ = $1; }
    ;

expression
    : andCondition { $$ = $1; }
    | expression LOGICAL_OR andCondition { $$ = Array.isArray($1.$or) ? $1 : {$or: [$1]}; $$.$or.push($3); }
    ;

andCondition
    : condition { $$ = $1; }
    | andCondition LOGICAL_AND condition { $$ = Array.isArray($1.$and) ? $1 : {$and: [$1]}; $$.$and.push($3); }
    ;

condition
    : identifier conditionRightHandSide { $$ = yy.transform ? yy.transform($1, $2.operator, $2.value) : null; if (!$$) { $$ = {}; if ($2.operator === '$eq') { $$[$1] = $2.value; } else { $$[$1] = {}; $$[$1][$2.operator] = $2.value; } } }
    | LPAREN expression RPAREN { $$ = $2; }
    ;

compare
    : CMP_EQUALS { $$ = '$eq'; }
    | CMP_NOTEQUALS { $$ = '$ne'; }
    | CMP_GREATER { $$ = '$gt'; }
    | CMP_GREATEROREQUAL { $$ = '$gte'; }
    | CMP_LESS { $$ = '$lt'; }
    | CMP_LESSOREQUAL { $$ = '$lte'; }
    ;

conditionRightHandSide
    : rhsCompareTest { $$ = $1; }
    | rhsInTest { $$ = $1; }
    ;

rhsCompareTest
    : LIKE STRING { $$ = {operator: '$regex', value: new RegExp($2.substring(1, $2.length - 1))}; }
    | ILIKE STRING { $$ = {operator: '$regex', value: new RegExp($2.substring(1, $2.length - 1), 'i')}; }
    | compare value { $$ = {operator: $1, value: $2}; }
    ;

rhsInTest
    : IN LPAREN rhsInClause RPAREN { $$ = {operator: '$in', value: $3}; }
    | LOGICAL_NOT IN LPAREN rhsInClause RPAREN { $$ = {operator: '$nin', value: $4}; }
    ;

rhsInClause
    : value COMMA commaSepExpressionList { $$ = $3; $3.unshift($1); }
    ;

commaSepExpressionList
    : commaSepExpressionList COMMA value { $$ = $1; $1.push($3); }
    | value { $$ = [$1]; }
    ;

identifier
    : IDENTIFIER { $$ = $1; }
    | QUALIFIED_IDENTIFIER { $$ = $1; }
    ;

value
    : STRING { $$ = $1.substring(1, $1.length - 1); }
    | NUMERIC { $$ = parseFloat($1); }
    | BOOLEAN { $$ = $1.toLowerCase() === 'true'; }
    | NULL { $$ = null; }
    ;
