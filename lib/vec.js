var seq = require('./seq');

var BITS  = 5,
    WIDTH = 1 << BITS, // 2^5 => 32
    MASK  = WIDTH - 1; // 31  => 0x01f

function Vec(count, shift, root, tail) {
  this.count = count;
  this.shift = shift; // BITS * (depth - 1)
  this.root  = root;
  this.tail  = tail;
}

Vec.prototype.toSeq = function() {
  // TODO
};

Vec.prototype.tailOffset = function() {
  var count = this.count;
  return (count <= WIDTH) ? 0 : ((count - 1) >>> BITS) << BITS;
};

Vec.EMPTY = new Vec(0, BITS, [], []);

function vec(coll) {
  return seq.reduce(conj, Vec.EMPTY, seq.seq(coll));
}

Vec.prototype.arrayFor = function(n) {
  var count = this.count;
  if (n < 0) {
    throw new Error('index must be >= 0');
  } else if (n < count) {
    if (n >= this.tailOffset()) {
      return this.tail;
    } else {
      var node = this.root;
      for (var level = this.shift; level > 0; level -= BITS) {
        node = node[(n >>> level) & MASK];
      }
      return node;
    }
  } else {
    throw new Error('index must be < vector size');
  }
};

function nth(avec, n) {
  return avec.arrayFor(n)[n & MASK];
}

function aclone(arr) {
  return arr.slice(0);
}

function newPath(level, node) {
  if (level === 0) {
    return node;
  } else {
    return [newPath(level - BITS, node)];
  }
}

function pushTail(count, level, parent, tail) {
  var subIdx = ((count - 1) >>> level) & MASK;
  var newNode = aclone(parent);
  var insert;
  if (level === BITS) {
    insert = tail;
  } else {
    var child = parent[subIdx];
    insert = child ? pushTail(count, level - BITS, child, tail)
                   : newPath(level - BITS, tail);
  }
  newNode[subIdx] = insert;
  return newNode;
}

function conj(avec, val) {
  var count = avec.count,
      shift = avec.shift,
      root  = avec.root,
      tail  = avec.tail;
  if (count - avec.tailOffset() < WIDTH) {
    var newTail = aclone(tail);
    newTail.push(val);
    return new Vec(count + 1, shift, root, newTail);
  } else {
    var newRoot, newShift = shift;
    if ((count >>> BITS) > (1 << shift)) {
      newRoot = [root, newPath(shift, tail)];
      newShift += BITS;
    } else {
      newRoot = pushTail(count, shift, root, tail);
    }
    return new Vec(count + 1, newShift, newRoot, [val]);
  }
}

function doAssoc(level, node, n, val) {
  var newNode = aclone(node);
  if (level === 0) {
    newNode[n & MASK] = val;
  } else {
    var subIdx = (n >>> level) & MASK;
    newNode[subIdx] = doAssoc(level - BITS, node[subIdx], n, val);
  }
  return newNode;
}

function assocN(avec, n, val) {
  var count = avec.count;
  if (n < 0) {
    throw new Error('index must be >= 0');
  } else if (n < count) {
    var shift = avec.shift,
        root  = avec.root,
        tail  = avec.tail;
    if (n >= avec.tailOffset()) {
      var newTail = aclone(tail);
      newTail[n & MASK] = val;
      return new Vec(count, shift, root, newTail);
    } else {
      return new Vec(count, shift, doAssoc(shift, root, n, val), tail);
    }
  } else if (n === count) {
    return conj(avec, val);
  } else {
    throw new Error('index must be <= vector size');
  }
}

module.exports = {
  Vec:    Vec,
  vec:    vec,
  nth:    nth,
  conj:   conj,
  assocN: assocN
};
