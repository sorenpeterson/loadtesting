var request = require('request');

var Site = function (url) {
  this.HTTPOptions = {};
  this.HTTPOptions.baseUrl = url;
  this.HTTPOptions.headers = {};
}

Site.taskFlows = {};

Site.prototype.auth = function (username, password) {
  this.HTTPOptions.auth = {
    user: username,
    pass: password
  }
  return this;
}

Site.prototype.header = function (key, value) {
  this.HTTPOptions.headers[key] = value;
  return this;
}

Site.prototype.request = function (tag, uri, options, callback) {
  var start = new Date();
  var mergedOptions = Object.assign({}, this.HTTPOptions);
  Object.assign(mergedOptions, options);
  request(uri, mergedOptions, function (error, response, body) {
    var responseTime = new Date() - start;
    callback(error, response, body);
  })
}

Site.prototype.createTaskFlow = function(name, fn) {
  if(Site.taskFlows[name] !== undefined) {
    throw new Error("Duplicate task flow name was defined. TaskFlows can't have the same name.");
  }
  return Site.taskFlows[name] = new TaskFlow(this);
};

var TaskFlow = function (site) {
  this.taskData = {};
  this.data = {};
  this.site = site;
}

TaskFlow.prototype.registerTask = function (title, callback) {
  if(this.taskData[title] !== undefined) {
    throw new Error("Duplicate task name was defined. Tasks can't have the same name");
  }
  this.taskData[title] = callback;
  return this;
}

TaskFlow.prototype.startAtTask = function (entryPoint) {
  var state = {};
  var that = this;
  
  var goto = function (title, timeout) {
    console.log('added ', title, ' to stack');
    if(typeof that.taskData[title] !== 'function') {
      throw new Error('It appears as if you have not registered a task named ' + title);
    }
    process.nextTick(function () {
      that.taskData[title](goto, that.site, state);
    });
  }
  
  goto(entryPoint);
}

module.exports = Site
