# ast

- pubdate: 2013-01-23

The AST of javascript.

-----

```js
var ast = require('cmd-util').ast
```

## ast.parseFirst(code)

Get information of the first `define`:

```js
define('id', ['a'], function(require) {
   var $ = require('jquery')
});
```

When `ast.parse(code)` this code block, it will return:

```
{id: 'id', dependencies: ['a'], factory: factoryNode}
```

If the `define` only has a factory:

```js
define(function(require) {
   var $ = require('jquery')
});
```

The result should be:

```
{id: null, dependencies: ['jquery'], factory: factoryNode}
```


## ast.parseAll(code)

Information or meta data in every `define`:

```
define('id', ['a'], {})
define(function(require) {
   var $ = require('jquery')
});
```

The result of `ast.parseAll(code)`:

```
[
    {id: 'id', dependencies: ['a'], factory: factoryNode},
    {id: null, dependencies: ['jquery'], factory: factoryNode}
]
```

## ast.modify(code, {id: fn, dependencies: fn, require: fn})

Modify meta data in the `define`:

```
// define({})
ast.modify(code, {id: 'id', dependencies: ['a']})

// => define('id', ['a'], {})
```

```
// define('id', ['a'], {})
ast.modify(code, {id: function(v) { return v + '-debug'}})

// => define('id-debug', ['a'], {})
```

```
// define('id', [], function(require) { var $ = require('jquery') })
ast.modify(code, {require: function(v) {
   if (v === 'jquery') return '$';
});

// => define('id', [], function(require) { var $ = require('$') })
```

```
// define('id', [], function(require) { var $ = require('jquery') })
ast.modify(code, {require: {'jquery': '$'}});

// => define('id', [], function(require) { var $ = require('$') })
```


## ast.modify(code, fn)

Modify every meta data with the function:

```
define('id', ['a'], function(require) {
    var $ = require('jquery')
});
```

Modify the code with:

```
ast.modify(code, function(v) {
    return v + '-debug'
})
```

The result should be:

```
define('id-debug', ['a-debug'], function(require) {
    var $ = require('jquery-debug');
});
```
