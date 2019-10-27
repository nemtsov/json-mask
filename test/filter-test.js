/* global describe, it */

var filter = require('../lib/filter')
var assert = require('assert')
var compiledMask
var object
var expected

// a,b(d/*/z,b(g)),c
compiledMask = {
  a: { type: 'object' },
  b: {
    type: 'array',
    properties: {
      d: {
        type: 'object',
        properties: {
          '*': {
            type: 'object',
            properties: {
              z: { type: 'object' }
            }
          }
        }
      },
      b: {
        type: 'array',
        properties: {
          g: { type: 'object' }
        }
      }
    }
  },
  c: { type: 'object' }
}

object = {
  a: 11,
  n: 0,
  b: [{
    d: { g: { z: 22 }, b: 34, c: { a: 32 } },
    b: [{ z: 33 }],
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
      },
      c: {}
    },
    b: [{}]
  }],
  c: 44
}

describe('filter', function () {
  it('should filter object for a compiled mask', function () {
    assert.deepStrictEqual(filter(object, compiledMask), expected)
  })
})
