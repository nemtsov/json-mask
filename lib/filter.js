var util = require('./util')

module.exports = filter

function filter(obj, compiledMask) {
  return _properties(obj, compiledMask)
}

function _properties(obj, mask) {
  var maskedObj = {}, key, value, ret, retKey
  if (!obj || !mask) return obj
  for (key in mask) {
    if (!util.has(mask, key)) continue
    value = mask[key]
    ret = null
    if ('object' === value.type) {
      if ('*' === key) {
        ret = _objectAll(obj, value.properties)
        for (retKey in ret) {
          if (!util.has(ret, retKey)) continue
          maskedObj[retKey] = ret[retKey]
        }
        ret = null
      } else {
        ret = _object(obj, key, value.properties)
      }
    } else if ('array' === value.type) {
      ret = _array(obj, key, value.properties)
    }
    if (ret) maskedObj[key] = ret
  }
  return !util.isEmpty(maskedObj) ? maskedObj : null
}

function _objectAll(obj, mask) {
  var ret = {}, key, value
  for (key in obj) {
    if (!util.has(obj, key)) continue
    value = _object(obj, key, mask)
    if (value) ret[key] = value
  }
  return ret
}

function _object(obj, key, mask) {
  var value = obj[key]
  if (util.isArray(value)) return _array(obj, key, mask)
  return mask ? _properties(value, mask) : value
}

function _array(object, key, mask) {
  var ret = [], arr = object[key]
    , i, l, obj, maskedObj
  if (util.isEmpty(arr)) return arr
  if (!util.isArray(arr)) return _properties(arr, mask)
  for (i = 0, l = arr.length; i < l; i++) {
    obj = arr[i]
    maskedObj = _properties(obj, mask)
    if (maskedObj) ret.push(maskedObj)
  }
  return ret.length ? ret : null
}
