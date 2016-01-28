var cards = [];
var tracker = -1;
var lastTouches = []
var interruptAnimation = false;
var touchDown = {};
var touchUp = {};

window.onload = initialize;

function getCards() {
  return Array.from(document.getElementsByName('c-card')).map(function (card) {
    return {
      node: card,
      height: card.offsetHeight,
      stackedOffset: card.offsetHeight > window.innerHeight ?
        window.innerHeight - card.offsetHeight : 0
    }
  });
}

function initialize() {
  cards = getCards();
  cards.reduce(function (prev, next) {
    next.offset = prev;
    setTransform(next.node, 'translate3d(0px, ' + prev + 'px, 0px)');
    return prev + next.height;
  }, 0);
  document.getElementById('c-wrap').style.visibility = 'visible';
}

function setTransform(node, transformProp){
  node.style.WebkitTransform = transformProp;
  node.style.MozTransform = transformProp;
  node.style.msTransform = transformProp;
  node.style.OTransform = transformProp;
  node.style.transform = transformProp;
}

function addTouch(touch) {
  lastTouches.push(touch);
  if (lastTouches.length > 5) {
    lastTouches.splice(0, lastTouches.length - 5);
  }
}

function getDelta(event, type) {
  switch (type) {
    case 'touch':
      var last = lastTouches[lastTouches.length - 1].y;
      addTouch({ y: event.clientY, stamp: Date.now() });
      return event.clientY - (last || event.clientY );
    case 'wheel':
      return event.deltaY;
    case 'offset':
    default:
      return event;
  }
}

function onMove(event, type) {
  var delta = getDelta(event, type);
  cards.reduce(function (prev, next, index) {
    if (index > tracker) {
      next.past = next.offset;
      next.offset = checkCurrentCard(next, delta, index, prev);
      if (next.past !== next.offset) {
        setTransform(next.node, 'translate3d(0px, ' + next.offset + 'px, 0px)');
      }
    }
    return next;
  }, {height: 0, offset: 0, stackedOffset: 0})
}

function checkCurrentCard(card, delta, cardIndex, prev) {
  if (cardIndex === tracker + 1) {
    var result;
    if (card.offset + delta >= prev.height + prev.stackedOffset) {
      if (delta > 0 || delta < 0) {
        tracker = tracker < 0 ? -1 : tracker - 1;
      }
      result = prev.height + prev.stackedOffset;
    } else if (card.offset + delta <= card.stackedOffset) {
      tracker = (cardIndex === cards.length - 1) ? cardIndex - 1 : cardIndex;
      result = card.stackedOffset;
    } else {
      result = card.offset + delta;
    }
    return checkMaximum(result, cardIndex);
  } else {
    return prev.offset + prev.height;
  }
}

function checkMaximum(offset, cardIndex) {
  var heightLeft = cards.reduce(function (prev, card, index) {
    if (index > cardIndex - 1) {
      return card.height + prev;
    }
    return prev;
  }, 0);
  if (heightLeft + offset < window.innerHeight) {
    return window.innerHeight - heightLeft;
  }
  return offset;
}

function onResize() {
  cards = getCards();
  cards.reduce(function (prev, next, index) {
    next.offset = prev.offset + prev.height;
    if (checkMaximum(next.offset, index) !== next.offset) {
      tracker = tracker < 0 ? -1 : tracker - 1;
    }
    if (index <= tracker) {
      next.offset = next.stackedOffset;
      setTransform(next.node,
        'translate3d(0px, ' + next.stackedOffset + 'px, 0px)');
    }
    if (index > tracker) {
      next.offset = checkCurrentCard(next, 0, index, prev);
      setTransform(next.node, 'translate3d(0px, ' + next.offset + 'px, 0px)');
    }
    return next;
  }, {height: 0, offset: 0, stackedOffset: 0})
}

function onTouch(touch, direction) {
  switch (direction) {
    case 'start':
      addTouch({ y: touch.clientY, stamp: Date.now() });
      touchDown = { y: touch.clientY, stamp: Date.now() };
      break;
    case 'end':
      touchUp = { y: touch.clientY, stamp: Date.now() };
      onRelease(touchDown, touchUp, lastTouches);
      lastTouches = [];
      break;
    default:
      lastTouches = [];
  }
}

function onRelease(start, end, touches) {
  var moved = 0;
  var velocity = 0;
  var amplitude, start, target;
  touches.reduce(function (prev, next) {
    var elapsed = next.stamp - prev.stamp;
    var delta = next.y - prev.y;
    var v = 1000 * delta / (1 + elapsed);
    velocity = 0.8 * v + 0.2 * velocity;
    return next;
  })
  if (velocity > 50 || velocity < -50) {
    amplitude = 0.6 * velocity;
    target = Math.round(amplitude);
    start = Date.now();
    interruptAnimation = false;
    requestAnimationFrame(animateRelease);
  }

  function animateRelease() {
    if (!interruptAnimation) {
      var elapsed = Date.now() - start;
      var remainder = -amplitude * Math.exp(-elapsed / 325);
      var toMove = target + remainder - moved;
      if (remainder > 1 || remainder < -1) {
        moved = target + remainder;
        onMove(Math.round(toMove), 'offset');
        requestAnimationFrame(animateRelease);
      } else {
        onMove(Math.round(remainder), 'offset');
      }
    }
  }
}

window.addEventListener('resize', function(event){
  interruptAnimation = true;
  onResize();
});
window.addEventListener('wheel', function(event){
  interruptAnimation = true;
  onMove(event, 'wheel');
});
window.addEventListener('touchstart', function(event){
  event.preventDefault();
  interruptAnimation = true;
  onTouch(event.touches[0], 'start');
});
window.addEventListener('touchmove', function(event){
  event.preventDefault();
  onMove(event.touches[0], 'touch');
});
window.addEventListener('touchend', function(event){
  event.preventDefault();
  onTouch(event.changedTouches[0], 'end');
});