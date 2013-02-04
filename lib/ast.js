/*
 * spm.sdk.ast
 * https://spmjs.org
 *
 * Hsiaoming Yang <lepture@me.com>
 */

var util = require('util');
var UglifyJS = require('uglify-js');


// UglifyJS ast.
function getAst(ast) {
  if (isString(ast)) {
    return UglifyJS.parse(ast);
  }
  return ast;
}
exports.getAst = getAst;


// A standard cmd module:
//
//   define('id', ['deps'], fn)
//
// Return everything in define:
//
//   {id: 'id', dependencies: ['deps'], factory: ast of fn}
function parse(ast) {
  ast = getAst(ast);
  var meta = [];

  var fns = [];
  var walker = new UglifyJS.TreeWalker(function(node, descend) {
    var id, factory, dependencies = [];
    // don't collect dependencies in the define in define
    if (node instanceof UglifyJS.AST_Call && node.start.value === 'define') {
      if (!node.args || !node.args.length) return true;

      if (node.args.length === 1) {
        factory = node.args[0];
        if (factory instanceof UglifyJS.AST_Function) {
          fns.push(factory);
        } else {
          meta.push({id: id, dependencies: dependencies, factory: factory});
        }
        return true;
      }

      if (node.args.length === 2) {
        factory = node.args[1];
        var child = node.args[0];
        if (child instanceof UglifyJS.AST_Array) {
          // define([], function(){});
          dependencies = map(child.elements, function(el) {
            if (el instanceof UglifyJS.AST_String) {
              return el.getValue();
            }
          });
        } else if (child instanceof UglifyJS.AST_String) {
          // define('id', function() {});
          id = child.getValue();
        }
        meta.push({id: id, dependencies: dependencies, factory: factory});
        return true;
      }
      factory = node.args[2];

      var firstChild = node.args[0], secondChild = node.args[1];
      if (firstChild instanceof UglifyJS.AST_String) {
        id = firstChild.getValue();
      }
      if (secondChild instanceof UglifyJS.AST_Array) {
        dependencies = map(secondChild.elements, function(el) {
          if (el instanceof UglifyJS.AST_String) {
            return el.getValue();
          }
        });
      }
      meta.push({id: id, dependencies: dependencies, factory: factory});
      return true;
    }
  });
  ast.walk(walker);

  if (fns.length) {
    fns.forEach(function(fn) {
      meta.push({id: null, dependencies: getRequires(fn), factory: fn});
    });
  }

  return meta;
}
exports.parse = parse;

exports.parseFirst = function(ast) {
  return parse(ast)[0];
};


// Replace everything in `define` and `require`.
//
//    define('id', ['a'], function(require) {
//        var $ = require('jquery')
//    })
//
// Replace the code with:
//
//    replaceAll(code, function(value) {
//        return value + '-debug';
//    })
//
// The result will be:
//
//    define('id-debug', ['a-debug'], function(require) {
//        var $ = require('jquery-debug')
//    })
function modify(ast, options) {
  ast = getAst(ast);

  var idfn, depfn, requirefn;
  if (isFunction(options)) {
    idfn = depfn = requirefn = options;
  } else {
    idfn = options.id;
    depfn = options.dependencies;
    requirefn = options.require;
  }
  if (requirefn) {
    ast = replaceRequire(ast, requirefn);
  }

  var meta = parse(ast);
  var data = '';

  var uglifyOptions = options.options || {beautify: true, comments: true};

  meta.forEach(function(ret) {
    var code = ret.factory.print_to_string(uglifyOptions);
    var deps = ret.dependencies || [];
    if (depfn && isFunction(depfn)) {
      deps = deps.map(depfn);
    } else if (depfn && Array.isArray(depfn)) {
      deps = depfn;
    } else if (depfn && isString(depfn)) {
      deps = [depfn];
    }
    if (isString(deps)) {
      deps = [deps];
    }
    deps = JSON.stringify(deps);

    var id = ret.id;
    if (idfn && isFunction(idfn)) {
      id = idfn(id);
    } else if (idfn && isString(idfn)) {
      id = idfn;
    }
    if (id) {
      data += util.format('define("%s", %s, %s)', id, deps, code) + '\n';
    } else {
      data += util.format('define(%s, %s)', deps, code) + '\n';
    }
  });

  return data;
}
exports.modify = modify;

// A standard cmd module:
//
//   define(function(require) {
//       var $ = require('jquery')
//       var _ = require('lodash')
//   })
//
// Return everything in `require`: ['jquery', 'lodash'].
function getRequires(ast) {
  ast = getAst(ast);

  var deps = [];

  var walker = new UglifyJS.TreeWalker(function(node, descend) {
    if (node instanceof UglifyJS.AST_Call && node.start.value === 'require') {
      if (node.args && node.args.length === 1) {
        var child = node.args[0];
        if (child instanceof UglifyJS.AST_String) {
          deps.push(child.getValue());
        }
        // TODO warning
      }
      return true;
    }
  });

  ast.walk(walker);
  return deps;
}

// Replace every string in `require`.
//
//    define(function(require) {
//        var $ = require('jquery')
//    })
//
// Replace requires in this code:
//
//    replaceRequire(code, function(value) {
//        if (value === 'jquery') return 'zepto';
//        return value;
//    })
function replaceRequire(ast, fn) {
  ast = getAst(ast);

  if (isObject(fn)) {
    var alias = fn;
    fn = function(value) {
      if (alias.hasOwnProperty(value)) {
        return alias[value];
      } else {
        return value;
      }
    };
  }

  var trans = new UglifyJS.TreeTransformer(function(node, descend) {
    if (node instanceof UglifyJS.AST_String) {
      var parent = trans.parent();
      if (parent instanceof UglifyJS.AST_Call && parent.start.value === 'require') {
        return new UglifyJS.AST_String({
          start: node.start,
          end: node.end,
          value: fn(node.getValue())
        });
      }
    }
  });
  return ast.transform(trans);
}

function isString(str) {
  return typeof str === 'string';
}
function isFunction(fn) {
  return typeof fn === 'function';
}
function isObject(obj) {
  return typeof obj === 'object';
}
function map(obj, fn, context) {
  var results = [];
  if (obj === null) return results;
  if (obj.map === Array.prototype.map) return obj.map(fn, context);

  for (var i = 0; i < obj.length; i++) {
    results[i] = fn.call(context, obj[i], i, obj);
  }
  return results;
}
