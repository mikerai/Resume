$(function(){
	$(document).foundation();

	function isMobile() {
	  if ($(window).width() <= 767) {
	    return true;
	  } else {
	    return false;
	  }
	}

	function isTablet() {
	  if ($(window).width() <= 1024 && $(window).width() >= 768) {
	    return true;
	  } else {
	    return false;
	  }
	}

	function isDesktop() {
	  if ($(window).width() >= 1025) {
	    return true;
	  } else {
	    return false;
	  }
	}

  /*if (isMobile()) {
    $('.linkedin, .cd-top').remove();
  }*/

  if (isTablet()) {
  }

  //----- Parallax for Desktop

	if (isDesktop()) {
		var lastScrollY = 0,
    ticking = false,
    bgElm = document.getElementById('parallax-bg'),
    speedDivider = 2;

		// Update scroll value and request tick
		var doScroll = function() {
		  lastScrollY = window.pageYOffset;
		  requestTick();
		};

		window.addEventListener('scroll', doScroll, false);

		var requestTick = function() {
		  if (!ticking) {
		    window.requestAnimationFrame(updatePosition);
		    ticking = true;
		  }
		};

		var updatePosition = function() {
	  var translateValue = lastScrollY / speedDivider;

	  // We don't want parallax to happen if scrollpos is below 0
	  if (translateValue < 0)
	    translateValue = 0;

	  translateY3d(bgElm, translateValue);

	  // Stop ticking
	  ticking = false;
		};

		// Translates an element on the Y axis using translate3d
		// to ensure that the rendering is done by the GPU
		var translateY3d = function(elm, value) {
		  var translate = 'translate3d(0px,' + value + 'px, 0px)';
		  elm.style['-webkit-transform'] = translate;
		  elm.style['-moz-transform'] = translate;
		  elm.style['-ms-transform'] = translate;
		  elm.style['-o-transform'] = translate;
		  elm.style.transform = translate;
		};
	}

  // ---- Back to top desktop and tablet 

  /*jQuery(document).ready(function($){
    // browser window scroll (in pixels) after which the "back to top" link is shown
    var offset = 400,
    //browser window scroll (in pixels) after which the "back to top" link opacity is reduced
    offset_opacity = 1200,
    //duration of the top scrolling animation (in ms)
    scroll_top_duration = 700,
    //grab the "back to top" link
    $back_to_top = $('.cd-top');

    //hide or show the "back to top" link
    $(window).scroll(function(){
      ( $(this).scrollTop() > offset ) ? $back_to_top.addClass('cd-is-visible') : $back_to_top.removeClass('cd-is-visible cd-fade-out');
      if( $(this).scrollTop() > offset_opacity ) { 
        $back_to_top.addClass('cd-fade-out');
      }
    });

    //smooth scroll to top
    $back_to_top.on('click', function(event){
      event.preventDefault();
      $('body,html').animate({
        scrollTop: 0 ,
        }, scroll_top_duration
      );
    });
  });*/

  $(this).on('click', '.mobile .accordion-title', function () {
    $('.mobile .accordion .accordion-item').toggleClass('is-active');
    $('.mobile .accordion .accordion-content').slideToggle();
  });

  //---- Back to top mobile

  $(this).on('click', '.footer .back-to-top a', function () {
    $('body').stop().animate({ scrollTop: 0 }, 700, 'swing');
  });

});



$(document).ready(function () {
  $(document).on("scroll", onScroll);
  
  //smoothscroll
  $('a[href^="#"]').on('click', function (e) {
      e.preventDefault();
      $(document).off("scroll");
      
      $('a').each(function () {
          $(this).removeClass('active');
      });
      $(this).addClass('active');
    
      var target = this.hash,
          menu = target;
      $target = $(target);
      $('html, body').stop().animate({
          'scrollTop': $target.offset().top-60
      }, 1000, 'swing', function () {
          window.location.hash = target;
          $(document).on("scroll", onScroll);
          $('.mobile .accordion .accordion-content').slideUp();
          $('.mobile .accordion .accordion-item.is-active').removeClass('is-active');
      });
  });
});

function onScroll(event){
  var scrollPos = $(document).scrollTop();
  $('#ha-header nav a').each(function () {
      var currLink = $(this);
      var refElement = $(currLink.attr("href"));
      if (refElement.position().top-62 <= scrollPos && refElement.position().top + refElement.height() > scrollPos) {
          $('#ha-header nav a').removeClass("active");
          currLink.addClass("active");
      }
      else{
          currLink.removeClass("active");
      }
  });
}

// video js

$( document ).ready(function() {

    scaleVideoContainer();

    initBannerVideoSize('.video-container .poster img');
    initBannerVideoSize('.video-container .filter');
    initBannerVideoSize('.video-container video');

    $(window).on('resize', function() {
        scaleVideoContainer();
        scaleBannerVideoSize('.video-container .poster img');
        scaleBannerVideoSize('.video-container .filter');
        scaleBannerVideoSize('.video-container video');
    });

});

function scaleVideoContainer() {

    var height = $(window).height() + 5;
    var unitHeight = parseInt(height) + 'px';
    $('.homepage-hero-module').css('height',unitHeight);

}

function initBannerVideoSize(element){

    $(element).each(function(){
        $(this).data('height', $(this).height());
        $(this).data('width', $(this).width());
    });

    scaleBannerVideoSize(element);

}

function scaleBannerVideoSize(element){

    var windowWidth = $(window).width(),
    windowHeight = $(window).height() + 5,
    videoWidth,
    videoHeight;

    console.log(windowHeight);

    $(element).each(function(){
        var videoAspectRatio = $(this).data('height')/$(this).data('width');

        $(this).width(windowWidth);

        if(windowWidth < 1000){
            videoHeight = windowHeight;
            videoWidth = videoHeight / videoAspectRatio;
            $(this).css({'margin-top' : 0, 'margin-left' : -(videoWidth - windowWidth) / 2 + 'px'});

            $(this).width(videoWidth).height(videoHeight);
        }

        $('.homepage-hero-module .video-container video').addClass('fadeIn animated');

    });
}