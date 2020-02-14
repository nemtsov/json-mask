#!/usr/bin/env node
const mask = require('../lib')
const fs = require('fs')
const { promisify } = require('util')

const readFile = promisify(fs.readFile)
const missingInput = () => new Error('Either pipe input into json-mask or specify a file as second argument')

function usage (error) {
  if (error) console.error(error.message)
  console.log('Usage: json-mask <fields> [input.json]')
  console.log('Examples:')
  console.log('  json-mask "url,object(content,attachments/url)" input.json')
  console.log('  cat input.json | json-mask "url,object(content,attachments/url)"')
  console.log('  curl https://api.myjson.com/bins/krrxw | json-mask "url,object(content,attachments/url)"')
  process.exit(1)
}

function pipeInput () {
  return new Promise((resolve, reject) => {
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    let data = ''
    process.stdin.on('data', chunk => (data += chunk))
    process.stdin.on('end', () => data ? resolve(data) : reject(missingInput()))

    process.stdin.on('error', reject)
  })
}

function getInput (inputFilePath) {
  if (inputFilePath) return readFile(inputFilePath, { encoding: 'UTF-8' })
  if (!process.stdin.isTTY) return pipeInput()
  return Promise.reject(missingInput())
}

/**
 * Runs the command line filter
 *
 * @param {String} fields to mask
 * @param {String} inputFilePath absolute or relative path for input file to read
 */
async function run (fields, inputFilePath) {
  if (!fields) throw new Error('Fields argument missing')
  const input = await getInput(inputFilePath)
  const json = JSON.parse(input)
  const masked = mask(json, fields)
  console.log(JSON.stringify(masked))
}

run(process.argv[2], process.argv[3])
  .catch(usage)
