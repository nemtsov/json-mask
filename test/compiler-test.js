/* global describe, it */

var compile = require('../lib/compiler')
var assert = require('assert')
var util = require('../lib/util')
var tests

tests = {
  a: { a: { type: 'object' } },
  'a,b,c': {
    a: { type: 'object' },
    b: { type: 'object' },
    c: { type: 'object' }
  },
  'a/*/c': {
    a: {
      type: 'object',
      properties: {
        '*': {
          type: 'object',
          filter: true,
          properties: {
            c: { type: 'object' }
          }
        }
      }
    }
  },
  'a,b(d/*/g,b),c': {
    a: { type: 'object' },
    b: {
      type: 'array',
      properties: {
        d: {
          type: 'object',
          properties: {
            '*': {
              type: 'object',
              filter: true,
              properties: {
                g: { type: 'object' }
              }
            }
          }
        },
        b: { type: 'object' }
      }
    },
    c: { type: 'object' }
  },
  'a(b/c,e)': {
    a: {
      type: 'array',
      properties: {
        b: {
          type: 'object',
          properties: {
            c: { type: 'object' }
          }
        },
        e: { type: 'object' }
      }
    }
  },
  'a(b/c),e': {
    a: {
      type: 'array',
      properties: {
        b: {
          type: 'object',
          properties: {
            c: { type: 'object' }
          }
        }
      }
    },
    e: { type: 'object' }
  },
  'a(b/c/d),e': {
    a: {
      type: 'array',
      properties: {
        b: {
          type: 'object',
          properties: {
            c: {
              type: 'object',
              properties: {
                d: { type: 'object' }
              }
            }
          }
        }
      }
    },
    e: { type: 'object' }
  },
  'a(b/g(c)),e': {
    a: {
      type: 'array',
      properties: {
        b: {
          type: 'object',
          properties: {
            g: {
              type: 'array',
              properties: {
                c: {
                  type: 'object'
                }
              }
            }
          }
        }
      }
    },
    e: { type: 'object' }
  },
  'a\\/b\\/c': {
    'a/b/c': {
      type: 'object'
    }
  },
  'a\\(b\\)c': {
    'a(b)c': {
      type: 'object'
    }
  },
  // escaped b (`\b`) in our language resolves to `b` character.
  'a\\bc': {
    abc: {
      type: 'object'
    }
  },
  '\\*': {
    '*': {
      type: 'object'
    }
  },
  '*': {
    '*': {
      type: 'object',
      filter: true
    }
  },
  '*(a,b,\\*,\\(,\\),\\,)': {
    '*': {
      type: 'array',
      filter: true,
      properties: {
        a: { type: 'object' },
        b: { type: 'object' },
        '*': { type: 'object' },
        '(': { type: 'object' },
        ')': { type: 'object' },
        ',': { type: 'object' }
      }
    }
  },
  '\\\\': {
    '\\': {
      type: 'object'
    }
  },
  'foo*bar': {
    'foo*bar': {
      type: 'object'
    }
  },
  // mask `\n`, should not resolve in a new line,
  // because we simply escape "n" character which has no meaning in our language
  '\\n': {
    n: {
      type: 'object'
    }
  },
  'multi\nline': {
    'multi\nline': {
      type: 'object'
    }
  }
}

describe('compiler', function () {
  for (var name in tests) {
    if (!util.has(tests, name)) continue
    (function (name, test) {
      it('should compile ' + name, function () {
        assert.deepStrictEqual(compile(name), test)
      })
    }(name, tests[name]))
  }
})
