$(document).ready(function(){
		    $('a.anchor').click(function(){
		       var anchorAttr = $(this).attr('data-title');
		       var anchorPos = $('#' + anchorAttr).offset().top;

		       $('html,body').stop().animate({scrollTop: anchorPos},1597);
		    });

		   var backtoTop = $('.control a.backtotop');
		   backtoTop.hide();  

		   $(window).scroll(function () {
					if ($(this).scrollTop() > 100) {
						backtoTop.fadeIn();
					}
					  
					else {
						backtoTop.fadeOut();
					}
				});

		    backtoTop.click(function (e) {
		        e.preventDefault();
		        $('body,html').stop().animate({
						scrollTop: 0
					}, 1597);

		    });
		
		});