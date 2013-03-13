var fs = require('fs');
var read = function(filepath) {
  return fs.readFileSync(filepath, 'utf8');
};

var path = require('path');
var should = require('should');
var css = require('./_require')('../lib/css');

describe('css.parse', function() {
  fs.readdirSync(__dirname + '/css-cases').forEach(function(file) {
    if (/\.json$/.test(file)) return;
    file = path.basename(file, '.css');
    it('should parse ' + file, function() {
      var code = read(path.join(__dirname, 'css-cases', file + '.css'));
      var ret = css.parse(code);
      var json = read(path.join(__dirname, 'css-cases', file + '.json'));
      JSON.stringify(ret, null, 2).should.equal(json.trim());
    });
  });
});