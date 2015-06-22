jQuery.noConflict();
	$out = "";
	$turl = 'js/controlpanel/';
	for(var i = 1; i <= 16; i++){
		$img = 	$turl+"images/patterns/thumbs/pattern"+i+".jpg";	
		$out += '<div class="default-header">';
		$out += '<label>';
		$out += '<img src="'+ $img +'" alt="pattern'+i+'" title="pattern'+i+'"/>'
		$out += '</label>';
		$out += '</div>'; 
	}
	
	$str  = '<div id="control-panel">';
	$str += ' 	<div id="control-panel-main">';
	$str += ' 		<a id="control-close" href="#"></a>';
	$str += '		<div id="control-inner">';
	$str += '			<div class="clear"></div>';
	$str += '				<form name="frmpanel" class="controlform" method="post">';
	$str += '					 <label>Skin</label>';	
	$str += '					 <div class="available-styles">';
	$str += '					 	<div class="default-header"><label><img src="'+$turl+'images/skins/blue.jpg" alt="blue" title="blue"/></label></div>';
	$str += '					 	<div class="default-header"><label><img src="'+$turl+'images/skins/green.jpg" alt="green" title="green"/></label></div>';
	$str += '					 	<div class="default-header"><label><img src="'+$turl+'images/skins/grey.jpg" alt="grey" title="grey"/></label></div>';
	$str += '					 	<div class="default-header"><label><img src="'+$turl+'images/skins/orange.jpg" alt="orange" title="orange"/></label></div>';
	$str += '					 	<div class="default-header">&nbsp;</div>';
	$str += '					 	<div class="default-header"><label><img src="'+$turl+'images/skins/sandle.jpg" alt="sandle" title="sandle"/></label></div>';
	$str += '					 	<div class="default-header"><label><img src="'+$turl+'images/skins/violet.jpg" alt="violet" title="violet"/></label></div>';	
	$str += '					 </div>';
	$str += '					 <div class="clear"></div>';	
	$str += '					 <label>Layout</label>';
	$str += '					 <div class="available-layouts">';
	$str += 					 	'<div class="default-layout">';
	$str += 							'<label><img src="'+ $turl +'/images/boxed.jpg" alt="boxed" title="boxed"/></label>';
	$str += 						'</div>';
	$str += 						'<div class="default-layout">';
	$str += 							'<label><img src="'+ $turl +'/images/fullwidth.jpg" alt="fullwidth" title="fullwidth"/></label>';
	$str += 						'</div>';
	$str += '					 </div>';	
	$str += '					 <div class="clear"></div>';
	$str += '					 <label>Background Color</label>';
	$str += '					 <div class="available-skins"><div class="default-header"><div id="colorSelector"><div></div></div></div></div>';
	$str += '					 <div class="clear"></div>';
	$str += '					 <label>Background Patterns</label>';	
	$str += '					 <div class="available-headers">';
	$str +=							$out;											
	$str += '					 </div>';
	$str += '					 <div class="clear"></div>';
	$str += '				</form>'; 
	$str += '				<div class="clear"></div>';	
	$str += '		</div>';
	$str += '	</div>';	
	$str += '</div>';

jQuery(document).ready(function($){
	$("body").after($str);
	
	var $control_panel = $('#control-panel'),
	$control_close = $('#control-close');

	//CONTROL PANEL....
	if ( $.cookie('cookie_open') == 1 ) { 
		$control_panel.animate( { left: -179 } );
		$control_close.addClass('control-open');
	}
	
	//BACKGROUD COLOR...
	if ($.cookie('cookie_color') != null) {
		$('body').css('background-color', '#' + $.cookie('cookie_color'));
		$('#colorSelector div').css('backgroundColor', '#' + $.cookie('cookie_color'));
	} else {
		$('#colorSelector div').css('backgroundColor', '#ffffff');
	}
	
	//BACKGROUND IMAGE...
	if ($.cookie('cookie_image') != null) {
		$('body').css('background-image', 'url('+$turl+'images/patterns/'+$.cookie('cookie_image')+'.png)');
	}
	 
	//LAYOUT...
	if($.cookie('cookie_layout') != null) {
		var lt = $.cookie('cookie_layout');
		if(lt == "boxed") {
			$('body').addClass('boxed');
			$('body').css('background-image', 'url("images/pattern2.jpg")');
			$('.controlform .available-layouts .default-layout:first label img').addClass('selected');
		} 
		else if(lt == "fullwidth") {
			$('body').removeClass('boxed');
			$('.controlform .available-layouts .default-layout:last label img').addClass('selected');
		}
	} else {
		$('.controlform .available-layouts .default-layout:last label img').addClass('selected');
	}
	
	//SKIN...
	if($.cookie('cookie_skin') != null) {
		var sk = $.cookie('cookie_skin');
		$('#color_skin_css').attr('href', 'skins/'+sk+'/'+sk+'.css');
		$('.available-styles img[title="'+sk+'"]').addClass('selected');
	}
	else {
		$('.available-styles img[title="orange"]').addClass('selected');
	}
	
	//PANEL ANIMATION...
	$control_close.click(function(){
		if ( $(this).hasClass('control-open') ) {
			$control_panel.animate( { left: 0 } );
			$(this).removeClass('control-open');
			$.cookie('cookie_open', 0, { path: '/' });
		} else {
			$control_panel.animate( { left: -179 } );
			$(this).addClass('control-open');
			$.cookie('cookie_open', 1, { path: '/' });
		}
		return false;
	});
	
	//PATTERN CLICK EVENT...
	$('.available-headers .default-header img').click(function(){
		if($.cookie('cookie_layout') != 'boxed') {
			alert('Please select boxed layout first...');
			return;
		}
		
		$('.available-headers').find('img').removeClass('selected');
		var current = $(this).attr('title');
			
		$('body').css('background-image', 'url('+$turl+'images/patterns/'+current+'.png)');
		$(this).addClass('selected');
		$.cookie('cookie_image', current, { path: '/' } );
	});

	//LAYOUT CLICK EVENT...
	$('.available-layouts .default-layout img').click(function(){
		$('.available-layouts').find('img').removeClass('selected');
		var layout = $(this).attr('title');
		if(layout == "fullwidth") {
			$('body').removeClass('boxed');
			$('body').removeAttr('style');
		} else if(layout == "boxed") {
			$('body').addClass('boxed');
			$('body').css('background-image', 'url("images/pattern2.jpg")');
		}
		$.wiseguys();
		$(this).addClass('selected');
		$.cookie('cookie_layout', layout, { path: '/' } );
	});

	//SKIN CLICK EVENT...
	$('.available-styles .default-header img').click(function(){
		$('.available-styles').find('img').removeClass('selected');
		var style = $(this).attr('title');
		$('#color_skin_css').attr('href', 'skins/'+style+'/'+style+'.css');		
		$(this).addClass('selected');
		$.cookie('cookie_skin', style, { path: '/' } );
	});

	//COLOR SELECTOR WORKS...
	$('#colorSelector').ColorPicker({
		color: '#ffffff',
		onShow: function (colpkr) {
			if($.cookie('cookie_layout') != 'boxed') {
				alert('Please select boxed layout first...');
				return false;
			} else {
				$(colpkr).fadeIn(500);
				return false;
			}
		},
		onHide: function (colpkr) {
			$(colpkr).fadeOut(500);		
			return false;
		},
		onChange: function (hsb, hex, rgb) {
			$('#colorSelector div').css('backgroundColor', '#' + hex);
			$('body').css('background-color', '#' + hex);				
			$.cookie('cookie_color', hex, { path: '/' });
		}
	});
});	