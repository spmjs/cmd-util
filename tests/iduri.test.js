var should = require('should');
var require = require('./_require');
var iduri = require('../lib/iduri');


describe('iduri.resolve', function() {
  var meta;

  it('has no version', function() {
    meta = iduri.resolve('lepture/nico');
    should.not.exist(meta.version);
  });

  it('has a version', function() {
    meta = iduri.resolve('lepture/nico@0.1.5');
    should.exist(meta.version);

    meta = iduri.resolve('lepture/nico#0.1.5');
    should.exist(meta.version);

    meta = iduri.resolve('lepture.nico@0.1.5');
    should.exist(meta.version);
  });

  it('should resolve as git', function() {
    meta = iduri.resolve('git@github.com:lepture/nico');
    meta.type.should.equal('git');

    meta = iduri.resolve('https://github.com/lepture/nico.git');
    meta.type.should.equal('git');

    meta = iduri.resolve('git+https://github.com/lepture/nico');
    meta.type.should.equal('git');
  });

  it('should resolve as http', function() {
    meta = iduri.resolve('https://github.com/lepture/nico');
    meta.type.should.equal('http');
  });

  it('should resolve as spm', function() {
    meta = iduri.resolve('lepture/nico');
    meta.type.should.equal('spm');

    meta = iduri.resolve('lepture.nico');
    meta.type.should.equal('spm');

    meta = iduri.resolve('seajs');
    meta.type.should.equal('spm');
  });

  it('has family: arale', function() {
    // git type
    meta = iduri.resolve('arale');
    meta.family.should.equal('arale');

    meta = iduri.resolve('arale/base');
    meta.family.should.equal('arale');

    meta = iduri.resolve('arale.base');
    meta.family.should.equal('arale');

    meta = iduri.resolve('git@github.com:aralejs/base');
    meta.family.should.equal('aralejs');

    meta = iduri.resolve('git://github.com/aralejs/base.git');
    meta.family.should.equal('aralejs');
  });
});

describe('iduri.normalize', function() {
  it('return a/c', function() {
    iduri.normalize('a//b/../c').should.equal('a/c');
  });
});

describe('iduri.relative', function() {
  it('does not parse absolute uri', function() {
    iduri.relative('a/b', '/c').should.equal('/c');
  });
  it('return relative uri', function() {
    iduri.relative('a', 'c').should.equal('c');
    iduri.relative('a/b', 'c/d').should.equal('../c/d');
  });
});

describe('iduri.absolute', function() {
  it('only absolute relative uri', function() {
    iduri.absolute('a', 'b').should.equal('b');
  });

  it('absolute relative uri', function() {
    iduri.absolute('arale/base/1.0.0/parser', './base').should.equal('arale/base/1.0.0/base');
    iduri.absolute('a//b', './c').should.equal('a/c');
  });
});

describe('iduri.join', function() {
  it('can join uri', function() {
    iduri.join('a', 'b').should.equal('a/b');
  });
});

describe('iduri.dirname', function() {
  it('can find dirname', function() {
    iduri.dirname('a/b/c').should.equal('a/b');
  });
});

describe('iduri.basename', function() {
  it('can find basename', function() {
    iduri.basename('a/b/c').should.equal('c');
  });
});

describe('iduri.extname', function() {
  it('can find ext', function() {
    iduri.extname('a/b/c').should.equal('.js');
    iduri.extname('a/b/c.css').should.equal('.css');
  });
});

describe('iduri.appendext', function() {
  it('can append ext', function() {
    iduri.appendext('a/b').should.equal('a/b.js');
    iduri.appendext('a/b.css').should.equal('a/b.css');
  });
});

describe('iduri.idFromPackage', function() {
  it('generate id without format config', function() {
    iduri.idFromPackage({
      family: 'arale',
      name: 'class',
      version: '1.0.0',
      filename: 'class.js'
    }).should.equal('arale/class/1.0.0/class');
  });

  it('generate id with format config', function() {
    iduri.idFromPackage({
      family: 'alice',
      filename: 'button.css'
    }, '{{ filename }}').should.equal('button.css');

    iduri.idFromPackage({
      family: 'alice',
      filename: 'button.css'
    },'#{{ family }}/{{ filename }}').should.equal('#alice/button.css');
  });

  it('should generate id from relative path', function() {
    iduri.idFromPackage({
      family: 'arale',
      name: 'base',
      version: '1.0.0',
      filename: 'class.js'
    }, './event.js').should.equal('./event');
  });

  it('should generate id without a filename', function() {
    iduri.idFromPackage({
      family: 'arale',
      name: 'base',
      version: '1.0.0'
    }, '').should.equal('arale/base/1.0.0/');
  });
});

describe('iduri.isAlias', function() {
  it('is not alias', function() {
    iduri.isAlias({
      spm: {
        alias: {
          '$': 'jquery'
        }
      }
    }, 'a').should.equal(false);
  });
});

describe('iduri.parseAlias', function() {
  it('should generate id from alias', function() {
    iduri.parseAlias({
      alias: {
        'jquery': 'gallery/jquery/1.7.2/jquery'
      }
    }, 'jquery').should.equal('gallery/jquery/1.7.2/jquery');
  });
  it('should generate id from relative path', function() {
    iduri.parseAlias({
      alias: {
        'jquery': 'gallery/jquery/1.7.2/jquery'
      }
    }, './events.js').should.equal('./events');
  });
  it('is not an alias', function() {
    iduri.parseAlias({}, 'hello').should.equal('hello');
  });
});
