var util = require('./util')
var TERMINALS = { ',': 1, '/': 2, '(': 3, ')': 4 }

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

function compile (text) {
  if (!text) return null
  return parse(scan(text))
}

function scan (text) {
  var i = 0
  var len = text.length
  var tokens = []
  var name = ''
  var ch

  function maybePushName () {
    if (!name) return
    tokens.push({ tag: '_n', value: name })
    name = ''
  }

  for (; i < len; i++) {
    ch = text.charAt(i)
    if (TERMINALS[ch]) {
      maybePushName()
      tokens.push({ tag: ch })
    } else {
      name += ch
    }
  }
  maybePushName()

  return tokens
}

function parse (tokens) {
  return _buildTree(tokens, {}, [])
}

function _buildTree (tokens, parent, tagStack) {
  debugger
  console.log('\nTOKENS: %j\nPARENT: %j\n STACK: %j', tokens, parent, tagStack)

  var props = {}
  var token
  // var peek

  while ((token = tokens.shift())) {
    console.log('     TOKEN: %j', token)

    switch (token.tag) {
      case '_n':
        token.type = 'object'
        token.properties = _buildTree(tokens, token, tagStack)
        break
      case ',':
        return props
      case '/':
        continue
    }

    _addToken(token, props)
  }

  return props
}

/*
if (token.tag === '_n') {
  token.type = 'object'
  token.properties = _buildTree(tokens, token, tagStack)
  _addToken(token, props)
  return props

  // exit if in object tagStack
  // peek = tagStack[tagStack.length - 1]
  // if (peek === '/') {
  //   tagStack.pop()
  //   _addToken(token, props)
  //   return props
  // }
} else if (token.tag === ',') {
  return props
} else if (token.tag === '(') {
  tagStack.push(token.tag)
  parent.type = 'array'
  continue
} else if (token.tag === ')') {
  tagStack = tagStack.slice(0, tagStack.lastIndexOf(')'))
  return props
} else if (token.tag === '/') {
  tagStack.push(token.tag)
  continue
}
*/

function _addToken (token, props) {
  props[token.value] = { type: token.type }
  if (!util.isEmpty(token.properties)) {
    props[token.value].properties = token.properties
  }
}
