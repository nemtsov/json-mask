/* global describe, it */
const assert = require('assert').strict
const path = require('path')
const { exec, execFile, execFileSync } = require('child_process')

const catOnWindows = command =>
  process.platform === 'win32' ? command.replace('cat ', 'type ') : command

function cli (command, args, sync) {
  return new Promise(resolve => {
    if (sync) {
      try {
        // Don't pipe the stderr to this process by default
        // https://nodejs.org/api/child_process.html#child_process_child_process_execfilesync_file_args_options
        const stdout = execFileSync(command, args, { stdio: 'pipe' }).trim()
        resolve({
          exitCode: 0,
          stdout
        })
      } catch (error) {
        resolve({
          exitCode: error.status,
          stdout: error.stdout.toString().trim(),
          stderr: error.stderr.toString().trim()
        })
      }
      return
    }

    const handler = (error, stdout, stderr) => {
      if (error) {
        resolve({
          error,
          exitCode: error.code,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        })
      } else {
        resolve({
          exitCode: 0,
          json: JSON.parse(stdout)
        })
      }
    }
    if (args) {
      // Remove stdin for child process or they will try to read from it until
      // we call stdin.end() from here.
      // https://github.com/nodejs/node/issues/2339#issuecomment-279235982
      execFile(command, args, { stdio: ['ignore', 'pipe', 'pipe'] }, handler)
    } else {
      exec(catOnWindows(command), handler)
    }
  })
}

const CLI_BIN = path.join(__dirname, '..', 'bin', 'json-mask.js')
const FIXTURE_PATH = path.join(__dirname, 'fixture', 'activities.json')

var tests = [
  {
    it: 'should show fields missing error and usage information when no arguments specified',
    exec: {
      command: 'node',
      args: [CLI_BIN]
    },
    e (result) {
      assert.strictEqual(result.exitCode, 1, 'exit code must be 1')
      assert.strictEqual(result.stderr, 'Fields argument missing')
      assert.ok(/usage:/i.test(result.stdout))
    }
  },
  {
    it: 'should show usage information when no file specified',
    exec: {
      command: 'node',
      args: [CLI_BIN, 'mask'],
      sync: true
    },
    e (result) {
      assert.strictEqual(result.exitCode, 1, 'exit code must be 1')
      assert.strictEqual(result.stderr, 'Either pipe input into json-mask or specify a file as second argument')
      assert.ok(/usage:/i.test(result.stdout))
    }
  },
  {
    it: 'should read a file given as first argument',
    exec: {
      command: 'node',
      args: [CLI_BIN, 'kind', FIXTURE_PATH]
    },
    e: {
      exitCode: 0,
      json: {
        kind: 'plus#activity'
      }
    }
  },
  {
    it: 'should error with invalid JSON file input',
    exec: {
      command: 'node',
      args: [CLI_BIN, 'object', path.join(__dirname, 'fixture', 'invalid.json')]
    },
    e (result) {
      assert.strictEqual(result.exitCode, 1, 'exit code must be 1')
      assert.strictEqual(result.stderr, 'Unexpected token } in JSON at position 41')
      assert.ok(/usage:/i.test(result.stdout))
    }
  },
  {
    it: 'should choke on empty input stream',
    exec: `echo '' | node ${CLI_BIN}`,
    mask: 's',
    e (result) {
      assert.strictEqual(result.exitCode, 1, 'exit code must be 1')
      assert.strictEqual(result.stderr, 'Unexpected end of JSON input')
      assert.ok(/usage:/i.test(result.stdout))
    }
  },
  {
    exec: `echo '{"s":"foo","n":666}' | node ${CLI_BIN}`,
    mask: 's',
    e: {
      exitCode: 0,
      json: {
        s: 'foo'
      }
    }
  },
  {
    exec: `cat ${FIXTURE_PATH} | node ${CLI_BIN}`,
    mask: 'kind',
    e: {
      exitCode: 0,
      json: {
        kind: 'plus#activity'
      }
    }
  }, {
    exec: `cat ${FIXTURE_PATH} | node ${CLI_BIN}`,
    mask: 'object(objectType)',
    e: {
      exitCode: 0,
      json: {
        object: { objectType: 'note' }
      }
    }
  }, {
    exec: `cat ${FIXTURE_PATH} | node ${CLI_BIN}`,
    mask: 'url,object(content,attachments/url)',
    e: {
      exitCode: 0,
      json: {
        url: 'https://plus.google.com/102817283354809142195/posts/F97fqZwJESL',
        object: {
          content: 'Congratulations! You have successfully fetched an explicit public activity. The attached video is your reward. :)',
          attachments: [{ url: 'http://www.youtube.com/watch?v=dQw4w9WgXcQ' }]
        }
      }
    }
  }
]

describe('cli', function () {
  var result, i
  for (i = 0; i < tests.length; i++) {
    (function (test) {
      it(test.it || 'should mask with ' + test.mask + ' in test #' + i, async function () {
        const command = (test.exec.command || test.exec) + (test.mask ? ` "${test.mask}"` : '')
        result = await cli(command, test.exec.args, test.exec.sync)
        const expect = typeof test.e === 'function' ? test.e : assert.deepStrictEqual
        expect(result, test.e)
      })
    }(tests[i]))
  }
})
