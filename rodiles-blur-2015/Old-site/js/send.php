<?php
if(!$_POST) exit;

    $to 	  = 'ventas@rodiles.com.mx';
	$name	  = $_POST['txtname'];
	$email    = $_POST['txtemail'];	
	$subject  = 'Enquiry';
    $comment  = $_POST['txtenquiry'];
        
	if(get_magic_quotes_gpc()) { $comment = stripslashes($comment); }

	 $e_subject = 'You\'ve been contacted by ' . $name . '.';

	 $msg  = "You have been contacted by $name with regards to $subject.\r\n\n";		 
	 $msg .= "$comment\r\n\n";
	 $msg .= "You can contact $name via email, $email.\r\n\n";
	 $msg .= "-------------------------------------------------------------------------------------------\r\n";
								
	 if(@mail($to, $e_subject, $msg, "From: $email\r\nReturn-Path: $email\r\n"))
	 {
		 echo "<p class='ajax_success'>Gracias por tu mensaje, en breve, un representante se pondrá en contacto contigo.</p>";
	 }
	 else
	 {
		 echo "<p class='ajax_failure'>Lo sentimos, tu mensaje no ha sido enviado, favor de intentar nuevamente más tarde.</p>";
	 }
?>