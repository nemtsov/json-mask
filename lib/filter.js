module.exports = function (obj, mask) {
  return _properties(obj, mask) || {}
}

function _properties(obj, mask) {
  if (!obj || !mask) return obj
  var maskedObj = {}, isEmpty = false
  Object.keys(mask).forEach(function (key) {
    var value = mask[key], ret
    if ('object' === value.type) {
      if ('*' === key) {
        ret = _objectAll(obj, value.properties)
        Object.keys(ret).forEach(function (retKey) {
          maskedObj[retKey] = ret[retKey]
        })
        ret = null
      } else {
        ret = _object(obj, key, value.properties)
      }
    } else if ('array' === value.type) {
      ret = _array(obj, key, value.properties)
    }
    if (ret) maskedObj[key] = ret
  })
  isEmpty = (0 === Object.keys(maskedObj).length)
  return !isEmpty ? maskedObj : null
}

function _objectAll(obj, mask) {
  var ret = {}
  Object.keys(obj).forEach(function (key) {
    var value = _object(obj, key, mask)
    if (value) ret[key] = value
  })
  return ret
}

function _object(obj, key, mask) {
  var value = obj[key]
  return mask ? _properties(value, mask) : value
}

function _array(obj, key, mask) {
  var ret = [], arr = obj[key]
  if (!Array.isArray(arr)) return null
  arr.forEach(function (obj) {
    var maskedObj = _properties(obj, mask)
    if (maskedObj) ret.push(maskedObj)
  })
  return ret.length ? ret : null
}
