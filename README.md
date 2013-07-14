JSON Mask
=========

<img src="/logo.png" align="right" />

Keep only the parts of a JS object that you need, by using a simple, query-string-friendly DSL.
This is the same language that the Google APIs use in the `?fields=` query-string to generate
[partial responses](https://developers.google.com/+/api/#partial-responses).

Example
-------

Specify the fields you want to keep:
```js
var fields = 'url,object(content,attachments/url)'
```

From this original object:
```js
var originalObj = {
  id: 'z12gtjhq3qn2xxl2o224exwiqruvtda0i',
  url: 'https://plus.google.com/102817283354809142195/posts/F97fqZwJESL',
  object: {
    objectType: 'note',
    content: 'A picture... of a space ship... launched from earth 40 years ago.'
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


Partial Responses Example
-------------------------

Here's another example of using `json-mask` to implement the
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

Get data:
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


License
-------

MIT. See LICENSE
