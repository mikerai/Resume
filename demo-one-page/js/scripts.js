//Custom scripts

$("input.menuB").on("click", function(e){
    e.preventDefault();
    $('nav.mobile').slideToggle();
});

// SPY MENU Cache selectors

$(window).resize(function () {
    if ($(window).width() < 640) {
     $('nav').addClass('mobile');
  }
 	else {
    $('nav').removeClass('mobile');
 }
});

$('nav a').click(function(){
    $('html, body').animate({
        scrollTop: $( $(this).attr('href') ).offset().top-64
    }, 987);
    $('nav.mobile').slideToggle();
    return false;
});

