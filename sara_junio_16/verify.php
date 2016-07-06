<?php
// Fetching Values from URL.
$name = $_POST['name1'];
$email = $_POST['email1'];
$message = $_POST['message1'];
$reg = "/^[a-zA-Z\x{0080}-\x{024F}\s\/\-\)\(\`\.\"\']+$/u";
$email = filter_var($email, FILTER_SANITIZE_EMAIL); // Sanitizing E-mail.
// After sanitization Validation is performed
if (filter_var($email, FILTER_VALIDATE_EMAIL)) {
		if (!preg_match($reg, $name)) {
				echo "Por favor usa sólo letras.";
		} else {
				$subject = $name;
				// To send HTML mail, the Content-type header must be set.
				$to = "saramuino@gmail.com";
				$headers = 'MIME-Version: 1.0' . "\r\n";
				$headers .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";
				$headers .= 'From:' . $email. "\r\n"; // Sender's Email
				$headers .= 'Cc:' . $email. "\r\n"; // Carbon copy to Sender
				$template = '<div style="padding:50px; color:#8a8a8a;">Hola ' . $name . ',<br/>'
				. '<br/>¡Gracias por ponerte en contacto conmigo!<br/><br/>'
				. 'Nombre: ' . $name . '<br/>'
				. 'Correo electrónico: ' . '&nbsp;' . $email . '<br/>'
				. 'Mensaje: ' . $message . '<br/><br/>'
				. 'Este es un correo de confirmación'
				. '<br/>'
				. 'Me pondré en contacto contigo a la brevedad.</div>';
				$sendmessage = "<div style=\"background-color:#ffffff; color:#8a8a8a;\">" . $template . "</div>";
				// Message lines should not exceed 70 characters (PHP rule), so wrap it.
				$sendmessage = wordwrap($sendmessage, 70);
				// Send mail by PHP Mail Function.
				if ( mail($to, $subject, $sendmessage, $headers)){
					echo "Tu mensaje ha sido recibido; te responderé a la brevedad.";
				}
				else{
					echo "error enviando mail";
				}
		}
} else {
	echo "<span>* Dirección de correo inválida *</span>";
}
?>