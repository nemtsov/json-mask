function assert(o) { if (!o) throw new Error('AssertionError') }
var r = jsonMask({p: {a: 1, b: 2}, z: 1}, 'p/a,z')
assert(r.p.a)
assert(r.z)
assert('undefined' === typeof r.p.b)
document.getElementById('res').innerHTML = 'ok'
