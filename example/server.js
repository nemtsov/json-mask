var http = require('http')
  , url = require('url')
  , mask = require('../lib')
  , activities = require('../test/fixture/activities.json')
  , personalActivities = require('../test/fixture/personal_activities.json')
  , server

/**
 * Using json-mask to implement the Google API Partial Responses
 * https://developers.google.com/+/api/#partial-responses
 */

server = http.createServer(function (req, res) {
  var parsedUrl = url.parse(req.url, true)
    , data = /^\/personal/.test(parsedUrl.pathname) ? personalActivities : activities
    , query = parsedUrl.query
  res.writeHead(200, {'Content-Type': 'application/json'})
  res.end(JSON.stringify(mask(data, query.fields), true, 2))
})

server.listen(4000, function () {
  var prefix = 'curl \'http://localhost:4000%s?fields=%s\''
  console.log('Server runnong on :4000, try the following:');
  console.log(prefix, '/', 'title')
  console.log(prefix, '/', 'kind,updated')
  console.log(prefix, '/', 'url,object(content,attachments/url)')
  console.log(prefix, '/personal', 'items/object/*')
  console.log(prefix, '/personal', 'items/object/*/totalItems')
})
