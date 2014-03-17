// for skill chat jquary
$(document).ready(function(e) {
//var windowBottom = $(window).height();
var index=0;
$(document).scroll(function(){
	var top = $('.skills').height()-$(window).scrollTop();
	console.log(top)
	if(top<-1204){
		if(index==0){	
			
			$('.chart').easyPieChart({
				easing: 'easeOutBounce',
				onStep: function(from, to, percent) {
					$(this.el).find('.percent').text(Math.round(percent));
				}
			});
			
		}
		index++;
	}
})
//console.log(nagativeValue)
});

// chart loding
$(window).load(function() {
	
	var chart = window.chart = $('.chart').data('easyPieChart');
	$('.js_update').on('click', function() {
		chart.update(Math.random()*100);
	});
});