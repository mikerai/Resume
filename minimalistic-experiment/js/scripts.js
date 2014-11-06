/*$('a[href*=#]:not([href=#])').click(function(e) {
    e.preventDefault();
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') 
        || location.hostname == this.hostname) {
        var target = $(this.hash);
        target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
           if (target.length) {
             $('html,body').animate({
                 scrollTop: target.offset().top-64
            }, 1000);
        }
    }
});*/

$('a').click(function(){
    $('html, body').animate({
        scrollTop: $( $(this).attr('href') ).offset().top-64
    }, 987);
    return false;
});

$(function(){
    var d = $('#main');
    var dPosTop = d.offset().top+20;
    var win = $(window);
    win.scroll(function(e){
        var scrollTop = win.scrollTop();
        if(scrollTop <= dPosTop){
         /* d.show(669); */
         //d.css("visibility","visible");
         d.css({opacity: 0, visibility: "visible"}).animate({opacity: 1.0}, 1597);
        }
    });

});

$(function(){
  $('button').click(function(){
      $('nav').slideToggle();
  });
});

$("#main").on("click", function(e){
    e.preventDefault();
    //$('nav').css("display","none");
    $('nav').slideUp();
});