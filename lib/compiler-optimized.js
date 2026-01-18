var util = require('./util')
var TERMINALS = { ',': 1, '/': 2, '(': 3, ')': 4 }
var ESCAPE_CHAR = '\\'
var WILDCARD_CHAR = '*'

module.exports = compile

/**
 *  Compiler (OPTIMIZED - O(n) instead of O(n²))
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
  var ch

  function maybePushName () {
    if (!name) return
    tokens.push({ tag: '_n', value: name })
    name = ''
  }

  for (; i < len; i++) {
    ch = text.charAt(i)
    if (ch === ESCAPE_CHAR) {
      i++
      if (i >= len) {
        name += ESCAPE_CHAR
        break
      }
      ch = text.charAt(i)
      name += ch === WILDCARD_CHAR ? ESCAPE_CHAR + WILDCARD_CHAR : ch
    } else if (TERMINALS[ch]) {
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
  var result = _buildTree(tokens, {}, 0)
  return result.props
}

/**
 * OPTIMIZED: Index-based traversal instead of Array.shift()
 *
 * Previously: tokens.shift() was called in a loop, causing O(n²) complexity
 * - shift() removes first element and shifts all remaining elements (O(n))
 * - Called n times in the loop = O(n²) total
 *
 * Now: Use index to track position, advancing through array without mutation
 * - Reading tokens[index] is O(1)
 * - Advancing index is O(1)
 * - Total complexity: O(n)
 */
function _buildTree (tokens, parent, index) {
  var props = {}
  var token
  var result

  while (index < tokens.length) {
    token = tokens[index++]

    if (token.tag === '_n') {
      token.type = 'object'
      result = _buildTree(tokens, token, index)
      token.properties = result.props
      index = result.index

      if (parent.hasChild) {
        _addToken(token, props)
        return { props: props, index: index }
      }
    } else if (token.tag === ',') {
      return { props: props, index: index }
    } else if (token.tag === '(') {
      parent.type = 'array'
      continue
    } else if (token.tag === ')') {
      return { props: props, index: index }
    } else if (token.tag === '/') {
      parent.hasChild = true
      continue
    }
    _addToken(token, props)
  }

  return { props: props, index: index }
}

function _addToken (token, props) {
  var prop = { type: token.type }

  if (token.value === WILDCARD_CHAR) prop.isWildcard = true
  else if (token.value === ESCAPE_CHAR + WILDCARD_CHAR) token.value = WILDCARD_CHAR

  if (!util.isEmpty(token.properties)) {
    prop.properties = token.properties
  }

  props[token.value] = prop
}
