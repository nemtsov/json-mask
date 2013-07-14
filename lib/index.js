var compile = require('./compiler')
  , filter = require('./filter')

function mask(obj, mask) {
  if (!mask) return obj
  return filter(obj, compile(mask))
}

mask.compile = compile
mask.filter = filter

module.exports = mask
