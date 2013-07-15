var util = require('./util')
  , TERMINALS = {',': 1, '/': 2, '(': 3, ')': 4}

module.exports = compile

/**
 *  Compiler
 *
 *  Grammar:
 *     Props ::= Prop | Prop "," Props
 *      Prop ::= Object | Array
 *    Object ::= NAME | NAME "/" Object
 *     Array ::= NAME "(" Props ")"
 *      NAME ::= ? all visible characters ?
 *
 *  Examples:
 *    a
 *    a,d,g
 *    a/b/c
 *    a(b)
 *    ob,a(k,z(f,g/d)),d
 */

function compile(text) {
  if (!text) return null
  return parse(scan(text))
}

function scan(text) {
  var i = 0
    , len = text.length
    , tokens = []
    , name = ''
    , ch

  function maybePushName() {
    if (!name) return
    tokens.push({tag: '_n', value: name})
    name = ''
  }

  for (; i < len; i++) {
    ch = text.charAt(i)
    if (TERMINALS[ch]) {
      maybePushName()
      tokens.push({tag: ch})
    } else {
      name += ch
    }
  }
  maybePushName()

  return tokens
}

function parse(tokens) {
  return _buildTree(tokens, {}, [])
}

function _buildTree(tokens, parent, stack) {
  var props = {}
    , openTag
    , token
    , peek

  while (token = tokens.shift()) {
    if ('_n' === token.tag) {
      token.type = 'object'
      token.properties = _buildTree(tokens, token, stack)
      // exit if in object stack
      peek = stack[stack.length-1]
      if (peek && ('/' == peek.tag)) {
        stack.pop()
        _addToken(token, props)
        return props
      }
    } else if (',' === token.tag) {
      return props
    } else if ('(' === token.tag) {
      stack.push(token)
      parent.type = 'array'
      continue
    } else if (')' === token.tag) {
      openTag = stack.pop(token)
      return props
    } else if ('/' === token.tag) {
      stack.push(token)
      continue
    }
    _addToken(token, props)
  }

  return props
}

function _addToken(token, props) {
  props[token.value] = {type: token.type}
  if (!util.isEmpty(token.properties)) {
    props[token.value].properties = token.properties
  }
}
