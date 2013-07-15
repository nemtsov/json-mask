var filter = require('../lib/filter')
  , assert = require('assert')
  , compiledMask
  , object
  , expected

//a,b(d/*/z,b(g)),c
compiledMask = {
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
  },
  c: {type: 'object'}
}

object = {
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

expected = {
  a: 11,
  b: [{
    d: {
      g: {
        z: 22
      }
    }
  }],
  c: 44
}

describe('filter', function () {
  it('should filter object for a compiled mask', function () {
    assert.deepEqual(filter(object, compiledMask), expected)
  })
})
