/*
 * css
 * https://github.com/spmjs/spm2/issues/4
 *
 * Hsiaoming Yang <lepture@me.com>
 */

exports.parse = function(code) {
  var lines = code.split(/\r\n|\r|\n/);
  var isStarted = false;
  var id, line;

  // clean blank lines
  while (!isStarted && lines.length) {
    line = lines[0];
    if (line.trim()) {
      isStarted = true;
      id = match(line, 'define');
    } else {
      lines = lines.slice(1);
    }
  }
  var node = {
    type: 'block',
    code: parseBlock(lines.join('\n'))
  };
  if (id) {
    node.id = id;
  }
  return node;
};

function match(text, key) {
  // /*! key value */
  var re = new RegExp('^\\/\\*!\\s*' + key + '\\s+(.*?)\\s*\\*\\/$');
  var m = text.match(re);
  if (!m) return;
  return m[1];
}

function parseBlock(code) {
  if (typeof code !== 'string') {
    return code;
  }

  var lines = code.split(/\r\n|\r|\n/);
  var tree = [];

  var stringNode = {
    type: 'string',
    code: ''
  };
  var blockNode = {};
  var blockDepth = 0;


  while (lines.length) {
    parseInBlock();
    parseLine();
  }

  function pushStringNode() {
    if (!stringNode.code) return;
    var text = stringNode.code.replace(/^\n+/, '');
    text = text.replace(/\n+$/, '');
    if (text) {
      stringNode.code = text;
      tree.push(stringNode);
    }
    stringNode = {
      type: 'string',
      code: ''
    }
  }

  function parseLine() {
    if (blockDepth !== 0) return;

    var text = lines.shift();
    var re = /^@import\s+(?:url\()?(\'|\")([^\)]+)\1\)?;?\s*$/;

    var m = match(text, 'import');
    if (!m) {
      m = text.match(re);
      m = m ? m[2]: null;
    }
    if (m) {
      pushStringNode();
      tree.push({
        id: m,
        type: 'import'
      });
      return;
    } else {
      stringNode.code = [stringNode.code, text].join('\n');
    }
  }

  function parseInBlock() {
    var text = lines[0];
    var start = match(text, 'block');
    if (start) {
      lines = lines.slice(1);
      if (blockDepth === 0) {
        pushStringNode();
        blockNode.id = start;
        blockNode.type = 'block'
        blockNode.code = '';
      } else {
        blockNode.code = [blockNode.code, text].join('\n');
      }
      blockDepth++;
      return;
    }
    /*! endblock id */
    var re = /\/\*!\s*endblock(\s+[^\*]*)?\s*\*\/$/;
    var end = text.match(re);
    if (end) {
      blockDepth--;
      if (blockDepth < 0) {
        throw new Error('block indent error');
      }

      lines = lines.slice(1);
      if (blockDepth === 0) {
        blockNode.code = parseBlock(blockNode.code);
        tree.push(blockNode);
        // reset block node
        blockNode = {};
      } else {
        blockNode.code = [blockNode.code, text].join('\n');
      }
      return;
    }
    if (blockDepth > 0) {
      lines = lines.slice(1);
      blockNode.code = [blockNode.code, text].join('\n');
      return;
    }
    return;
  }

  if (blockDepth !== 0) {
    throw new Error('block not finished.');
  }

  pushStringNode();
  return tree;
};
