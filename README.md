# JSON Mask [![Build Status](https://github.com/nemtsov/json-mask/actions/workflows/node.js.yml/badge.svg)](https://github.com/nemtsov/json-mask/actions/workflows/node.js.yml) [![NPM version](https://img.shields.io/npm/v/json-mask.svg)](https://www.npmjs.com/package/json-mask) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

<img src="https://raw.github.com/nemtsov/json-mask/master/logo.png" align="right" width="267px" />

This is a tiny language and an engine for selecting specific parts of a JS object, hiding/masking the rest.

```js
var mask = require('json-mask');
mask({ p: { a: 1, b: 2 }, z: 1 }, 'p/a,z'); // {p: {a: 1}, z: 1}
```

The main difference between JSONPath / JSONSelect and this engine is that JSON Mask
**preserves the structure of the original input object**.
Instead of returning an array of selected sub-elements (e.g. `[{a: 1}, {z: 1}]` from example above),
it filters-out the parts of the object that you don't need,
keeping the structure unchanged: `{p: {a: 1}, z: 1}`.

This is important because JSON Mask was designed with HTTP resources in mind,
the structure of which I didn't want to change after the unwanted fields
were masked / filtered.

If you've used the Google APIs, and provided a `?fields=` query-string to get a
[Partial Response](https://developers.google.com/gdata/docs/2.0/reference#PartialResponse), you've
already used this language. The desire to have partial responses in
my own Node.js-based HTTP services was the reason I wrote JSON Mask.

_For [express](http://expressjs.com/) users, there's an
[express-partial-response](https://github.com/nemtsov/express-partial-response) middleware.
It will integrate with your existing services with no additional code
if you're using `res.json()` or `res.jsonp()`. And if you're already using [koa](https://github.com/koajs/koa.git)
check out the [koa-json-mask](https://github.com/nemtsov/koa-json-mask) middleware._

This library has no dependencies. It works in Node as well as in the browser.

**Note:** the 1.5KB (gz), or 4KB (uncompressed) browser build is in the `/build` folder.

## Syntax

The syntax is loosely based on XPath:

- `a,b,c` comma-separated list will select multiple fields
- `a/b/c` path will select a field from its parent
- `a(b,c)` sub-selection will select many fields from a parent
- `a/*/c` the star `*` wildcard will select all items in a field

Take a look at `test/index-test.js` for examples of all of these and more.

## Grammar

```
     Props ::= Prop | Prop "," Props
      Prop ::= Object | Array
    Object ::= NAME | NAME "/" Prop
     Array ::= NAME "(" Props ")"
      NAME ::= ? all visible characters except "\" ? | EscapeSeq | Wildcard
  Wildcard ::= "*"
 EscapeSeq ::= "\" ? all visible characters ?
```

## Examples

Identify the fields you want to keep:

```js
var fields = 'url,object(content,attachments/url)';
```

From this sample object:

```js
var originalObj = {
  id: 'z12gtjhq3qn2xxl2o224exwiqruvtda0i',
  url: 'https://plus.google.com/102817283354809142195/posts/F97fqZwJESL',
  object: {
    objectType: 'note',
    content:
      'A picture... of a space ship... launched from earth 40 years ago.',
    attachments: [
      {
        objectType: 'image',
        url: 'http://apod.nasa.gov/apod/ap110908.html',
        image: { height: 284, width: 506 }
      }
    ]
  },
  provider: { title: 'Google+' }
};
```

Here's what you'll get back:

```js
var expectObj = {
  url: 'https://plus.google.com/102817283354809142195/posts/F97fqZwJESL',
  object: {
    content:
      'A picture... of a space ship... launched from earth 40 years ago.',
    attachments: [
      {
        url: 'http://apod.nasa.gov/apod/ap110908.html'
      }
    ]
  }
};
```

Let's test that:

```js
var mask = require('json-mask');
var assert = require('assert');

var maskedObj = mask(originalObj, fields);
assert.deepEqual(maskedObj, expectObj);
```

### Escaping

It is also possible to get keys that contain `,*()/` using `\` (backslash) as escape character.

```json
{
  "metadata": {
    "labels": {
      "app.kubernetes.io/name": "mysql",
      "location": "WH1"
    }
  }
}
```

You can filter out the location property by `metadata(labels(app.kubernetes.io\/name))` mask.

NOTE: In [JavaScript String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String#escape_sequences) you must escape backslash with another backslash:
```js
var fields = 'metadata(labels(app.kubernetes.io\\/name))'
```

### Partial Responses Server Example

Here's an example of using `json-mask` to implement the
[Google API Partial Response](https://developers.google.com/gdata/docs/2.0/reference#PartialResponse)

```js
var http = require('http');
var url = require('url');
var mask = require('json-mask');
var server;

server = http.createServer(function(req, res) {
  var fields = url.parse(req.url, true).query.fields;
  var data = {
    firstName: 'Mohandas',
    lastName: 'Gandhi',
    aliases: [
      {
        firstName: 'Mahatma',
        lastName: 'Gandhi'
      },
      {
        firstName: 'Bapu'
      }
    ]
  };
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(mask(data, fields)));
});

server.listen(4000);
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

## Command Line Interface - CLI

When installed globally using `npm i -g json-mask` you can use it like:

`json-mask "<fields>" <input> [<output>]`

### Examples

Stream from online resource:

`curl https://api.myjson.com/bins/krrxw | json-mask "url,object(content,attachments/url)"`

Read from file and write to output file:

`json-mask "url,object(content,attachments/url)" input.json > output.json`

Read from file and print redirect to file:

`json-mask "url,object(content,attachments/url)" input.json > output.json`

## CDN

**unpkg**

- `https://unpkg.com/json-mask/build/jsonMask.js`
- `https://unpkg.com/json-mask/build/jsonMask.min.js`

## License

[MIT](/LICENSE)
