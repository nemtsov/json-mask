var compile = require('./compiler')
var filter = require('./filter')

function mask (obj, mask) {
  return filter(obj, compile(mask)) || null
}

mask.compile = compile
mask.filter = filter

module.exports = mask
