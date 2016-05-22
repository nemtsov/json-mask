/* global jsonMask */

function assert (o) { if (!o) throw new Error('AssertionError') }
var r = jsonMask({p: {a: 1, b: 2}, z: 1}, 'p/a,z')
assert(r.p.a)
assert(r.z)
assert(typeof r.p.b === 'undefined')
document.getElementById('res').innerHTML = 'ok'
