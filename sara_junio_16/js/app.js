$(document).foundation();

$(function() {
  $('a[href*="#"]:not([href="#"])').click(function() {
    if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
      if (target.length) {
        $('html, body').animate({
          scrollTop: target.offset().top-44
        }, 1000);
        //$(this).foundation('close');
        return false;
      }
    }
  });
});

$('.off-canvas a').on('click', function() {
    $('.off-canvas').foundation('close');
});

$(document).ready(function() {
  $("#submit").click(function() {
    var name = $("#name").val();
    var email = $("#email").val();
    var message = $("#message").val();
  $("#returnmessage").empty(); // To empty previous error/success message.
    // Checking for blank fields.
    if (name == '' || email == '') {
      alert("Por favor llena los campos requeridos");
    } else {
  // Returns successful data submission message when the entered information is stored in database.
    $.post("verify.php", {
      name1: name,
      email1: email,
      message1: message
    }, function(data) {
      $("#returnmessage").append(data); // Append returned message to message paragraph.
        if (data == "Tu mensaje ha sido recibido; te responderé a la brevedad.") {
          $("#form")[0].reset(); // To reset form fields on success.
          $("p.message").addClass("success");
          $("p.message").removeClass("error");
        }
        if (data == "Por favor usa sólo letras." || data == "<span>* Dirección de correo inválida *</span>") {
          $("p.message").addClass("error");
          $("p.message").removeClass("success");
        }
      });
    }
  });
});