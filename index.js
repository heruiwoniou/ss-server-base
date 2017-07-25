/**
 * Description:
 * Author:Administrator
 * CreateDateTime:2016/2/4.
 */

var multiparty = require('multiparty')
var net = require('net')
var opn = require('opn')
var fs = require('fs')
var cp = require('child_process')

module.exports = {
  run: function (dir, port, runtime, enter) {
    (function (p) {
      var s = arguments.callee
      var _server = net.createServer().listen(p)
      _server.on('listening', function () {
        _server.close()
        new SimpleServer(dir, p, runtime, enter)
      })
      _server.on('error', function () {
        _server.close()
        var oldport = p
        var newport = ++p
        console.log('端口:' + oldport + '已被占用,正在尝试端口:' + newport)
        s(newport)
      })
    })(port)
  }
}

function SimpleServer (dir, port, runtime, enter) {
  this._dir = dir.trim('/')
  this._port = port || 3000
  this._runtime = runtime
  this._enter = enter || 'index.html'

  this.initialize()
}

SimpleServer.prototype = {
  constructor: SimpleServer,
  initialize: function () {
    var port = this._port
    var dir = this._dir
    var runtime = this._runtime || ''
    var defaultPage = this._enter
    var http = require('http')
    var url = require('url')
    var path = require('path')
    var dispose = require('./common/dispose')(this._dir)

    var server = http.createServer(function (request, response) {
      var uri = url.parse(request.url)
      var pathname = uri.pathname
      var query = uri.query
      if (pathname.charAt(pathname.length - 1) === '/') {
        pathname += defaultPage
      }
      var realPath = path.join(dir + '/' + runtime, pathname)
      var ext = path.extname(realPath)
      ext = ext ? ext.slice(1) : 'unknown'
      console.log(realPath)
      if (request.method === 'POST') {
        var from = new multiparty.Form()
        from.parse(request, function (err, fields, files) {
          dispose.responseData(request, response, pathname, query, fields, files)
        })
      } else { ext === 'unknown' ? dispose.responseData(request, response, pathname, query) : dispose.responseFile(realPath, request, response, pathname, ext) }
    })
    server.listen(port)
    console.log('Server runing at port: ' + port + '.')

    opn('http://127.0.0.1:' + port)
  }
}
