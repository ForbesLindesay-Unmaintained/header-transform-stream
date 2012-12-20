var Stream = require('stream');

module.exports = transformStream;
function transformStream(transformer) {
  var s = new Stream;
  var isPaused = false;

  s.readable = true;
  s.writable = true;

  s.write = function (buf) {
    this.emit('data', buf);
    return !isPaused;
  };
  s.end = function (buf) {
    this.emit('end', buf);
  };
  s.destroy = function () {
    this.emit('close');
  };

  s.pause = function () {
    isPaused = true;
  };
  s.resume = function () {
    isPaused = false;
    this.emit('drain');
  };

  var toPipe = [];
  var piped = false;

  s.once('pipe', function (src) {
    src.on('response', function (res) {
      while (toPipe.length) {
        var dest = toPipe.pop();
        if (transformer(res, dest[0])) {
          Stream.prototype.pipe.apply(this, dest);
        } else {
          src.pipe.apply(src, dest);
        }
      }
      piped = true;
    });
  });

  // Stream API
  s.pipe = function (dest, opts) {
    if (piped) throw new Error('It\'s to late to pipe to another stream.');
    toPipe.push(arguments);
    return dest;
  }

  return s;
}