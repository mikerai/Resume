<?php
  $email_to = "direccion@rodiles.com.mx , miguelangel@rodiles.com.mx";
	$name = $_POST["name"];
	$email = $_POST["email"];
	$message = $_POST["comment"];
	$text = "<span style='color:#2577BE'>De:</span> $name<br><br>
	         <span style='color:#2577BE'>Correo electr&oacute;nico:</span> $email<br><br>	 
	         <span style='color:#2577BE'>Mensaje: </span><br><br> $message";
	$headers = "MIME-Version: 1.0" . "\r\n"; 
	$headers .= "Content-type:text/html; charset=utf-8" . "\r\n"; 
	$headers .= "From: <$email>" . "\r\n";
	mail($email_to, "Mensaje enviado desde el sitio web de Rodiles de Mexico", $text, $headers);
?>