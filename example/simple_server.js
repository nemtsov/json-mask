var http = require('http')
var url = require('url')
var mask = require('../lib')
var server

server = http.createServer(function (req, res) {
  var fields = url.parse(req.url, true).query.fields
  var data = {
    firstName: 'Mohandas',
    lastName: 'Gandhi',
    aliases: [{
      firstName: 'Mahatma',
      lastName: 'Gandhi'
    }, {
      firstName: 'Bapu'
    }]
  }
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(mask(data, fields)))
})

server.listen(4000)
