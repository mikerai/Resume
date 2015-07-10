/* Custom scripts */

$(document).foundation();

/*!
 * classie - class helper functions
 * from bonzo https://github.com/ded/bonzo
 * 
 * classie.has( elem, 'my-class' ) -> true/false
 * classie.add( elem, 'my-new-class' )
 * classie.remove( elem, 'my-unwanted-class' )
 * classie.toggle( elem, 'my-class' )
 */

/*jshint browser: true, strict: true, undef: true */
/*global define: false */

( function( window ) {

'use strict';

// class helper functions from bonzo https://github.com/ded/bonzo

function classReg( className ) {
  return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
}

// classList support for class management
// altho to be fair, the api sucks because it won't accept multiple classes at once
var hasClass, addClass, removeClass;

if ( 'classList' in document.documentElement ) {
  hasClass = function( elem, c ) {
    return elem.classList.contains( c );
  };
  addClass = function( elem, c ) {
    elem.classList.add( c );
  };
  removeClass = function( elem, c ) {
    elem.classList.remove( c );
  };
}
else {
  hasClass = function( elem, c ) {
    return classReg( c ).test( elem.className );
  };
  addClass = function( elem, c ) {
    if ( !hasClass( elem, c ) ) {
      elem.className = elem.className + ' ' + c;
    }
  };
  removeClass = function( elem, c ) {
    elem.className = elem.className.replace( classReg( c ), ' ' );
  };
}

function toggleClass( elem, c ) {
  var fn = hasClass( elem, c ) ? removeClass : addClass;
  fn( elem, c );
}

var classie = {
  // full names
  hasClass: hasClass,
  addClass: addClass,
  removeClass: removeClass,
  toggleClass: toggleClass,
  // short names
  has: hasClass,
  add: addClass,
  remove: removeClass,
  toggle: toggleClass
};

// transport
if ( typeof define === 'function' && define.amd ) {
  // AMD
  define( classie );
} else {
  // browser global
  window.classie = classie;
}

})( window );

(function() {
	var triggerBttn = document.getElementById( 'trigger-overlay' ),
		overlay = document.querySelector( 'div.overlay' ),
		closeBttn = overlay.querySelector( 'button.overlay-close' );
		transEndEventNames = {
			'WebkitTransition': 'webkitTransitionEnd',
			'MozTransition': 'transitionend',
			'OTransition': 'oTransitionEnd',
			'msTransition': 'MSTransitionEnd',
			'transition': 'transitionend'
		},
		transEndEventName = transEndEventNames[ Modernizr.prefixed( 'transition' ) ],
		support = { transitions : Modernizr.csstransitions };

	function toggleOverlay() {
		if( classie.has( overlay, 'open' ) ) {
			classie.remove( overlay, 'open' );
			classie.add( overlay, 'close' );
			var onEndTransitionFn = function( ev ) {
				if( support.transitions ) {
					if( ev.propertyName !== 'visibility' ) return;
					this.removeEventListener( transEndEventName, onEndTransitionFn );
				}
				classie.remove( overlay, 'close' );
			};
			if( support.transitions ) {
				overlay.addEventListener( transEndEventName, onEndTransitionFn );
			}
			else {
				onEndTransitionFn();
			}
		}
		else if( !classie.has( overlay, 'close' ) ) {
			classie.add( overlay, 'open' );
		}
	}

  $('nav a').click(function(){
    toggleOverlay();
  })

	triggerBttn.addEventListener( 'click', toggleOverlay );
	closeBttn.addEventListener( 'click', toggleOverlay );
})();

//Smooth scroll

$(function() {
  $('a[href*=#]:not([href=#])').click(function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top
        }, 1000);
        return false;
      }
    }
  });
});

//Share Menu

$(document).ready(function(){
  var $shareButtons=$(".share-button")
    ,$toggleButton=$(".share-toggle-button")

    ,menuOpen=false
    ,buttonsNum=$shareButtons.length
    ,buttonsMid=(buttonsNum/2)
    ,spacing=75
  ;

  function openShareMenu(){
    TweenMax.to($toggleButton,0.1,{
      scaleX:1.2,
      scaleY:0.6,
      ease:Quad.easeOut,
      onComplete:function(){
        TweenMax.to($toggleButton,.8,{
          scale:0.6,
          ease:Elastic.easeOut,
          easeParams:[1.1,0.6]
        })
        TweenMax.to($toggleButton.children(".share-icon"),.8,{
          scale:1.4,
          ease:Elastic.easeOut,
          easeParams:[1.1,0.6]
        })
      }
    })
    $shareButtons.each(function(i){
      var $cur=$(this);
      var pos=i-buttonsMid;
      if(pos>=0) pos+=1;
      var dist=Math.abs(pos);
      $cur.css({
        zIndex:buttonsMid-dist
      });
      TweenMax.to($cur,1.1*(dist),{
        x:pos*spacing,
        scaleY:0.6,
        scaleX:1.1,
        ease:Elastic.easeOut,
        easeParams:[1.01,0.5]
      });
      TweenMax.to($cur,.8,{
        delay:(0.2*(dist))-0.1,
        scale:0.6,
        ease:Elastic.easeOut,
        easeParams:[1.1,0.6]
      })
        
      TweenMax.fromTo($cur.children(".share-icon"),0.2,{
        scale:0
      },{
        delay:(0.2*dist)-0.1,
        scale:1,
        ease:Quad.easeInOut
      })
    })
  }
  function closeShareMenu(){
    TweenMax.to([$toggleButton,$toggleButton.children(".share-icon")],1.4,{
      delay:0.1,
      scale:1,
      ease:Elastic.easeOut,
      easeParams:[1.1,0.3]
    });
    $shareButtons.each(function(i){
      var $cur=$(this);
      var pos=i-buttonsMid;
      if(pos>=0) pos+=1;
      var dist=Math.abs(pos);
      $cur.css({
        zIndex:dist
      });

      TweenMax.to($cur,0.4+((buttonsMid-dist)*0.1),{
        x:0,
        scale:.95,
        ease:Quad.easeInOut,
      });
        
      TweenMax.to($cur.children(".share-icon"),0.2,{
        scale:0,
        ease:Quad.easeIn
      });
    })
  }

  function toggleShareMenu(){
    menuOpen=!menuOpen

    menuOpen?openShareMenu():closeShareMenu();
  }
  $toggleButton.on("mousedown",function(){
    toggleShareMenu();
  })
  
})