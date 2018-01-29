/* global describe, it */

var filter = require('../lib/filter')
var assert = require('assert')
var compiledMask
var object
var expected

// a,b(f/*/z,b(g)),c,d(*,-a),e(-a,*)
compiledMask = {
  a: {type: 'object'},
  b: {
    type: 'array',
    properties: {
      f: {
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
  c: {type: 'object'},
  d: {
    type: 'object',
    properties: {
      '*': {type: 'object'},
      '-a': {type: 'object'}
    }
  },
  e: {
    type: 'object',
    properties: {
      '-a': {type: 'object'},
      '*': {type: 'object'}
    }
  }
}

object = {
  a: 11,
  n: 0,
  b: [{
    f: {g: {z: 22}, b: 34, c: {a: 32}},
    b: [{z: 33}],
    k: 99
  }],
  c: 44,
  d: {
    a: 1,
    b: 2
  },
  e: {
    a: 1,
    b: 2,
    c: 3
  },
  g: 99
}

expected = {
  a: 11,
  b: [{
    f: {
      g: {
        z: 22
      },
      c: {}
    },
    b: [{}]
  }],
  c: 44,
  d: {
    b: 2
  },
  e: {
    b: 2,
    c: 3
  }
}

describe('filter', function () {
  it('should filter object for a compiled mask', function () {
    assert.deepEqual(filter(object, compiledMask), expected)
  })
})
