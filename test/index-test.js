var mask = require('../lib')
  , assert = require('assert')
  , fixture = require('./fixture/activities')
  , tests

tests = [{
    o: {a: 1}
  , m: ''
  , e: {a: 1}
}, {
    o: {a: 1, b: 1}
  , m: 'a'
  , e: {a: 1}
}, {
    o: {a: 1, b: 1, c: 1}
  , m: 'a,b'
  , e: {a: 1, b: 1}
}, {
    o: {obj: {s: 1, t: 2}, b: 1}
  , m: 'obj/s'
  , e: {obj: {s: 1}}
}, {
    o: {arr: [{s: 1, t: 2}, {s: 2, t: 3}], b: 1}
  , m: 'arr/s'
  , e: {arr: [{s: 1}, {s: 2}]}
}, {
    o: {a: {s: {g: 1, z: 1}}, t: 2, b: 1}
  , m: 'a/s/g,b'
  , e: {a: {s: {g: 1}}, b: 1}
}, {
    o: {a: {
           s: {g: 3}
         , t: {g: 4}
         , u: {z: 1}
       }, b: 1}
  , m: 'a/*/g'
  , e: {a: {
           s: {g: 3}
         , t: {g: 4}
       }}
}, {
    o: {a: {
           s: {g: 3}
         , t: {g: 4}
         , u: {z: 1}
       }, b: 3}
  , m: 'a/*'
  , e: {a: {
           s: {g: 3}
         , t: {g: 4}
         , u: {z: 1}
       }}
}, {
    o: {a: [{g: 1, d: 2}, {g: 2, d: 3}]}
  , m: 'a(g)'
  , e: {a: [{g: 1}, {g: 2}]}
}, {
    o: {b: [{d: {g: {z: 22}, b: 34}}]}
  , m: 'b(d/*/z)'
  , e: {b: [{d: {g: {z: 22}}}]
    }
}, {
    o: {url: 1, id: '1', obj: {url: 'h', a: [{url: 1, z: 2}], c: 3}}
  , m: 'url,obj(url,a/url)'
  , e: {url: 1, obj: {url: 'h', a: [{url: 1}]}}
}, {
    o: fixture
  , m: 'kind'
  , e: {kind: 'plus#activity'}
}, {
    o: fixture
  , m: 'object(objectType)'
  , e: {object: {objectType: 'note'}}
}, {
    o: fixture
  , m: 'url,object(content,attachments/url)'
  , e: {
        url: 'https://plus.google.com/102817283354809142195/posts/F97fqZwJESL'
      , object: {
            content: 'Congratulations! You have successfully fetched an explicit public activity. The attached video is your reward. :)'
          , attachments: [{url: 'http://www.youtube.com/watch?v=dQw4w9WgXcQ'}]
        }
    }
}]

var result
for (var i = 0; i < tests.length; i++) {
  //if (i !== 4) continue
  try {
    result = mask(tests[i].o, tests[i].m)
    assert.deepEqual(result, tests[i].e)
  } catch (e) {
    console.error('\nFailed: ' + tests[i].m)
    console.log('\nReceived: \n' + JSON.stringify(result, true, 2))
    console.log('\nExpected: \n' + JSON.stringify(tests[i].e, true, 2))
    throw e
  }
}

console.log('ok')
