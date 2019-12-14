/* global describe, it */
var assert = require('assert').strict
const { exec } = require('child_process')

function cli (command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error)
      } else {
        resolve({
          exitCode: 0,
          out: JSON.parse(stdout)
        })
      }
    })
  })
}

var tests = [
  /* {
  c: `node ${__dirname}/../lib/cli.js "kind" ${__dirname}/fixture/activities.json`,
  e: {
    exitCode: 0,
    out: {
      kind: 'plus#activity'
    }
  }
  }, */
  {
    c: `cat ${__dirname}/fixture/activities.json | node ${__dirname}/../bin/json-mask.js "kind"`,
    e: {
      exitCode: 0,
      out: {
        kind: 'plus#activity'
      }
    }
  }, {
    c: `cat ${__dirname}/fixture/activities.json | node ${__dirname}/../bin/json-mask.js "object(objectType)"`,
    e: {
      exitCode: 0,
      out: {
        object: { objectType: 'note' }
      }
    }
  }, {
    c: `cat ${__dirname}/fixture/activities.json | node ${__dirname}/../bin/json-mask.js "url,object(content,attachments/url)"`,
    e: {
      exitCode: 0,
      out: {
        url: 'https://plus.google.com/102817283354809142195/posts/F97fqZwJESL',
        object: {
          content: 'Congratulations! You have successfully fetched an explicit public activity. The attached video is your reward. :)',
          attachments: [{ url: 'http://www.youtube.com/watch?v=dQw4w9WgXcQ' }]
        }
      }
    }
  }]

describe('cli', function () {
  var result, i
  for (i = 0; i < tests.length; i++) {
    (function (test) {
      it('should mask with ' + test.c + ' in test #' + i, async function () {
        result = await cli(test.c)
        assert.deepStrictEqual(result, test.e)
      })
    }(tests[i]))
  }
})
