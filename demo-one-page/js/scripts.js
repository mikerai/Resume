//Custom scripts

$(function () {
    if ($(window).width() < 642) {
     $('body').addClass('mobile');
  }
 	else {
    $('body').removeClass('mobile');
  }
});

$(window).resize(function () {
    if ($(window).width() < 642) {
     $('body').addClass('mobile');
  }
 	else {
    $('body').removeClass('mobile');
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

$('nav a').click(function(){
    $('html, body').animate({
        scrollTop: $( $(this).attr('href') ).offset().top-64
    }, 987);
    $('.mobile nav').slideToggle();
    return false;
});