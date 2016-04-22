$(document).ready(function() {
		$("#submit").click(function() {
			var name = $("#name").val();
			var email = $("#email").val();
			var message = $("#message").val();
				$("#returnmessage").empty(); // To empty previous error/success message.
				// Checking for blank fields.
				if (name === '' || email === '' || message === '') {
					alert("Please fill required fields");
				} else {
				// Returns successful data submission message when the entered information is stored in database.
				$.post("mailer.php", {
					name1: name,
					email1: email,
					message1: message
					}, function(data) {
						$("#returnmessage").append(data); // Append returned message to message paragraph.
						if (data === "Your query has been received, I will contact you soon.") {
							$("#form")[0].reset(); // To reset form fields on success.
						}
				});
			}
		});
});