var compile = require('../lib/compiler')
  , assert = require('assert')

assert.deepEqual(compile('a'), {
    a: {type: 'object'}
})

assert.deepEqual(compile('a/*/c'), {
    a: {type: 'object', properties: {
      '*': {type: 'object', properties: {
        c: {type: 'object'}
      }}
    }}
})

assert.deepEqual(compile('a,b,c'), {
    a: {type: 'object'}
  , b: {type: 'object'}
  , c: {type: 'object'}
})

assert.deepEqual(compile('a,b(d/*/g,b),c'), {
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
})

console.log('ok')
