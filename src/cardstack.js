var cards = [
  { node: document.getElementById('c1') },
  { node: document.getElementById('c2') },
  { node: document.getElementById('c3') },
  { node: document.getElementById('c4') },
  { node: document.getElementById('c5') },
]
var tracker = 0;
var lastTouches = []
var interruptAnimation = false;
var touchDown, touchUp;
var wrapper = document.getElementById('cwrap');

window.onload = start;

function start() {
  cards.reduce(function (prev, next) {
    next.initial = prev;
    next.offset = prev;
    next.height = next.node.offsetHeight;
    next.node.style.transform = 'translate3d(0, ' + prev + 'px, 0)';
    next.node.style.WebkitTransform = 'translate3d(0, ' + prev + 'px, 0)';
    return prev + next.height;
  }, 0);
}

function addTouch(touch) {
  lastTouches.push(touch);
  if (lastTouches.length > 3) {
    lastTouches.splice(0, lastTouches.length - 3);
  }
}

function getDelta(event, type) {
  switch (type) {
    case 'touchmove':
      var last = lastTouches[lastTouches.length - 1].y;
      addTouch({ y: event.clientY, stamp: Date.now() });
      return event.clientY - (last || event.clientY );
    case 'wheel':
      return event.deltaY;
    case 'release':
    default:
      return event;
  }
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
  var average = touches.reduce(function (prev, next, index) {
    return { y: (prev.y + next.y) / 2, stamp: next.stamp };
  })
  var last;
  var counter = touches.length - 1;
  while (counter >= 0) {
    last = touches[counter];
    if (end.y !== last.y) {
      break;
    }
    counter--;
  }
  if (Math.abs(end.y - average.y) > 5) {
    var timeDiff = end.stamp - last.stamp;
    var v = 1000 * (end.y - last.y) / (1 + timeDiff);
    var distance = (end.y + v) * 0.80;
    var target = 0;
    interruptAnimation = false;
    requestAnimationFrame(animateRelease);
  }
  function animateRelease() {
    if (!interruptAnimation && (distance > 1 || distance < -1)) {
      target = distance - (distance = distance * 0.95);
      onMove(Math.floor(target), 'release');
      requestAnimationFrame(animateRelease);
    }
  }
}

function onMove(event, type) {
  var delta = getDelta(event, type);
  cards.reduce(function (prev, next, index) {
    if (index > tracker) {
      next.past = next.offset;
      next.offset = checkCurrentCard(next.offset, delta, index, prev);
      if (next.past !== next.offset) {
        next.node.style.transform = 'translate3d(0, ' + next.offset + 'px, 0)';
        next.node.style.WebkitTransform =
          'translate3d(0, ' + next.offset + 'px, 0)';
      }
    }
    return next;
  })

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

  function checkTopCard(offset, delta, cardIndex, previousCard) {
    var result;
    if (offset + delta >= previousCard.height) {
      if (delta > 0) {
        tracker = tracker === 0 ? 0 : tracker - 1;
      }
      result = previousCard.height;
    } else {
      result = offset + delta;
    }
    return checkMaximum(result, cardIndex);
  }

  function checkCurrentCard(offset, delta, cardIndex, previousCard) {
    if (offset + delta <= 0) {
      tracker = (cardIndex === cards.length - 1) ? cardIndex - 1 : cardIndex;
      return 0;
    }
    if (cardIndex === tracker + 1) {
      return checkTopCard(offset, delta, cardIndex, previousCard);
    }
    return previousCard.offset + previousCard.height;
  }
}

window.addEventListener('wheel', function(event){
  onMove(event, 'wheel');
});
window.addEventListener('touchstart', function(event){
  event.preventDefault();
  interruptAnimation = true;
  onTouch(event.touches[0], 'start');
});
window.addEventListener('touchmove', function(event){
  event.preventDefault();
  onMove(event.touches[0], 'touchmove');
});
window.addEventListener('touchend', function(event){
  event.preventDefault();
  onTouch(event.changedTouches[0], 'end');
});