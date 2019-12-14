#!/usr/bin/env node
const mask = require('../')

function usage (error) {
  error && console.error(error.message)
  console.log('Usage: json-mask <fields> [input.json]')
  console.log('Examples:')
  console.log('  json-mask "url,object(content,attachments/url)" input.json')
  console.log('  cat input.json | json-mask "url,object(content,attachments/url)"')
  console.log('  curl https://api.myjson.com/bins/krrxw | json-mask "url,object(content,attachments/url)"')
  process.exit(error ? 1 : 0)
}

function pipeInput() {
  return new Promise((resolve, reject) => {
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    let data = ''
    
    process.stdin.on('data', chunk => {
      data += chunk
    })
    
    process.stdin.on('end', () => {
      resolve(data)
    })
    
    process.stdin.on('error', reject)
  })
}

function readInputFile (inputFile, resolve, reject) {
  const fs = require('fs').promises
  const path = require('path')
  return fs.readFile(path.resolve(inputFile), { encoding: 'UTF-8' })
}

function getInput (inputFile) {
  if (!process.stdin.isTTY) {
    return pipeInput()
  } else if (inputFile) {
    return readInputFile(inputFile)
  } else {
    Promise.reject(new Error('Either pipe input into json-mask or specify a file as second argument'))
  }
}

const parseInput = input => JSON.parse(input)

const maskInput = fields => {
  if (!fields) {
    throw new Error('Fields argument missing')
  }
  return input => mask(input, fields)
}

const writeOutput = output => output && console.log(JSON.stringify(output))

/**
 * Runs the command line filter
 *
 * @param {String} fields to mask
 * @param {String} inputFilePath absolute or relative path for input file to read
 */
function run (fields, inputFilePath) {
  return getInput(inputFilePath)
    .then(parseInput)
    .then(maskInput(fields))
}

run(process.argv[2], process.argv[3])
  .then(writeOutput)
  .catch(usage)
