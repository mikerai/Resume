//Custom scripts

$(function () {
    if ($(window).width() < 642) {
     $('body').addClass('mobile');
  }
 	else {
    $('body').removeClass('mobile');
    $('nav').css('display:block;');
  }
});

$(window).resize(function () {
    if ($(window).width() < 642) {
     $('body').addClass('mobile');
  }
 	else {
    $('body').removeClass('mobile');
    $('nav').css('display:block;');
  }
});

$("input.menuB").on("click", function(e){
    e.preventDefault();
    $('.mobile nav').slideToggle();
});

$('section, footer').on("click", function(e){
	e.preventDefault();	
	$('.mobile nav').slideUp();
});

// SPY MENU Cache selectors

$('nav a, footer a').click(function(){
    $('html, body').animate({
        scrollTop: $( $(this).attr('href') ).offset().top-76
    }, 987);
    $('.mobile nav').slideToggle();
    return false;
});