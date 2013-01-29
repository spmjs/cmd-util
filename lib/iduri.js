/*
 * spm.sdk.iduri
 * https://spmjs.org
 *
 * Hsiaoming Yang <lepture@me.com>
 */

var path = require('path');

// resolve uri to meta info
// https://github.com/twitter/bower/blob/master/lib/core/package.js
exports.resolve = function(uri) {
  var url, root, name, version, type, bits;
  if (/^(.*\.git)$/.exec(uri)) {
    url = RegExp.$1.replace(/^git\+/, '');
    type = 'git';
  } else if (/^(.*\.git)#(.*)$/.exec(uri)) {
    url = RegExp.$1.replace(/^git\+/, '');
    version = RegExp.$2;
    type = 'git';
  } else if (/^(?:(git):|git\+(https?):)\/\/([^#]+)#?(.*)$/.exec(uri)) {
    url = (RegExp.$1 || RegExp.$2) + '://' + RegExp.$3;
    version = RegExp.$4;
    type = 'git';
  } else if (/^https?:\/\//.exec(uri)) {
    url = uri;
    version = false;
    type = 'http';
  } else if (/^(?:(git:\/\/)|(git@))([^#]+)#?(.*)$/.exec(uri)) {
    url = (RegExp.$1 || RegExp.$2) + RegExp.$3;
    version = RegExp.$4;
    type = 'git';
  } else {
    if (uri.indexOf('#') !== -1) {
      bits = uri.split('#', 2);
    } else {
      bits = uri.split('@', 2);
    }
    url = bits[0];
    version = bits[1];
    type = 'spm';
  }

  // spm type is:
  // root/name@version
  // root/name#version
  // root.name@version
  // root.name#version
  if (type === 'spm') {
    bits = url.split('.', 2);
    if (bits.length === 1) {
      bits = url.split('/', 2);
    }
    root = bits[0];
    if (bits.length === 1) {
      name = bits[0];
    } else {
      name = bits[1];
    }
    url = false;
  } else if (type === 'git') {
    if (/^git@.*?:(\w+)\/([a-z0-9\-]+)(?:\.git)?/.exec(url)) {
      root = RegExp.$1;
      name = RegExp.$2.replace(/\.git$/, '');
    } else if (/.*?\/(\w+)\/([a-z0-9\-]+)(\.git)?/.exec(url)) {
      root = RegExp.$1;
      name = RegExp.$2.replace(/\.git$/, '');
    }
  }
  return {type: type, root: root, name: name, version: version, url: url};
};


// normalie uri
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


exports.idFromPackage = function(pkg, filename, format) {
  if (filename && !format && filename.indexOf('<%=') !== -1) {
    format = filename;
    filename = null;
  }
  if (!filename) {
    filename = pkg.filename;
  }
  if (filename.charAt(0) === '.') {
    return filename.replace(/\.js$/, '');
  }
  if (pkg.spm && pkg.spm.format) {
    format = format || pkg.spm.format;
  }
  format = format || '<%= root %>/<%= name %>/<%= version %>/<%= filename %>';
  var data = pkg;
  data.filename = filename.replace(/\.js$/, '');
  return template(format, data);
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
  var regex = /<%=\s*(.*?)\s*%>/g;
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
