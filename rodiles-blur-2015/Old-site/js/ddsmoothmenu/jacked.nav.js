// JavaScript Document
jQuery(document).ready(function() {	
								
	//DEFAULT CALLING...							
	jQuery.wiseguys();								
	
	jQuery(window).bind("debouncedresize", function() {
		jQuery.wiseguys();
	});
});

// plugin structure used so we can use the "$" sign safely
 (function($) {
		   
	var contWidth;
	var menuFirstLoad;
	var subArrow;
	var subArrowUp;
	var curMenu;
	
    // class constructor / "init" function
    $.wiseguys = function() {
		mainContainer = $('.container');
		contWidth = mainContainer.width();
		
		menuFirstLoad = true;
		//menu
		subArrow = $('#submenuArrow');
		subArrowUp = $('.arrow-up');
		curMenu = $('#smoothmenu #main-menu .current_page_item a');
	
	
		initMenu();
		checkMenuWidth();
	}

    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    //MENU
    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    function initMenu() {

        ddsmoothmenu.init({
            mainmenuid: "smoothmenu",
            orientation: 'h',
            classname: 'ddsmoothmenu',
            contentsource: "markup"
        });

        var topMenuLinks = $('#smoothmenu ul:first > li > a');
        var subMenuLinks = $('#smoothmenu ul > li ul > li > a');

        //Don't even ask :D
        var lastMenuWithSubmenu = $('#smoothmenu ul:first > li > ul:last').parent();
		

        //main menu links listeners to deal with arrow animation
        topMenuLinks.mouseenter(function(e) {

            clearTimeout(subArrowTimeout);
			menuFirstLoad = false;

            subArrowXPos = $(this).parent().position();
            subArrowDestWidth = $(this).parent().width();
            destArrowX = subArrowDestWidth / 2 - parseInt(subArrowUp.css('width'), 10) / 2;

            if ($(this).html() == $('#smoothmenu ul:first > li > ul:last').parent().find('a:first').html()) {
                subArrowDestWidth += 1;
            }

            subArrow.jacked({
                left: subArrowXPos.left,
                width: subArrowDestWidth,
                opacity: 1
            }, {
                duration: 500
            });

            subArrowUp.jacked({
                left: destArrowX
            }, {
                duration: 500
            });

        });

        topMenuLinks.mouseleave(function(e) {
            if (!$(this).hasClass('selected')) {

                subArrowXPos = curMenu.parent().position();
                subArrowDestWidth = curMenu.parent().width();
                destArrowX = subArrowDestWidth / 2 - parseInt(subArrowUp.css('width'), 10) / 2;

                subArrow.jacked({
                    left: subArrowXPos.left,
                    width: subArrowDestWidth,
                    opacity: 1
                }, {
                    duration: 500
                });

                subArrowUp.jacked({
                    left: destArrowX
                }, {
                    duration: 500
                });

            } else {
                subArrowTimeout = setTimeout(clearSubArrow, 100);
            }

        });

        //Handle menu arrow when leaving submenu
        subMenuLinks.mouseout(function(e) {

            subArrowTimeout = setTimeout(clearSubArrow, 100);
        });

        subMenuLinks.mouseover(function(e) {

            clearTimeout(subArrowTimeout);
        });

        //set arrow first position
        subArrowTimeout = setTimeout(clearSubArrow, 2000);
    }

    //Remove menu arrow
    function clearSubArrow() {

        subArrowXPos = curMenu.parent().position();
        subArrowDestWidth = curMenu.parent().width();
        destArrowX = subArrowDestWidth / 2 - parseInt(subArrowUp.css('width'), 10) / 2;

			subArrow.jacked({
				left: subArrowXPos.left,
				width: subArrowDestWidth,
				opacity: 1
			}, {
				duration: 500
			});
	
			subArrowUp.jacked({
				left: destArrowX
			}, {
				duration: 500
			});
    }

    function checkMenuWidth() {
		
/*      HANDLED CSS...

		var logoWidth = $('.logo').width() - 5;
        var availableWidth = contWidth - logoWidth;
        var menuWidth = $('.ddsmoothmenu').width();
        var mainMenu = $('.main-menu-container #smoothmenu #main-menu');
        var dropDown = $('.main-menu-container select.tinynav');
		var arrow = $('#submenuArrow');
		
        if (availableWidth >= menuWidth) {
            mainMenu.css({ 'visibility': 'visible' });
            dropDown.css({ 'display': 'none' });
			arrow.css({ 'display': 'block' });
        } else {
            arrow.css({ 'display': 'none' });
			mainMenu.css({ 'visibility': 'hidden' });
            dropDown.css({ 'display': 'inline-block' });
        } */
    }
})(jQuery);

/*
 * debouncedresize: special jQuery event that happens once after a window resize
 *
 * latest version and complete README available on Github:
 * https://github.com/louisremi/jquery-smartresize
 *
 * Copyright 2012 @louis_remi
 * Licensed under the MIT license.
 *
 * This saved you an hour of work? 
 * Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
 */
(function($){var $event=$.event,$special,resizeTimeout;$special=$event.special.debouncedresize={setup:function(){$(this).on("resize",$special.handler)},teardown:function(){$(this).off("resize",$special.handler)},handler:function(event,execAsap){var context=this,args=arguments,dispatch=function(){event.type="debouncedresize";$event.dispatch.apply(context,args)};if(resizeTimeout)clearTimeout(resizeTimeout);execAsap?dispatch():resizeTimeout=setTimeout(dispatch,$special.threshold)},threshold:150}})(jQuery);

/*
 * throttledresize: special jQuery event that happens at a reduced rate compared to "resize"
 *
 * latest version and complete README available on Github:
 * https://github.com/louisremi/jquery-smartresize
 *
 * Copyright 2012 @louis_remi
 * Licensed under the MIT license.
 *
 * This saved you an hour of work? 
 * Send me music http://www.amazon.co.uk/wishlist/HNTU0468LQON
 */
(function($){var $event=$.event,$special,dummy={_:0},frame=0,wasResized,animRunning;$special=$event.special.throttledresize={setup:function(){$(this).on("resize",$special.handler)},teardown:function(){$(this).off("resize",$special.handler)},handler:function(event,execAsap){var context=this,args=arguments;wasResized=true;if(!animRunning){setInterval(function(){frame++;if(frame>$special.threshold&&wasResized||execAsap){event.type="throttledresize";$event.dispatch.apply(context,args);wasResized=false;
frame=0}if(frame>9){$(dummy).stop();animRunning=false;frame=0}},30);animRunning=true}},threshold:0}})(jQuery);