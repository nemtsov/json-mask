var compile = require('../lib/compiler')
  , assert = require('assert')
  , util = require('../lib/util')
  , tests

tests = {
    'a': {a: {type: 'object'}}
  , 'a,b,c': {
        a: {type: 'object'}
      , b: {type: 'object'}
      , c: {type: 'object'}
    }
  , 'a/*/c': {
        a: {type: 'object', properties: {
          '*': {type: 'object', properties: {
            c: {type: 'object'}
          }}
        }}
    }
  , 'a,b(d/*/g,b),c': {
        a: {type:'object'}
      , b: {type:'array', properties: {
            d: {type:'object', properties: {
              '*': {type:'object', properties: {
                  g: {type:'object'}
              }}
            }}
          , b: {type:'object'}
        }}
      , c: {type:'object'}
    }
}

describe('compiler', function () {
  for (var name in tests) {
    if (!util.has(tests, name)) continue
    (function (name, test) {
      it('should compile ' + name, function () {
        assert.deepEqual(compile(name), test)
      })
    }(name, tests[name]))
  }
})
