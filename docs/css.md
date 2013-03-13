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
    type: 'block',
    id: 'alice/button/1.0.0/button.css',
    code: [
        {
            type: 'import',
            id: 'base'
        },
        {
            type: 'string',
            code: '...'
        }
        {
            type: 'import',
            id: 'alice/class/1.0.0/class.css'
        },
        {
            type: 'string',
            code: '...',
        },
        {
            type: 'block',
            id: 'alice/button/1.0.1/button.css',
            code: [
                {
                    type: 'string',
                    code: '....'
                }
            ]
        }
        ...
    ]
}
```

## css.walk(parsed, fn)
