$(document).ready(function() {
  $("#submit").click(function() {
    var name = $("#name").val();
    var email = $("#email").val();
    var message = $("#message").val();
  $("#returnmessage").empty(); // To empty previous error/success message.
    // Checking for blank fields.
    if (name == '' || email == '') {
      alert("Please complete all the fields");
    } else {
  // Returns successful data submission message when the entered information is stored in database.
    $.post("mailer.php", {
      name1: name,
      email1: email,
      message1: message
    }, function(data) {
      $("#returnmessage").append(data); // Append returned message to message paragraph.
        if (data == "Your message has arrived, I will contact you as soon as possible.") {
          $("#form")[0].reset(); // To reset form fields on success.
          $("p.message").addClass("success");
          $("p.message").removeClass("error");
        }
        if (data == "Please use only letters." || data == "<span>* Invalid email address *</span>") {
          $("p.message").addClass("error");
          $("p.message").removeClass("success");
        }
      });
    }
  });
});