var compile = require('./compiler').compile
  , filter = require('./filter')

module.exports = function (obj, mask) {
  return filter(obj, compile(mask))
}
