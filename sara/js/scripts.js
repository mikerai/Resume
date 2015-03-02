//Custom scripts

$(document).foundation();

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

//Fader function

$(function() {
  var faderIndex = 0,
        faders = $('div.intro > h2');
    function nextFade() {
        $(faders[faderIndex]).fadeOut(1500, function() {
            faderIndex++;
            if (faderIndex >= faders.length)
                faderIndex = 0;
            $(faders[faderIndex]).fadeIn(3500, nextFade);
        });
    }
    nextFade();
});

// SPY MENU Cache selectors

$('nav a, aside a, footer a').click(function(){
    $('html, body').animate({
        scrollTop: $( $(this).attr('href') ).offset().top
    }, 987);
    $('.mobile nav').slideToggle();
    return false;
});

// Cache selectors
var lastId,
    topMenu = $("aside, nav"),
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