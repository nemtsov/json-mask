/* global describe, it */

/**
 * Correctness Test: Verify optimized compiler produces identical results
 *
 * This test ensures that the O(n) optimized compiler produces
 * exactly the same output as the original O(n²) compiler.
 */

var assert = require('assert')
var compilerOriginal = require('../lib/compiler')
var compilerOptimized = require('../lib/compiler-optimized')

describe('Optimized Compiler Correctness', function () {
  // Test cases from the original test suite
  var testCases = [
    'a',
    'a,b',
    'a,b,c',
    'a/b',
    'a/b/c',
    'a/b/c/d',
    'a,b/c,d',
    'a(b)',
    'a(b,c)',
    'a(b/c)',
    'a(b(c))',
    'url,obj(url,a/url)',
    'a/*/g',
    'a/*',
    '*',
    '*(a,b)',
    'a\\/b',
    'a\\/b/c',
    'a,b\\/c,d',
    '\\*',
    'a,\\*,b',
    'kind',
    'items',
    'items(title)',
    'items(title,object/url,actor)',
    'a/b/c,d/e/f,g',
    'ob,a(k,z(f,g/d)),d',
    'a(b,c(d,e)),f/g/h',
    'a/b(c/d(e,f),g),h',
    // Edge cases
    '',
    null,
    'a/b/c/d/e/f/g/h/i/j', // deep nesting
    'a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u,v,w,x,y,z', // many properties
    // Complex real-world examples
    'id,name,email,address(street,city,state,zip),orders(id,total,items(sku,quantity))',
    'user(id,profile(name,avatar),settings(theme,notifications(email,sms)))',
    'data/*/id,data/*/attributes(name,value)'
  ]

  testCases.forEach(function (mask) {
    it('should produce identical output for mask: ' + JSON.stringify(mask), function () {
      var original = compilerOriginal(mask)
      var optimized = compilerOptimized(mask)

      assert.deepStrictEqual(
        optimized,
        original,
        'Optimized compiler output does not match original for mask: ' + mask
      )
    })
  })

  it('should handle all test cases from index-test.js', function () {
    // Test all masks from the original test suite
    var masks = [
      'a',
      'a,b',
      'obj/s',
      'arr/s',
      'a/s/g,b',
      '*',
      'a/*/g',
      'a/*',
      'a(g)',
      'a,c',
      'b(d/*/z)',
      'url,obj(url,a/url)',
      '*(a,b)',
      'kind',
      'title,object,url',
      'items',
      'items(title)',
      'items(id,actor(displayName))',
      'items(object(content,attachments(url)))',
      'items(object(attachments(url,image(url))))',
      'items(title,object/url)',
      'items/object',
      'items(title,object/url,actor)',
      'kind,items(actor/url)',
      'etag,items(verb,object(attachments(id,image/url)))'
    ]

    masks.forEach(function (mask) {
      var original = compilerOriginal(mask)
      var optimized = compilerOptimized(mask)

      assert.deepStrictEqual(
        optimized,
        original,
        'Mismatch for mask: ' + mask
      )
    })
  })

  it('should handle escaped wildcards correctly', function () {
    var mask = 'a,\\*,b'
    var original = compilerOriginal(mask)
    var optimized = compilerOptimized(mask)

    assert.deepStrictEqual(optimized, original)
    assert(original['*'], 'Should have escaped wildcard as property')
  })

  it('should handle escaped slashes correctly', function () {
    var mask = 'a\\/b/c'
    var original = compilerOriginal(mask)
    var optimized = compilerOptimized(mask)

    assert.deepStrictEqual(optimized, original)
    assert(original['a/b'], 'Should have escaped slash in property name')
  })

  it('should handle trailing escapes correctly', function () {
    var mask = 'a\\'
    var original = compilerOriginal(mask)
    var optimized = compilerOptimized(mask)

    assert.deepStrictEqual(optimized, original)
  })

  it('should produce identical results for complex nested structures', function () {
    var mask = 'user(id,name,profile(avatar,bio,social(twitter,github)),posts(id,title,comments(author,text)))'
    var original = compilerOriginal(mask)
    var optimized = compilerOptimized(mask)

    assert.deepStrictEqual(optimized, original)
  })

  it('should handle wildcards at different levels', function () {
    var masks = [
      '*',
      'a/*',
      'a/*/b',
      'a/b/*',
      '*/*/c',
      'a(*/b)',
      '*(a,b/c)'
    ]

    masks.forEach(function (mask) {
      var original = compilerOriginal(mask)
      var optimized = compilerOptimized(mask)

      assert.deepStrictEqual(
        optimized,
        original,
        'Wildcard mismatch for: ' + mask
      )
    })
  })
})
