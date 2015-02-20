//Custom scripts

$("input.menuB").on("click", function(e){
    e.preventDefault();
    $('nav').slideToggle();
});

// SPY MENU Cache selectors

$('nav a').click(function(){
    $('html, body').animate({
        scrollTop: $( $(this).attr('href') ).offset().top-64
    }, 987);
    $('nav.mobile').slideToggle();
    return false;
});