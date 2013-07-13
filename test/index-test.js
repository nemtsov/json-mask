var svc = require('../lib')
  , assert = require('assert')

var mask = 'a,b(d/*/z,b(g)),c'

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

assert.deepEqual(svc(obj, mask), {
  a: 11,
  b: [{
    d: {
      g: {
        z: 22
      }
    }
  }],
  c: 44
})

console.log('ok')
