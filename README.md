# JSON Mask [![Build Status](https://secure.travis-ci.org/nemtsov/json-mask.png)](http://travis-ci.org/nemtsov/json-mask)

<img src="/logo.png" align="right" width="267px" />

This is a tiny language and an engine for selecting specific parts of a JS object, hiding/masking the rest.

```js
var mask = require('json-mask')
mask({p: {a: 1, b: 2}, z: 1}, 'p/a,z')  // {p: {a: 1}, z: 1}
```

If you've ever used the Google APIs, and provided a `?fields=` query-string to get a 
[Partial Response](https://developers.google.com/+/api/#partial-responses), you've 
already used this language. The desire to have partial responses in 
my own Node.js-based HTTP services was the reason I wrote JSON Mask.

*For [express](http://expressjs.com/) users, there's a
[partial-response-middleware](https://github.com/nemtsov/partial-response-middleware).
It will integrate with your existing services with no additional code 
if you're using `res.json()` or `res.jsonp()`*

This library has no dependencies; and that's a feature. It works in Node as well as in the browser:

[![browser support](https://ci.testling.com/nemtsov/json-mask.png)](https://ci.testling.com/nemtsov/json-mask)

**Note:** the browser build (minified / regular) is in the `/build` folder.

## Syntax

The syntax is loosely based on XPath:

- ` a,b,c` comma-separated list will select multiple fields
- ` a/b/c` path will select a field from its parent
- `a(b,c)` sub-selection will select many fields from a parent
- ` a/*/c` the star `*` wildcard will select all items in a field

Take a look at `test/index-test.js` for examples of all of these and more.


## Grammar

```
  Props ::= Prop | Prop "," Props
   Prop ::= Object | Array
 Object ::= NAME | NAME "/" Object
  Array ::= NAME "(" Props ")"
   NAME ::= ? all visible characters ?
```



## Examples

Identify the fields you want to keep:
```js
var fields = 'url,object(content,attachments/url)'
```

From this sample object:
```js
var originalObj = {
  id: 'z12gtjhq3qn2xxl2o224exwiqruvtda0i',
  url: 'https://plus.google.com/102817283354809142195/posts/F97fqZwJESL',
  object: {
    objectType: 'note',
    content: 'A picture... of a space ship... launched from earth 40 years ago.',
    attachments: [{
      objectType: 'image',
      url: 'http://apod.nasa.gov/apod/ap110908.html',
      image: {height: 284, width: 506}
    }]
  },
  provider: {title: 'Google+'}
}
```

Here's what you'll get back:
```js
var expectObj = {
  url: 'https://plus.google.com/102817283354809142195/posts/F97fqZwJESL',
  object: {
    content: 'A picture... of a space ship... launched from earth 40 years ago.',
    attachments: [{
      url: 'http://apod.nasa.gov/apod/ap110908.html'
    }]
  }
}
```

Let's test that:
```js
var mask = require('json-mask')
  , assert = require('assert')
  , maskedObj

maskedObj = mask(originalObj, fields)

assert.deepEqual(maskedObj, expectObj)
```


### Partial Responses Server Example

Here's an example of using `json-mask` to implement the
[Google API Partial Response](https://developers.google.com/+/api/#partial-responses)

```js
var http = require('http')
  , url = require('url')
  , mask = require('json-mask')
  , server

server = http.createServer(function (req, res) {
  var fields = url.parse(req.url, true).query.fields
    , data = {
          firstName: 'Mohandas'
        , lastName: 'Gandhi'
        , aliases: [{
              firstName: 'Mahatma'
            , lastName: 'Gandhi'
          }, {
              firstName: 'Bapu'
          }]
      }
  res.writeHead(200, {'Content-Type': 'application/json'})
  res.end(JSON.stringify(mask(data, fields)))
})

server.listen(4000)
```

Let's test it:
```bash
$ curl 'http://localhost:4000'
{"firstName":"Mohandas","lastName":"Gandhi","aliases":[{"firstName":"Mahatma","lastName":"Gandhi"},{"firstName":"Bapu"}]}

$ # Let's just get the first name
$ curl 'http://localhost:4000?fields=lastName'
{"lastName":"Gandhi"}

$ # Now, let's just get the first names directly as well as from aliases
$ curl 'http://localhost:4000?fields=firstName,aliases(firstName)'
{"firstName":"Mohandas","aliases":[{"firstName":"Mahatma"},{"firstName":"Bapu"}]}
```

**Note:** a few more examples are in the `/example` folder.


License
-------

MIT. See LICENSE
