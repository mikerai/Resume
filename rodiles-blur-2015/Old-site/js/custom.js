jQuery.noConflict();

jQuery(document).ready(function($){
								
	initDo();
	
	//TINY NAV...
	$('#main-menu').tinyNav({
		active: 'current_page_item'
	});
	
	//MAIN MENU....
	$('#smoothmenu ul li.current_page_item a:first').addClass('current');

	//LAST WORD COLORING...
	$('#secondary h3.widget-title , .strip-title span.strip-inner').each(function(){
		var cthis = $(this);
		var ctext = $.trim(cthis.text());
		var cwords = ctext.split(/\s+/);
	    var lastWord = cwords.pop();
	    if(cwords.length > 0) {
			cwords.push('<span class="wlast">' + lastWord + '</span>');
			cthis.html(cwords.join(' '));
	    }
	});
	
	//TEXTBOX CLEAR...
	$('input.Textbox, textarea.Textbox').focus(function() {
	  if (this.value == this.title) {
		 $(this).val("");
	  }}).blur(function() {
	  if (this.value == "") {
	     $(this).val(this.title);
	  }
	});
	
	//PORTFOLIO HOVER DIV...
	$('ul.da-thumbs > li').hoverdir();
	
	//PORTFOLIO ISOTOPE...
	var $container = $('.portfolio-container');
	$container.isotope({ filter: '*', animationOptions: { duration: 750, easing: 'linear', queue: false } });
	
	$('.category-filter a').click(function(){ 
		$('.category-filter').find('a').removeClass('active'); 
		$(this).addClass('active'); 
		var selector = $(this).attr('data-filter');
		$container.isotope({
			filter: selector,
			animationOptions: {
				duration: 750,
				easing: 'linear',
				queue: false
			}
		});
		return false;
	});
	
	//PRETTYPHOTO...
	$("a[rel^='prettyPhoto']").prettyPhoto({ 
		theme:"dark_rounded", 
		autoplay_slideshow: false, 
		overlay_gallery: false, 
		show_title: false 
	});
	
	//TABS...
	if($('ul.tabs-frame').length > 0){
	  $('ul.tabs-frame').tabs('> .tabs-frame-content');
	}
	
	//HOVER FADE...
	$('.hover_fade').live('hover', function(e) {
		if( e.type == 'mouseenter' )
			$(this).stop().animate({opacity:0.7}, 400);

		if( e.type == 'mouseleave' )
			$(this).stop().animate({opacity:1}, 400);
	});

	//HOVER BRIGHT...
	$('.hover_bright').find('img').css('opacity', '0.5');
	
	$('.hover_bright img').live('hover', function(e) {
		if( e.type == 'mouseenter' )
			$(this).stop().animate({opacity:1}, 400);

		if( e.type == 'mouseleave' )
			$(this).stop().animate({opacity:0.5}, 400);
	});

	//LOADING TWEETS...
	$('#tweetbox').html('');	
	$('#tweetbox').miniTwitter({username: 'rodilesdemexico', limit: 3});
	
	//CYCLE TESTIMONIAL...
	$('.widget-testimonial').each(function() {
		var cycle =	$(this).find('.cycle_fade');							   
		var controls = $(this).find('.cycle_controls');
		
		cycle.cycle({
			timeout: 0,
			speed: 2000,
			fx: 'fade',
			next: controls.find('.next-btn'),
			prev: controls.find('.prev-btn')
		});
	}); 	
	
	//PORTFOLIO SINGLE...
    $('#pcycle_slider').cycle({
        fx:     'fade',
        speed:  'normal',
        timeout: 3000,
        pager:  '#pcycle-controls'
    });
	
	//FOOTER NAV LINE HIDE...
	$('#foot-menu li:last').addClass('last');
});
//ACCORDION...
function initDo(){
	jQuery(".accordion div.holder").each(function(){
		jQuery(this).hide();
	});
	jQuery(".accordion").find('div.holder:first').show();
	jQuery(".accordion").find('li a:first').addClass("active");
	
	jQuery(".accordion li a").click(function(){
		var checkElement = jQuery(this).next();									  
		if((checkElement.is('div.holder')) && (checkElement.is(':visible'))) {
	        return false;
        }
		if((checkElement.is('div.holder')) && (!checkElement.is(':visible'))) {
			 jQuery(this).parent().parent().find('div.holder:visible').slideUp('normal');
			 checkElement.slideDown('normal');
			 jQuery(this).parent().parent().find('a').removeClass('active');		
	 		 jQuery(this).addClass('active');
			 return false;
		}
    });	
}