var _ = require("underscore"),
  child_process = require("child_process");

function init(path) {
  var obj = new R(path);
  return _.bindAll(obj, "data", "call", "callSync");
}

function R(path) {
  this.d = {};
  this.path = path;
  this.options = {
    env: _.extend({ DIRNAME: __dirname }, process.env),
    encoding: "utf8"
  };
  this.idCounter = 0;
  this.args = ["--vanilla", __dirname + "/R/launch.R"];
}

R.prototype.data = function () {
  for (var i = 0; i < arguments.length; i++) {
    this.d[++this.idCounter] = arguments[i];
  }
  return this;
};

R.prototype.call = function (_opts, _callback, resolve) {
  var callback = _callback || _opts;
  var opts = _.isFunction(_opts) ? {} : _opts;
  this.options.env.input = JSON.stringify([this.d, this.path, opts]);
  var child = child_process.spawn("Rscript", this.args, this.options);
  child.stderr.on("data", callback);
  //-->
  // child.stdout.on("data", function (d) {
  //   callback(null, JSON.parse(d));
  // });
  //--
  // jw.yi@nosquest.com 2017-09-07 : Modified for IDSysCDT
  //    Fixed JSON parsing error: large data is received in multiple data events
  var data = [];
  child.stdout.on("data", function (d) {
    // console.log("stdout.onData()", d.toString());
    data.push(d);
  });
  child.stdout.on("end", function () {
    // console.log("stdout.onEnd()");
    var d = Buffer.concat(data);
    data = [];
    callback(null, JSON.parse(d));
  });
  //<--
  child.on('close', (code) => {
    // console.log("onClose()");
    if (resolve) resolve(code);
  })
};

R.prototype.callSync = function (_opts) {
  var opts = _opts || {};
  this.options.env.input = JSON.stringify([this.d, this.path, opts]);
  var child = child_process.spawnSync("Rscript", this.args, this.options);
  if (child.stderr) throw child.stderr;
  return (JSON.parse(child.stdout));
};

module.exports = init;
