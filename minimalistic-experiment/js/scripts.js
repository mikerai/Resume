$('a[href*=#]:not([href=#])').click(function(e) {
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
});

$(function(){
    var d = $('#main');
    var dPosTop = d.offset().top+10;
    var win = $(window);
    win.scroll(function(e){
        var scrollTop = win.scrollTop();
        if(scrollTop <= dPosTop){
          d.show(669);
        }
    });

});