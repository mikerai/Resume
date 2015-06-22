jQuery.noConflict();

jQuery(document).ready(function($){
								
	//MAIN CONTACT FORM...
	jQuery(".contact-frm").validate({ 
	   	onfocusout: function(element){ $(element).valid(); },
        rules: { 
			txtname: { required: true, minlength: 3, notEqual: "Name" },
			txtemail: { required: true, email: true, notEqual: "Email" },
			txtenquiry: { required: true, minlength: 10, notEqual: "Enquiry" }
		}
	});
	
	//AJAX SUBMIT...
	$('.contact-frm').submit(function () {
										   
		var This = $(this);
		
		if($(This).valid()) {
			var action = $(This).attr('action');

			var data_value = unescape($(This).serialize());
			$.ajax({
				 type: "POST",
				 url:action,
				 data: data_value,
				 error: function (xhr, status, error) {
					 confirm('The page save failed.');
				   },
				  success: function (response) {
					$('#ajax_message').html(response);
					$('#ajax_message').slideDown('slow');
					if (response.match('success') != null) $(This).slideUp('slow');
				 }
			});
		}
		return false;
    });
	
	//NOT EQUAL METHOD...
	jQuery.validator.addMethod("notEqual", function(value, element, param) {
	  return this.optional(element) || value != param;
	}, "Please choose a value!");
});