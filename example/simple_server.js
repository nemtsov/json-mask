var http = require('http')
  , url = require('url')
  , mask = require('../lib')
  , server

server = http.createServer(function (req, res) {
  var fields = url.parse(req.url, true).query.fields
    , data = {
          firstName: 'Mohandas'
        , lastName: 'Gandhi'
        , aliases: [{
              firstName: 'Mahatma'
            , lastName: 'Gandhi'
          }, {
              firstName: 'Bapu'
          }]
      }
  res.writeHead(200, {'Content-Type': 'application/json'})
  res.end(JSON.stringify(mask(data, fields)))
})

server.listen(4000)
