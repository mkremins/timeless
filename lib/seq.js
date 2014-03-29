function Seq(head, tail) {
  this.head = head;
  this.tail = tail;
}

Seq.prototype.toSeq = function() {
  return this;
};

Seq.EMPTY = new Seq();

function cons(head, tail) {
  return new Seq(head, tail);
}

function seq(seqable) {
  if (seqable === null) {
    return null;
  } else {
    var aseq = seqable.toSeq();
    return (aseq === Seq.EMPTY) ? null : aseq;
  }
}

function first(seqable) {
  var aseq = seq(seqable);
  return aseq ? aseq.head : null;
}

function rest(seqable) {
  var aseq = seq(seqable);
  return aseq ? aseq.tail() : Seq.EMPTY;
}

function next(seqable) {
  return seq(rest(seqable));
}

function map(f, coll) {
  var aseq = seq(coll);
  if (aseq) {
    return cons(f(first(aseq)), function() {
      return map(f, rest(aseq));
    });
  } else {
    return null;
  }
}

function filter(pred, coll) {
  var aseq = seq(coll);
  if (aseq) {
    var head = first(aseq);
    var tail = function() {
      return filter(pred, rest(aseq));
    };
    return pred(head) ? cons(head, tail) : filter(pred, rest(aseq));
  } else {
    return null;
  }
}

function reduce_(f, memo, coll) {
  var aseq = seq(coll);
  while (aseq) {
    memo = f(memo, first(aseq));
    aseq = next(aseq);
  }
  return memo;
}

function reduce(f) {
  switch (arguments.length) {
    case 2:
      var coll = arguments[1];
      return reduce_(f, first(coll), rest(coll));
    case 3: return reduce_(f, arguments[1], arguments[2]);
  }
}

function array(coll) {
  return reduce(function(theArray, item) {
    theArray.push(item);
    return theArray;
  }, [], coll);
}

Array.prototype.toSeq = function() {
  var self = this;
  var head = self[0];
  if (head) {
    return cons(head, function() {
      return self.slice(1);
    });
  } else {
    return null;
  }
};

function range_(start, end, step) {
  var term = start;
  return cons(term, function() {
    var nextTerm = term + step;
    return (nextTerm >= end) ? null : range(nextTerm, end);
  });
}

function range() {
  switch(arguments.length) {
    case 0: return range_(0, Infinity, 1);
    case 1: return range_(0, arguments[0], 1);
    case 2: return range_(arguments[0], arguments[1], 1);
    case 3: return range_(arguments[0], arguments[1], arguments[2]);
  }
}

function take(n, coll) {
  if (n > 0) {
    return cons(first(coll), function() {
      return take(n - 1, rest(coll));
    });
  } else {
    return null;
  }
}

module.exports = {
  array:  array,
  cons:   cons,
  filter: filter,
  first:  first,
  map:    map,
  next:   next,
  range:  range,
  reduce: reduce,
  rest:   rest,
  Seq:    Seq,
  seq:    seq,
  take:   take
};
