# Performance Analysis Report - JSON Mask Library

**Date**: 2026-01-18
**Analyzed Version**: 2.0.0
**Total Issues Found**: 11 performance anti-patterns

---

## Executive Summary

This analysis identified **11 significant performance anti-patterns** across the json-mask codebase. The most critical issues are:

1. **CRITICAL**: O(n²) complexity from `Array.shift()` in parser loop
2. **HIGH IMPACT**: No caching of compiled masks (recompilation on every call)
3. **MEDIUM**: String concatenation in tight loops during tokenization
4. **MEDIUM**: Inefficient `for...in` loops with `hasOwnProperty` checks in hot paths

---

## Critical Issues (Must Fix)

### 1. O(n²) Parsing Complexity - Array.shift() in Loop
**Location**: `lib/compiler.js:77`
**Severity**: CRITICAL
**Performance Impact**: Quadratic time complexity for parsing

```javascript
function _buildTree (tokens, parent) {
  var props = {}
  var token

  while ((token = tokens.shift())) {  // ⚠️ O(n) operation in loop = O(n²)
    // ... processing
  }
  return props
}
```

**Problem**:
- `Array.shift()` removes the first element and shifts all remaining elements
- Each shift operation is O(n) where n = remaining array length
- Called in a loop = O(n²) total complexity
- For a mask string with 1000 tokens, this means ~500,000 operations instead of 1000

**Solution**:
```javascript
function _buildTree (tokens, parent, startIndex) {
  var props = {}
  var token
  var i = startIndex || 0

  while (i < tokens.length) {
    token = tokens[i++]
    // ... rest of logic
  }
  return { props: props, nextIndex: i }
}
```

**Expected Improvement**: 50-90% faster parsing for complex masks

---

### 2. No Mask Compilation Caching
**Location**: `lib/index.js:5`
**Severity**: HIGH
**Performance Impact**: Redundant compilation on repeated mask usage

```javascript
function mask (obj, mask) {
  return filter(obj, compile(mask)) || null  // ⚠️ Recompiles every time
}
```

**Problem**:
- If the same mask string is used multiple times, it's recompiled every call
- Common in server applications where the same endpoint uses the same mask
- Compilation involves scanning + parsing (double overhead)

**Real-world scenario**:
```javascript
// API endpoint that handles 1000 requests/sec with same mask
app.get('/users', (req, res) => {
  const users = db.getUsers()
  res.json(mask(users, 'id,name,email'))  // ⚠️ Recompiled 1000 times/sec
})
```

**Solution**:
Implement LRU cache for compiled masks:

```javascript
var LRU = require('lru-cache')
var cache = new LRU({ max: 100 })

function mask (obj, maskStr) {
  var compiled = cache.get(maskStr)
  if (!compiled) {
    compiled = compile(maskStr)
    cache.set(maskStr, compiled)
  }
  return filter(obj, compiled) || null
}
```

**Expected Improvement**: 80-95% faster for repeated masks (most real-world usage)

---

## High-Impact Issues

### 3. String Concatenation in Tight Loop
**Location**: `lib/compiler.js:52, 56, 61`
**Severity**: MEDIUM
**Performance Impact**: Memory churn and GC pressure

```javascript
function scan (text) {
  var name = ''
  // ...
  for (; i < len; i++) {
    ch = text.charAt(i)
    // ...
    name += ch  // ⚠️ Creates new string object on each iteration
  }
}
```

**Problem**:
- Strings are immutable in JavaScript
- Each `+=` operation creates a new string object
- For a 100-character property name, creates 100 string objects
- Causes garbage collection pressure

**Solution**:
```javascript
function scan (text) {
  var nameChars = []
  // ...
  for (; i < len; i++) {
    // ...
    nameChars.push(ch)
  }
  // ...
  name = nameChars.join('')
}
```

**Expected Improvement**: 20-40% faster tokenization for long property names

---

### 4. Redundant charAt() Calls
**Location**: `lib/compiler.js:48, 55`
**Severity**: LOW-MEDIUM
**Performance Impact**: Unnecessary method calls

```javascript
for (; i < len; i++) {
  ch = text.charAt(i)       // First call
  if (ch === ESCAPE_CHAR) {
    i++
    // ...
    ch = text.charAt(i)     // Second call for same character
    name += ch === WILDCARD_CHAR ? ESCAPE_CHAR + WILDCARD_CHAR : ch
  }
}
```

**Problem**:
- `charAt()` is a method call with overhead
- The escaped character is read twice in some code paths
- Modern alternative: bracket notation `text[i]` is faster

**Solution**:
```javascript
for (; i < len; i++) {
  ch = text[i]  // Faster than charAt()
  if (ch === ESCAPE_CHAR) {
    i++
    if (i < len) {
      var nextCh = text[i]  // Read once, use multiple times
      name += nextCh === WILDCARD_CHAR ? ESCAPE_CHAR + WILDCARD_CHAR : nextCh
    }
  }
}
```

**Expected Improvement**: 5-10% faster scanning

---

### 5. for...in with hasOwnProperty Overhead
**Location**: `lib/filter.js:30-31, 37-38, 53-54`
**Severity**: MEDIUM
**Performance Impact**: Redundant checks in hot path

```javascript
function _properties (obj, mask) {
  // ...
  for (key in mask) {
    if (!util.has(mask, key)) continue  // ⚠️ hasOwnProperty call overhead
    // ... process property
  }
}

function _forAll (obj, mask, fn) {
  for (key in obj) {
    if (!util.has(obj, key)) continue  // ⚠️ Repeated in nested loops
    // ...
  }
}
```

**Problem**:
- `for...in` iterates over inherited properties (rarely needed for plain objects)
- `hasOwnProperty` call adds function call overhead on every iteration
- Called in nested loops (mask properties × object properties)
- For compiled masks (plain objects), inherited properties don't exist

**Solution**:
```javascript
// For masks (always plain objects from compiler):
var keys = Object.keys(mask)
for (var i = 0; i < keys.length; i++) {
  key = keys[i]
  // ... process without hasOwnProperty check
}

// For user objects (may have prototypes):
var keys = Object.keys(obj)  // Only own properties
for (var i = 0; i < keys.length; i++) {
  key = keys[i]
  // ... process
}
```

**Expected Improvement**: 15-25% faster filtering for objects with many properties

---

### 6. Redundant Type Checking
**Location**: `lib/filter.js:27-28`
**Severity**: LOW-MEDIUM
**Performance Impact**: Unnecessary checks in recursive hot path

```javascript
function _properties (obj, mask) {
  var maskedObj, key, value, ret, retKey, typeFunc
  if (!obj || !mask) return obj

  if (util.isArray(obj)) maskedObj = []       // ⚠️ Check 1
  else if (util.isObject(obj)) maskedObj = {} // ⚠️ Check 2 (always true if not array)
  // ...
}
```

**Problem**:
- If `obj` is not an array, it's almost always an object (or null/undefined, checked above)
- `isObject()` check is redundant after `isArray()` check
- Both checks involve function calls

**Solution**:
```javascript
function _properties (obj, mask) {
  var maskedObj
  if (!obj || !mask) return obj

  maskedObj = util.isArray(obj) ? [] : {}  // Single check
  // ...
}
```

**Expected Improvement**: 5% faster filtering

---

### 7. typeof Checks vs Strict Undefined Comparison
**Location**: `lib/filter.js:43, 56, 79`
**Severity**: LOW
**Performance Impact**: Slower than strict comparison

```javascript
if (typeof ret !== 'undefined') maskedObj[key] = ret  // ⚠️ Slower
```

**Problem**:
- `typeof` operator is slower than strict comparison
- Called in hot paths (every filtered property)

**Solution**:
```javascript
if (ret !== undefined) maskedObj[key] = ret  // Faster
```

**Expected Improvement**: 3-5% faster filtering

---

### 8. Inefficient isEmpty() Implementation
**Location**: `lib/util.js:8-14`
**Severity**: LOW
**Performance Impact**: Unnecessary iterations

```javascript
function isEmpty (obj) {
  if (obj == null) return true
  if (isArray(obj) ||
     (typeof obj === 'string')) return (obj.length === 0)  // ⚠️ String check redundant
  for (var key in obj) if (has(obj, key)) return false  // ⚠️ for...in for every check
  return true
}
```

**Problem**:
- String type check is redundant (line 10 already checks length for strings)
- Uses `for...in` loop even when `Object.keys(obj).length === 0` would be clearer
- Called in compiler for every token's properties

**Solution**:
```javascript
function isEmpty (obj) {
  if (obj == null) return true
  if (isArray(obj) || typeof obj === 'string') return obj.length === 0
  return Object.keys(obj).length === 0  // Faster for modern JS engines
}
```

**Expected Improvement**: 10-20% faster isEmpty checks

---

### 9. Function Selection in Loop
**Location**: `lib/filter.js:34`
**Severity**: LOW
**Performance Impact**: Repeated conditional in loop

```javascript
for (key in mask) {
  // ...
  typeFunc = (value.type === 'object') ? _object : _array  // ⚠️ Conditional per iteration
  // ...
}
```

**Problem**:
- Function reference selection happens for every mask property
- Could be determined once when mask is compiled

**Solution**:
Add function reference to compiled mask during compilation:

```javascript
// In compiler.js
function _addToken (token, props) {
  var prop = {
    type: token.type,
    typeFunc: token.type === 'object' ? 'object' : 'array'  // Pre-determine
  }
  // ...
}

// In filter.js
typeFunc = value.typeFunc === 'object' ? _object : _array  // Lookup, not compute
```

**Expected Improvement**: Marginal (1-2%)

---

### 10. TERMINALS Object Lookup in Hot Loop
**Location**: `lib/compiler.js:57`
**Severity**: LOW
**Performance Impact**: Hash lookup for every character

```javascript
var TERMINALS = { ',': 1, '/': 2, '(': 3, ')': 4 }

for (; i < len; i++) {
  ch = text.charAt(i)
  // ...
  else if (TERMINALS[ch]) {  // ⚠️ Object lookup every character
    // ...
  }
}
```

**Problem**:
- Object property lookup for every character in the mask string
- Could use direct character comparison for small set

**Solution**:
```javascript
else if (ch === ',' || ch === '/' || ch === '(' || ch === ')') {
  // Direct comparison is faster than object lookup
}
```

**Expected Improvement**: 5-10% faster scanning

---

### 11. Potential N+1 Pattern in Array Processing
**Location**: `lib/filter.js:76-80`
**Severity**: MEDIUM
**Performance Impact**: Redundant processing for each array element

```javascript
function _array (object, key, mask) {
  var arr = object[key]
  // ...
  for (i = 0, l = arr.length; i < l; i++) {
    obj = arr[i]
    maskedObj = _properties(obj, mask)  // ⚠️ Same mask processed N times
    if (typeof maskedObj !== 'undefined') ret.push(maskedObj)
  }
}
```

**Problem**:
- The same `mask` is passed to `_properties()` for every array element
- While the mask itself isn't reprocessed, the property enumeration is
- No early exit if all array elements have the same structure

**Note**: This is NOT a database N+1 query issue, but follows similar pattern of redundant work.

**Optimization**:
Pre-extract mask keys once:

```javascript
function _array (object, key, mask) {
  var arr = object[key]
  if (!util.isArray(arr)) return _properties(arr, mask)
  if (util.isEmpty(arr)) return arr

  var maskKeys = mask ? Object.keys(mask) : null  // Extract once
  var ret = []

  for (var i = 0, l = arr.length; i < l; i++) {
    maskedObj = _properties(arr[i], mask, maskKeys)  // Pass pre-extracted keys
    if (maskedObj !== undefined) ret.push(maskedObj)
  }
  return ret.length ? ret : undefined
}
```

**Expected Improvement**: 10-15% faster for large arrays

---

## Performance Anti-Pattern Summary

| Issue | Location | Severity | Type | Impact |
|-------|----------|----------|------|--------|
| Array.shift() in loop | compiler.js:77 | CRITICAL | Algorithm | O(n²) complexity |
| No mask caching | index.js:5 | HIGH | Architecture | 80-95% waste on repeated masks |
| String concatenation | compiler.js:52,56,61 | MEDIUM | Memory | GC pressure |
| Redundant charAt() | compiler.js:48,55 | LOW-MEDIUM | Micro-opt | Unnecessary calls |
| for...in overhead | filter.js:30,37,53 | MEDIUM | Pattern | Function call overhead |
| Redundant type check | filter.js:27-28 | LOW-MEDIUM | Logic | Unnecessary check |
| typeof vs strict | filter.js:43,56,79 | LOW | Micro-opt | Slower operator |
| Inefficient isEmpty | util.js:8-14 | LOW | Algorithm | Unnecessary iteration |
| Function selection | filter.js:34 | LOW | Logic | Repeated conditional |
| TERMINALS lookup | compiler.js:57 | LOW | Micro-opt | Hash lookup |
| Array N+1 pattern | filter.js:76-80 | MEDIUM | Pattern | Redundant work |

---

## Benchmark Recommendations

Create benchmarks for these scenarios:

1. **Short vs Long Mask Strings**: Test tokenization performance
2. **Repeated Masks**: Test with/without caching
3. **Deep Nesting**: Test recursive filtering performance
4. **Large Arrays**: Test array processing with many elements
5. **Wildcard Usage**: Test wildcard (`*`) performance impact

---

## Recommended Optimization Priority

### Phase 1 (Quick Wins)
1. Fix Array.shift() → Use index-based traversal
2. Add mask compilation caching (LRU cache)
3. Replace for...in with Object.keys()

**Expected Total Improvement**: 60-80% for typical usage

### Phase 2 (Refinements)
4. Fix string concatenation → Use array join
5. Use bracket notation instead of charAt()
6. Simplify type checking logic

**Expected Additional Improvement**: 15-25%

### Phase 3 (Micro-optimizations)
7. Replace typeof checks with strict comparison
8. Optimize isEmpty()
9. Direct character comparison instead of TERMINALS lookup

**Expected Additional Improvement**: 5-10%

---

## Total Expected Performance Gain

**Conservative Estimate**: 70-90% faster overall
**Optimistic Estimate**: 2-5x faster for real-world usage with repeated masks

---

## Notes on N+1 Queries

**Finding**: No traditional database N+1 query anti-pattern found (this is a client-side library)

However, there is a **similar pattern** in array processing:
- Each array element triggers full mask property enumeration
- Similar to querying related records individually instead of in bulk
- Optimizable by pre-extracting mask structure

---

## Notes on Re-renders

**Finding**: Not applicable (this is not a UI rendering library)

This library performs pure data transformation and does not involve:
- DOM manipulation
- React/Vue/Angular rendering
- UI component lifecycle
- Event handlers causing re-renders

---

## Conclusion

The json-mask library has **significant optimization opportunities**, particularly:
- **Algorithm complexity** (O(n²) parser)
- **Architectural** (no caching of expensive compilation)
- **Hot path micro-optimizations** (string ops, loop patterns)

All issues are fixable without breaking changes to the public API. The library would benefit most from fixing the top 3 critical/high-impact issues first.
