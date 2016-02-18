$(function(){
	$(document).foundation();

	$('a').click(function(){
		event.preventDefault();
    $('html, body').animate({
        scrollTop: $( $.attr(this, 'href') ).offset().top
    }, 500);
    return false;
	});

});