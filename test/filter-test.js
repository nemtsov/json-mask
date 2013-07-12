var filter = require('../lib/filter')
  , assert = require('assert')

//a,b(d/*/z,b(g)),c

var mask = {
  a: {type: 'object'},
  b: {
    type: 'array',
    properties: {
      d: {
        type: 'object',
        properties: {
          '*': {
            type: 'object',
            properties: {
              z: {type: 'object'}
            }
          }
        }
      },
      b: {
        type: 'array',
        properties: {
          g: {type: 'object'}
        }
      }
    }
  }
}

var obj = {
  a: 11,
  n: 00,
  b: [{
    d: {g: {z: 22}, b: 34, c: {a: 32}},
    b: [{z: 33}],
    k: 99
  }],
  c: 44,
  g: 99
}

var maskedObj = filter(obj, mask)
assert.deepEqual(maskedObj, {
  a: 11,
  b: [{
    d: {
      g: {
        z: 22
      }
    }
 }]
})

console.log('ok')
//console.log(JSON.stringify(out, true, 2))
