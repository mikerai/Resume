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
});

$('a').click(function(){
    $('html, body').animate({
        scrollTop: $( $(this).attr('href') ).offset().top-64
    }, 987);
    return false;
});*/

$(function(){
    var d = $('#main');
    //var mobMen = $('nav');
    var men = $('div.row.lh-m.menu.fixed.hidden-xs');
    var dPosTop = $('body').offset().top+30;
    var win = $(window);
    win.scroll(function(e){
        var scrollTop = win.scrollTop();
        if(scrollTop >= dPosTop){
          //d.show(669); 
         //d.css("visibility","visible");
         //d.css({opacity: 0, visibility: "visible"}).animate({opacity: 1.0}, 1597);
         d.addClass("show");
         men.addClass("bs");
         $('p.simple').css("color","#807F83");
      //   mobMen.slideUp();
        }
        else if(scrollTop < dPosTop) {
          d.removeClass("show");
          men.removeClass("bs");
          $('p.simple').css("color","#000");
        }
        if (($(document).height() - $(window).height()) - $(window).scrollTop() < 2 ){
          $('footer').addClass("bs");
        }

        else if (($(document).height() - $(window).height()) - $(window).scrollTop() > 2 ){
          $('footer').removeClass("bs");
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
    $('nav').slideUp();
});

// Cache selectors
var lastId,
    topMenu = $(".menu, nav, footer"),
    topMenuHeight = topMenu.outerHeight()+67,
    // All list items
    menuItems = topMenu.find("a"),
    // Anchors corresponding to menu items
    scrollItems = menuItems.map(function(){
      var item = $($(this).attr("href"));
      if (item.length) { return item; }
    });

// Bind click handler to menu items
// so we can get a fancy scroll animation
menuItems.click(function(e){
  var href = $(this).attr("href"),
      offsetTop = href === "#" ? 0 : $(href).offset().top-66;
  $('html, body').stop().animate({ 
      scrollTop: offsetTop
  }, 987);
  e.preventDefault();
  $('nav').slideUp();
});

// Bind to scroll
$(window).scroll(function(){
   // Get container scroll position
   var fromTop = $(this).scrollTop()+topMenuHeight;
   
   // Get id of current scroll item
   var cur = scrollItems.map(function(){
     if ($(this).offset().top < fromTop)
       return this;
   });
   // Get the id of the current element
   cur = cur[cur.length-1];
   var id = cur && cur.length ? cur[0].id : "";
   
   if (lastId !== id) {
       lastId = id;
       // Set/remove active class
       menuItems
         .parent().removeClass("active")
         .end().filter("[href=#"+id+"]").parent().addClass("active");
   }                   
});