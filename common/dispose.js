/**
 * Author:Herui/Administrator;
 * CreateDate:2016/2/16
 *
 * Describe:
 */

var fs = require('fs')
var mine = require('./ctype').types
var base = require('ss-controller')
var querystring = require('querystring')

function Dispose (dir) {
  this._dir = dir
  this.cache = {}
}
Dispose.prototype = {
  constructor: Dispose,
  responseFile: function (realPath, request, response, pathname, ext) {
    fs.exists(realPath, function (exists) {
      if (!exists) {
        response.writeHead(404, {
          'Content-Type': 'text/plain'
        })
        response.write('This request URL ' + pathname + ' was not found on this server.')
        response.end()
      } else {
        fs.readFile(realPath, 'binary', function (err, file) {
          if (err) {
            response.writeHead(500, {
              'Content-Type': 'text/plain'
            })
            response.end(err)
          } else {
            var contentType = mine[ext] || 'text/plain'
            response.writeHead(200, {
              'Content-Type': contentType,
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'X-Requested-With',
              'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
            })
            response.write(file, 'binary')
            response.end()
          }
        })
      }
    })
  },
  responseData: function (request, response, pathname, query, form, files) {
    var paths = pathname.split('/'), controller
    try {
      if (paths.length > 3) throw new Error('URL Error !')
      if (paths.length < 3) paths.push('index')

      paths[0] == '' ? paths.shift() : null
      if (this.cache[paths[0]] && false) {
        controller = this.cache[paths[0]]
      } else {
        if (fs.existsSync(this._dir + '/controller/' + paths[0] + '.js')) {
          try {
            delete require.cache[require.resolve(this._dir + '/controller/' + paths[0] + '.js')]
            controller = base.createController(require(this._dir + '/controller/' + paths[0] + '.js'))
          } catch (loaderror) {
            controller = base.createController()
          }
        } else {
          controller = base.createController()
        }

        this.cache[paths[0]] = controller
      }
      var action = paths.pop()
      controller[action] ? null : controller[action] = function () { return this.render.view() }
      controller.controller = paths.join('/')
      controller.action = action
      controller.dir = this._dir
      controller.querystring = querystring.parse(query)
      controller.files = files
      controller.form = form
      controller.request = request
      controller.response = response
      var content = controller[action](controller.querystring, controller.form, files)
      if (content !== undefined) {
        if (content instanceof Promise) {
          content.then(function (result) {
            if (result) {
              response.writeHead(200, { 'Content-Type': result.type })
              response.write(result.data)
              response.end()
            }
          })
        } else {
          response.writeHead(200, { 'Content-Type': content.type })
          response.write(content.data)
          response.end()
        }
      }
    } catch (e) {
      response.writeHead(500, { 'Content-Type': 'text/plain' })
      response.write(e.code || e.message)
      response.end()
    }
  }
}

module.exports = function (dir) {
  return new Dispose(dir)
}
