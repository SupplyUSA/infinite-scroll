let url = 'http://message-list.appspot.com/messages?limit?=10&pageToken=';
let count = 0;
function fetchdata() {
	$.ajax({
	  url: url,
	  type: "get",
	   beforeSend: function(){
       $("#loading").show();
		},
	    success: function(data) {
		for(let i in data.messages) {
			let photoUrl = '<div class="message"><div class="swipe"><img class="avatar fl" width="48" height="48" src="http://message-list.appspot.com/' + data.messages[i].author.photoUrl + '">';
			let senderName = '<div class="sender-name">' + data.messages[i].author.name + '</div>';
			let updated = '<div class="date-time">' + data.messages[i].updated + '</div>';
			let content = '<div class="content-message ellipsis">' + data.messages[i].content + '</div></div></div>';		
			document.querySelector(".main-container").innerHTML += photoUrl + senderName + updated + content;
		}
		$("#loading").hide();
		count++;
		console.log(count);
		return new Cards();
	  },
	  error: function(xhr) {
	  }
	});
}

fetchdata();

/**
	var callback = _.throttle(() => { console.log('bam')}, 10000);
    window.addEventListener('scroll', callback);
*/
let callback = function() {
	if ($(window).scrollTop() >= $(document).height() - $(window).height() - 100) {
      fetchdata();
   }
}
$(window).on('scroll', _.throttle(callback, 500));


class Cards {
	
  constructor () {
    this.cards = Array.from($('.message'));
	console.log(this.cards);
	console.log(this);
    this.onStart = this.onStart.bind(this);
    this.onMove = this.onMove.bind(this);
    this.onEnd = this.onEnd.bind(this);
    this.update = this.update.bind(this);
    this.targetBCR = null;
    this.target = null;
    this.startX = 0;
    this.currentX = 0;
    this.screenX = 0;
    this.targetX = 0;
    this.draggingCard = false;
    this.addEventListeners();
    requestAnimationFrame(this.update);
  }

  addEventListeners () {
    $(document).on('touchstart', '.message', this.onStart);
    $(document).on('touchmove', '.message', this.onMove);
    $(document).on('touchend', '.message', this.onEnd);

    $(document).on('mousedown', '.message', this.onStart);
    $(document).on('mousemove', '.message', this.onMove);
    $(document).on('mouseup', '.message', this.onEnd);
  }

  onStart (evt) {
    if (this.target)
      return;

    if (!evt.target.classList.contains('message'))
      return;

    this.target = evt.target;
    this.targetBCR = this.target.getBoundingClientRect();

    this.startX = evt.pageX || evt.touches[0].pageX;
    this.currentX = this.startX;

    this.draggingCard = true;
    this.target.style.willChange = 'transform';

    evt.preventDefault();
  }

  onMove (evt) {
    if (!this.target)
      return;

    this.currentX = evt.pageX || evt.touches[0].pageX;
  }

  onEnd (evt) {
    if (!this.target)
      return;

    this.targetX = 0;
    let screenX = this.currentX - this.startX;
    const threshold = this.targetBCR.width * 0.35;
    if (Math.abs(screenX) > threshold) {
      this.targetX = (screenX > 0) ?
           this.targetBCR.width :
          -this.targetBCR.width;
    }

    this.draggingCard = false;
  }

  update () {
	this.cards = Array.from($('.message'));
    requestAnimationFrame(this.update);

    if (!this.target)
      return;

    if (this.draggingCard) {
      this.screenX = this.currentX - this.startX;
    } else {
      this.screenX += (this.targetX - this.screenX) / 4;
    }

    const normalizedDragDistance =
        (Math.abs(this.screenX) / this.targetBCR.width);
    const opacity = 1 - Math.pow(normalizedDragDistance, 3);
	

    this.target.style.transform = `translateX(${this.screenX}px)`;
    this.target.style.opacity = opacity;

    // User has finished dragging.
    if (this.draggingCard)
      return;

    const isNearlyAtStart = (Math.abs(this.screenX) < 0.1);
    const isNearlyInvisible = (opacity < 0.01);

    // If the card is nearly gone.
    if (isNearlyInvisible) {

      // Bail if there's no target or it's not attached to a parent anymore.
      if (!this.target || !this.target.parentNode)
        return;

      this.target.parentNode.removeChild(this.target);

      const targetIndex = this.cards.indexOf(this.target);
      this.cards.splice(targetIndex, 1);

      // Slide all the other cards.
      this.animateOtherCardsIntoPosition(targetIndex);

    } else if (isNearlyAtStart) {
      this.resetTarget();
    }
  }
  animateOtherCardsIntoPosition (startIndex) {
	 this.cards = Array.from($('.message'));
	console.log("insude animateOtherCardsIntoPosition: ", this.cards);	
	  
    // If removed card was the last one, there is nothing to animate.
    // Remove the target.
    if (startIndex === this.cards.length) {
      this.resetTarget();
      return;
    }

    const onAnimationComplete = evt => {
      const card = evt.target;
      card.removeEventListener('transitionend', onAnimationComplete);
      card.style.transition = '';
      card.style.transform = '';

      this.resetTarget();
    };
    // Set up all the card animations.
    for (let i = startIndex; i < this.cards.length; i++) {
      const card = this.cards[i];

      // Move the card down then slide it up.
      card.style.transform = `translateY(${this.targetBCR.height + 20}px)`;
      card.addEventListener('transitionend', onAnimationComplete);
    }

    // Now init them.
    requestAnimationFrame(_ => {
      for (let i = startIndex; i < this.cards.length; i++) {
        const card = this.cards[i];

        // Move the card down then slide it up, with delay according to "distance"
        card.style.transition = `transform 150ms cubic-bezier(0,0,0.31,1) ${i*50}ms`;
        card.style.transform = '';
      }
    });
  }
  resetTarget () {
    if (!this.target)
      return;

    this.target.style.willChange = 'initial';
    this.target.style.transform = 'none';
    this.target = null;
  }
}