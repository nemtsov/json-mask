var util = require('./util')
var TERMINALS = { ',': 1, '/': 2, '(': 3, ')': 4 }
var ESCAPE_CHAR = '\\'
var WILDCARD_CHAR = '*'

module.exports = compile

/**
 *  Compiler
 *
 *  Grammar:
 *     Props ::= Prop | Prop "," Props
 *      Prop ::= Object | Array
 *    Object ::= NAME | NAME "/" Prop
 *     Array ::= NAME "(" Props ")"
 *      NAME ::= ? all visible characters except "\" ? | EscapeSeq | Wildcard
 *  Wildcard ::= "*"
 * EscapeSeq ::= "\" ? all visible characters ?
 *
 *  Examples:
 *    a
 *    a,d,g
 *    a/b/c
 *    a(b)
 *    ob,a(k,z(f,g/d)),d
 *    a\/b/c
 */

function compile (text) {
  if (!text) return null
  return parse(scan(text))
}

function scan (text) {
  var i = 0
  var len = text.length
  var tokens = []
  var name = ''
  var escape = false
  var ch

  function maybePushName () {
    if (!name) return
    tokens.push({ tag: '_n', value: name })
    name = ''
  }

  for (; i < len; i++) {
    ch = text.charAt(i)
    if (ch === ESCAPE_CHAR && !escape) {
      escape = true
      continue
    }
    if (TERMINALS[ch] && !escape) {
      maybePushName()
      tokens.push({ tag: ch })
    } else if (ch === WILDCARD_CHAR && !name.length && !escape) {
      tokens.push({ tag: ch, value: ch })
    } else {
      name += ch
    }
    escape = false
  }
  maybePushName()

  return tokens
}

function parse (tokens) {
  return _buildTree(tokens, {})
}

function _buildTree (tokens, parent) {
  var props = {}
  var token

  while ((token = tokens.shift())) {
    if (token.tag === '_n' || token.tag === '*') {
      token.type = 'object'
      token.properties = _buildTree(tokens, token)
      if (parent.hasChild) {
        _addToken(token, props)
        return props
      }
    } else if (token.tag === ',') {
      return props
    } else if (token.tag === '(') {
      parent.type = 'array'
      continue
    } else if (token.tag === ')') {
      return props
    } else if (token.tag === '/') {
      parent.hasChild = true
      continue
    }
    _addToken(token, props)
  }

  return props
}

function _addToken (token, props) {
  var prop = { type: token.type }
  if (!util.isEmpty(token.properties)) {
    prop.properties = token.properties
  }
  if (token.tag === WILDCARD_CHAR) {
    prop.filter = true
  }
  props[token.value] = prop
}
