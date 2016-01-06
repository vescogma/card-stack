var cards = [
  { node: document.getElementById('c1') },
  { node: document.getElementById('c2') },
  { node: document.getElementById('c3') },
  { node: document.getElementById('c4') },
  { node: document.getElementById('c5') },
]
var tracker = 0;
var lastScroll = 0;
var wrapper = document.getElementById('cwrap');

window.onload = function(){
  start();
}

function start() {
  cards.reduce(function (prev, next) {
    next.initial = prev;
    next.offset = prev;
    next.height = next.node.offsetHeight;
    next.node.style.transform = 'translate3d(0, ' + prev + 'px, 0)';
    return prev + next.height;
  }, 0);
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

function checkTopCard(offset, delta, cardIndex, previousCard) {
  var result;
  if (offset - delta >= previousCard.height) {
    if (delta < 0) {
      tracker = tracker === 0 ? 0 : tracker - 1;
    }
    result = previousCard.height;
  } else {
    result = offset - delta;
  }
  return checkMaximum(result, cardIndex);
}

function checkFrontCards(offset, delta, cardIndex, previousCard) {
  if (offset - delta <= 0) {
    tracker = (cardIndex === cards.length - 1) ? cardIndex - 1 : cardIndex;
    return 0;
  }
  if (cardIndex === tracker + 1) {
    return checkTopCard(offset, delta, cardIndex, previousCard);
  }
  return previousCard.offset + previousCard.height;
}

function onScroll(wheel) {
  var delta = wheel.deltaY;
  cards.reduce(function (prev, next, index) {
    if (index > tracker) {
      next.past = next.offset;
      next.offset = checkFrontCards(next.offset, delta, index, prev)
      if (next.past !== next.offset) {
        next.node.style.transform = 'translate3d(0, ' + next.offset + 'px, 0)';
      }
    }
    return next;
  })
}

window.addEventListener('wheel', function(event){
  onScroll(event);
});