# css

- pubdate: 2013-03-13

The css parser

-----

```js
var css = require('cmd-util').css
```


## css.parse(code)

When a css data is parsed, it will return a data structure like:

```js
{
    id: 'alice/button/1.0.0/button.css',

    // parse from source
    dependencies: [],

    source: [
        {
            type: 'import',
            id: 'base'
        },
        {
            type: 'block',
            code: '...',
        }
        {
            type: 'import',
            id: 'alice/class/1.0.0/class.css'
        },
        {
            type: 'block',
            code: '...',
        },
        {
            type: 'block',
            id: 'alice/button/1.0.1/button.css',
            code: '...'
        }
        ...
    ]
}
```


## css.modify(code, id, fn)

You can only modify `import` and `block`.
