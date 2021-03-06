'use strict';

class AWSLambdaRouter {
  constructor(){
    this.responseType = 'application/json';
    this.bodyType = 'application/json';
    this.cors = false;
    this.functions = {
      post: {},
      get: {},
      put: {},
      delete: {},
      patch: {}
    };
  }

  serve(_event, _callback) {
    this.event = _event;
    this.callback = _callback;

    const path = this.__whatIsTheRoute();

    const method = this.event.httpMethod.toLowerCase();

    if (!this.functions[method][path]) {
      const err = new Error(`Route '${path}' does not exist or does not handle '${method}' method`);
      err.code = '404';
      const response = this.__done.bind(this)
      response({}, err, null);
      return
    }

    const functionToLaunch = this.functions[method][path].callback;
    const functionOptions = this.functions[method][path].options;

    this.__formatRequest(functionOptions);

    const response = this.__done.bind(this, functionOptions);

    functionToLaunch(this.event, response);

  }

  route(_method, _path, _callback, _options = {}) {
    const method = _method.toLowerCase();
    const path = this.__validateRoute(_path);

    if (!this.functions[method]) throw new Error(`${_method} is not a valid HTTP Method`);

    this.functions[method][path] = {
      callback: _callback,
      options: _options
    }
  }

  get(_path, _callback, _options = {}) {
    this.route('get', _path, _callback, _options)
  }
  post(_path, _callback, _options = {}) {
    this.route('post', _path, _callback, _options)
  }
  delete(_path, _callback, _options = {}) {
    this.route('delete', _path, _callback, _options)
  }

  useCors(option = true) {
    this.cors = option;
  }

  __formatRequest(options) {
    let request = this.event.body;
    if (request) {

      let bodyType = this.bodyType;
      if (options.bodyType) bodyType = options.bodyType;

      switch (bodyType) {
        case 'application/json':
          request = JSON.parse(request);
          break;
        case 'application/x-www-form-urlencoded':
          let pairs = request.split('&');
          request = {};
          pairs.forEach(function(pair) {
            pair = pair.split('=');
            request[pair[0]] = decodeURIComponent(pair[1] || '');
          });
          break;
        default:
          break;
      }
      this.event.body = request;
    }
  }

  __validateRoute(_path) {
    let path = _path;
    if (!path.startsWith("/")) {
      path = `/${path}`;
    }
    return path;
  }

  __whatIsTheRoute() {
    let route = "/";
    if (this.event.path){
      route = this.event.path;
    }
    return route;
  }

  __done(__options, _err, _res, _status) {
    let response = _res;
    let responseType = this.responseType;
    if (__options.responseType) responseType = __options.responseType;
    if (responseType === 'application/json'){
      response = JSON.stringify(_res);
    }
    if (_err) {
      if (!_err.code) _err.code = 500;
    }
    let headers = {
      'Content-Type': responseType
    };
    if (this.cors) {
      headers["Access-Control-Allow-Origin"] = "*";
      headers["Access-Control-Allow-Credentials"] = true;
    }
    let status
    if (_status){
      status = _status
    } else if (_err){
      status = _err.code
    } else {
      status = 200
    }
    this.callback(null, {
      statusCode: status,
      body: _err ? _err.toString() : response,
      headers: headers
    })
  }

}

module.exports = AWSLambdaRouter;
