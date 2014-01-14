/*
 * iduri
 * https://spmjs.org
 *
 * Hsiaoming Yang <me@lepture.com>
 */

var path = require('path');

// name@version
var ID_REGEX = /^([a-z][a-z0-9\-]*)@(.*)$/;
exports.ID_REGEX = ID_REGEX;

// resolve uri to meta info
exports.resolve = function(uri) {
  var m = uri.match(ID_REGEX);

  var name = m[1] || '';
  var version = m[2] || '';
  if (!name && !version) return null;
  return {name: name, version: version};
};


// normalize uri
// make sure the uri to be pretty,
// for example a//b/../c should be a/c.
function normalize(uri) {
  uri = path.normalize(uri);
  uri = uri.replace(/\\/g, '/');
  var lastChar = uri.charAt(uri.length - 1);
  if (lastChar === '/') return uri;
  // if it ends with #, we should return the uri without #
  if (lastChar === '#') return uri.slice(0, -1);
  // TODO ext logical
  return uri;
}
exports.normalize = normalize;


// this is very different from node's path.relative.
// if uri starts with /, it's absolute uri, we don't relative it.
// if base is `path/to/a', uri is `static/a.js`
// relative is: ../../../static/a.js
exports.relative = function(base, uri) {
  if (uri.charAt(0) === '/') return uri;

  var bits = normalize(base).split('/');
  var dots = [];
  if (bits.length > 1) {
    bits.forEach(function() {
      dots.push('..');
    });
    dots.pop();
    return dots.join('/') + '/' + uri;
  }
  return uri;
};


// base is `arale/base/1.0.0/parser`
// uri is `./base`
// the result should be `arale/base/1.0.0/base`
exports.absolute = function(base, uri) {
  if (uri.charAt(0) !== '.') return uri;
  uri = path.join(path.dirname(base), uri);
  return exports.normalize(uri);
};


exports.join = function(base, uri) {
  return path.join(base, uri).replace(/\\/g, '/');
};


exports.dirname = function(uri) {
  uri = path.dirname(uri);
  return uri.replace(/\\/g, '/');
};


exports.basename = function(uri) {
  var basename = path.basename(uri);
  return basename.replace(/\\/g, '/');
};


exports.extname = function(uri) {
  var ext = path.extname(uri);
  // default ext is js
  return ext ? ext: '.js';
};


exports.appendext = function(uri) {
  var ext = path.extname(uri);
  if (!ext) return uri + '.js';
  return uri;
};


exports.parseAlias = function(pkg, name) {
  // relative name: ./class
  if (name.charAt(0) === '.') {
    return name.replace(/\.js$/, '');
  }
  var alias = getAlias(pkg);
  if (alias.hasOwnProperty(name)) {
    return alias[name];
  }
  return name;
};


exports.isAlias = function(pkg, name) {
  var alias = getAlias(pkg);
  return alias.hasOwnProperty(name);
};

function getAlias(pkg) {
  var alias = {};
  if (pkg.spm && pkg.spm.alias) {
    alias = pkg.spm.alias;
  } else if (pkg.alias) {
    alias = pkg.alias;
  }
  return alias;
}

function template(format, data) {
  var regex = /\{\{\s*(.*?)\s*\}\}/g;
  var ret = format;
  var match = regex.exec(format);

  var getData = function(obj, key) {
    var keys = key.split('.');
    keys.forEach(function(k) {
      if (obj && obj.hasOwnProperty(k)) {
        obj = obj[k];
      }
    });
    return obj || '';
  };

  var placeholder, key, value;
  while (match) {
    placeholder = match[0], key = match[1];
    value = getData(data, key);
    ret = ret.replace(placeholder, value);
    match = regex.exec(format);
  }
  return ret;
}
