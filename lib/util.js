var ObjProto = Object.prototype

exports.isEmpty = isEmpty
exports.isArray = Array.isArray || isArray
exports.has = has

function isEmpty(obj) {
  if (obj == null) return true
  if (isArray(obj) ||
     ('string' === typeof obj)) return (0 === obj.length)
  for (var key in obj) if (has(obj, key)) return false
  return true
}

function isArray(obj) {
  return ObjProto.toString.call(obj) == '[object Array]'
}

function has(obj, key) {
  return ObjProto.hasOwnProperty.call(obj, key)
}
