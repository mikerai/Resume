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
});

$(document).ready( function() {
    $('#bg').blurjs({
        source: 'body',
        radius: 70,
        overlay: 'rgba(0, 0, 0, .2)'
    });
});*/

/*$(document).ready(function() {
  //$("body").fadeIn(1000);
    setTimeout(function(){
        //$("#bg").fadeIn(2584);
        $("body, #main").animate({ scrollTop: $('body').offset().top+60}, 2584);
    },4181);
  //$("body, #bg").animate({ scrollTop: $('body').offset().top+60}, 2584);
});*/

$('body').click(function() {
   //$('div.fixed.center.visible-xs').addClass("show");
});


$("a.btn-animated-lg").on("click", function(e){
    e.preventDefault();
    if ($('nav').css('display') === 'block') {
       //$('input.menuB').attr('src', 'img/menu-B.png');
       $('div.fixed.center.visible-xs.show').css('background-color', 'transparent');
    }
   else {
    $('div.fixed.center.visible-xs.show').css('background-color', 'rgba(255,255,255,0.95)');
    //$('input.menuB').attr('src', 'img/menu-C.png');
   }
});

$(function(){
    var d = $('#main');
    //var mobMen = $('nav');
    var men = $('div.row.lh-m.menu.fixed.hidden-xs');
    var menMob = $('div.fixed.center.visible-xs');
    var pSimple = $('p.simple');
    var dPosTop = $('body').offset().top+60;
    var win = $(window);
    win.scroll(function(e){
        var scrollTop = win.scrollTop();
        if(scrollTop >= dPosTop){
         d.addClass("show");
         men.addClass("bs");
         menMob.addClass("show");
         pSimple.css("text-shadow","10px 10px 20px #1D6250");
         
      //   mobMen.slideUp();
        }
        else if(scrollTop < dPosTop && scrollTop > dPosTop-50) {
          d.removeClass("show");
          menMob.removeClass("show");
          men.removeClass("bs");
          pSimple.css("text-shadow","none");
        }

        else if(scrollTop > dPosTop-60) {
            pSimple.css("color","#ffffff");
        }

        if (($(document).height() - $(window).height()) - $(window).scrollTop() < 2 ){
          $('footer').addClass("bs");
        }

        else if (($(document).height() - $(window).height()) - $(window).scrollTop() > 2 ){
          $('footer').removeClass("bs");
        }
    });

});

$.fn.isOnScreen = function(){
    
    var win = $(window);
    
    var viewport = {
        top : win.scrollTop(),
        left : win.scrollLeft()
    };
    viewport.right = viewport.left + win.width();
    viewport.bottom = viewport.top + win.height();
    
    var bounds = this.offset();
    bounds.right = bounds.left + this.outerWidth();
    bounds.bottom = bounds.top + this.outerHeight();
    
    return (!(viewport.right < bounds.left || viewport.left > bounds.right || viewport.bottom < bounds.top || viewport.top > bounds.bottom));
    
};

var Box = {
    Update: function(){
      $.each($("div#skills.row"), function(){
            if ($("div#skills.row").isOnScreen()) {
              //console.log("is visible");
                 $('p.consulting').css({'color':'#ffffff', 'text-shadow':'10px 10px 20px #2577BE'});
            }    
            else{
              //console.log("is NOT visible");
                $('p.consulting').css({'color':'transparent', 'text-shadow':'none'});
            }
        });
        $.each($("div#portfolio.row"), function(){
            if ($("div#portfolio.row").isOnScreen()) {
              //console.log("is visible");
                 $('p.simplify').css({'color':'#ffffff', 'text-shadow':'10px 10px 20px #1D6250'});
            }    
            else{
              //console.log("is NOT visible");
                $('p.simplify').css({'color':'transparent', 'text-shadow':'none'});
            }
        });
        
        $.each($("div#contact.row"), function(){
            if ($("div#contact.row").isOnScreen()) {
              //console.log("is visible");
                 $('p.ksimple').css({'color':'#ffffff', 'text-shadow':'10px 10px 20px #2577BE'});
            }    
            else{
              //console.log("is NOT visible");
                $('p.ksimple').css({'color':'transparent', 'text-shadow':'none'});
            }
        });
    }    
}

Box.Update();

$(window).scroll(function () {
     Box.Update();
});

$(function(){
  $('a.btn-animated-lg').click(function(){
      $('nav').slideToggle();
  });
});

$(function(){
  $('button.tweets').click(function(){
      $('#tweets').slideToggle();
  });
});

$("button.tweets").click(function () {
  $(this).text(function(i, v){
    return v === 'Hide my tweets' ? 'View my tweets' : 'Hide my tweets'
  })
});

$("#main, #presentation").on("click", function(e){
    e.preventDefault();
    $('nav').slideUp();
    //$('input.menuB').attr('src', 'img/menu-B.png');
    $('div.fixed.center.visible-xs.show').css('background-color', 'transparent');

    if ($('.btn-animated-lg').hasClass("closed")){
        $('.btn-animated-lg').removeClass("closed");        
    }
    else
    {
      $('.btn-animated-lg').addClass("").removeClass("");
    }    
});

$('p.simple').on("click", function(e){
  e.preventDefault();
  var divID = '#main' + this.id;
    $('html, body').animate({
        scrollTop: $(divID).offset().top-34
    }, 987);
});

// Cache selectors
var lastId,
    topMenu = $(".menu, nav, #skills"),
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
  $(".btn-animated, .btn-animated-lg, .btn-anim-three, .btn-anim-three-lg").toggleClass( "closed" );
  $('input.menuB').attr('src', 'img/menu-B.png');
  $('div.fixed.center.visible-xs.show').css('background-color', 'transparent');
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

//Footer smooth scroll

$(function() {
  $('footer a, a.arrow-wrap').click(function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {
        $('html,body').animate({
          scrollTop: target.offset().top-66
        }, 987);
        return false;
      }
    }
  });
});

//Animated close button

$( ".btn-animated, .btn-animated-lg, .btn-anim-three, .btn-anim-three-lg" ).on( "click", function() {
  $(this).toggleClass( "closed" );
});

// Scroll helper

//this is where we apply opacity to the arrow
$(window).scroll( function(){

  //get scroll position
  var topWindow = $(window).scrollTop();
  //multipl by 1.5 so the arrow will become transparent half-way up the page
  var topWindow = topWindow * 5;
  
  //get height of window
  var windowHeight = $(window).height();
      
  //set position as percentage of how far the user has scrolled 
  var position = topWindow / windowHeight;
  //invert the percentage
  position = 1 - position;

  //define arrow opacity as based on how far up the page the user has scrolled
  //no scrolling = 1, half-way up the page = 0
  $('.arrow-wrap').css('opacity', position);

});

//Code stolen from css-tricks for smooth scrolling:

/*$(document).ready(function() {

  function filterPath(string) {
  return string
    .replace(/^\//,'')
    .replace(/(index|default).[a-zA-Z]{3,4}$/,'')
    .replace(/\/$/,'');
  }
  var locationPath = filterPath(location.pathname);
  var scrollElem = scrollableElement('html', 'body');
 
  $('a[href*=#]').each(function() {
    var thisPath = filterPath(this.pathname) || locationPath;
    if (  locationPath == thisPath
    && (location.hostname == this.hostname || !this.hostname)
    && this.hash.replace(/#/,'') ) {
      var $target = $(this.hash), target = this.hash;
      if (target) {
        var targetOffset = $target.offset().top+10;
        $(this).click(function(event) {
          event.preventDefault();
          $(scrollElem).animate({scrollTop: targetOffset}, 987, function() {
            location.hash = target;
          });
        });
      }
    }
  });
 
  // use the first element that is "scrollable"
  function scrollableElement(els) {
    for (var i = 0, argLength = arguments.length; i <argLength; i++) {
      var el = arguments[i],
          $scrollElement = $(el);
      if ($scrollElement.scrollTop()> 0) {
        return el;
      } else {
        $scrollElement.scrollTop(1);
        var isScrollable = $scrollElement.scrollTop()> 0;
        $scrollElement.scrollTop(0);
        if (isScrollable) {
          return el;
        }
      }
    }
    return [];
  }

}); */

//Contact Form

$(document).ready(function () {
            //$("button[type=submit]").attr("disabled", "disabled");
            $("#commentForm").validate({
                rules: {
                    name: { 
                      required: true,
                      minlength: 2
                    },
                    email: {
                      required: true,
                      email: true
                    },
                    comment: {
                        required: true,
                        minlength: 5
                    }
                  },
                  messages: {
                    name: {
                      required: "Por favor indicanos tu nombre",
                      minlength: "Al menos necesitamos 2 iniciales"
                    },
                    email: {
                      required: "Nos hace falta tu direccion de correo electronico para poder responderte",
                      email: "La direccion de correo electronico debe estar en formato nombre@dominio.com..."
                    },
                    comment: {
                      required: "Dejanos un mensaje",
                      minlength: "Por favor escribe algo en el campo de mensaje"
                    }
                  }, 
            });

            /*$('#commentForm').bind('change keyup', function() {
                if($(this).validate().checkForm()) {
                    $('button[type=submit]').attr('disabled', false);
                } else {
                    $('button[type=submit]').attr('disabled', true);
                }
            });*/

            $("button.submit").click(function () {
                if (!$("#commentForm").validate()) { // Not Valid
                    return false;
                } else {
                    //$("button.submit").prop('disabled', false);
                    $("#commentForm").submit()
                }
            });
        });

//Contact error removal and success

        $(document).on('submit', 'form#commentForm', function (e) {
            e.preventDefault();
            $('form#commentForm .error').remove();
            var hasError = false;
            if (!hasError) {
                $('form#commentForm input.submit').fadeOut('normal', function () {
                    $(this).parent().append('');
                });
                var formInput = $(this).serialize();
                $.post($(this).attr('action'), formInput, function (data) {
                    $('form#commentForm').slideUp("fast", function () {
                        $(this).before('<p class="success">¡Gracias! Tu correo ha sido exitosamente enviado. Nos pondremos en contacto a la brevedad para atenderte de la mejor manera posible.</p>');
                    });
                });
            }
            return false;
});