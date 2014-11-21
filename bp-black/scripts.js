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

$(document).ready( function() {
    $('body').blurjs({
        source: 'body',
        radius: 50,
        overlay: 'rgba(0, 0, 0, .2)'
    });
});

/*$(document).ready(function() {
  //$("body").fadeIn(1000);
    setTimeout(function(){
        //$("#bg").fadeIn(2584);
        $("body, #main").animate({ scrollTop: $('body').offset().top+60}, 2584);
    },4181);
  //$("body, #bg").animate({ scrollTop: $('body').offset().top+60}, 2584);
});*/


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
          //d.show(669); 
         //d.css("visibility","visible");
         //d.css({opacity: 0, visibility: "visible"}).animate({opacity: 1.0}, 1597);
         d.addClass("show");
         men.addClass("bs");
         menMob.css("box-shadow","1px 1px 15px #888888");
         //pSimple.css("color","#ffffff");
         //pSimple.css("text-shadow","0 0 8px #807F83");
         //pSimple.css("text-shadow","0 0 20px #15A8C6");
         pSimple.css("text-shadow","0 0 20px #CC6699");
         
      //   mobMen.slideUp();
        }
        else if(scrollTop < dPosTop && scrollTop > dPosTop-50) {
          d.removeClass("show");
          men.removeClass("bs");
          menMob.css("box-shadow","none");
          //pSimple.css("color","#15A8C6");
          //pSimple.css("color","#CC6699");
          
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

$('div#resume.row').click(function(){
    alert($(this).isOnScreen());
});

var Box = {
    Update: function(){
        $.each($("div#resume.row"), function(){
            if ($("div#resume.row").isOnScreen()) {
              //console.log("is visible");
                 //$('p.simplify').css("color","#fff");
                 $('p.simplify').css({'color':'#fff', 'text-shadow':'0 0 20px #33CCFF'});
            }    
            else{
              //console.log("is NOT visible");
                $('p.simplify').css({'color':'#33CCFF', 'text-shadow':'none'});
            }
        });
        $.each($("div#ios.row"), function(){
            if ($("div#ios.row").isOnScreen()) {
              //console.log("is visible");
                 //$('p.simplify').css("color","#fff");
                 $('p.ksimple').css({'color':'#fff', 'text-shadow':'0 0 20px #99CC66'});
            }    
            else{
              //console.log("is NOT visible");
                $('p.ksimple').css({'color':'#99CC66', 'text-shadow':'none'});
            }
        });
    }    
}

Box.Update();

$(window).scroll(function () {
     Box.Update();
});

$(function(){
  $('button.menuB').click(function(){
      $('nav').slideToggle();
  });
});

$(function(){
  $('button.tweets').click(function(){
      $('#tweets').slideToggle();
  });
});

$("#bg").on("click", function(e){
    e.preventDefault();
    $('nav').slideUp();
});

/*$('p.simple').click(function () {
    var divID = '#bg' + this.id;
    $('html, body').animate({
        scrollTop: $(divID).offset().top-34
    }, 2584);
});*/

$('p.simple').on("click", function(e){
  e.preventDefault();
  var divID = '#bg' + this.id;
    $('html, body').animate({
        scrollTop: $(divID).offset().top-34
    }, 987);
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
                      required: "Please specify your name",
                      minlength: "At least two characters are required"
                    },
                    email: {
                      required: "We need your email address to contact you",
                      email: "Your email address must be in the format of name@domain.com"
                    },
                    comment: {
                      required: "You need to enter some message",
                      minlength: "Please add something"
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
            
                        $(this).before('<p class="success">Thank you! Your email was successfully sent. I will contact you as soon as possible.</p>');
            
                    });
            
                });
            
            }

            return false;

        });