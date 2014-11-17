<?php
  require_once('recaptchalib.php');
  $privatekey = "6LfP2P0SAAAAAFknptB7OPVeJTchzX7bALhMSMQs";
  $resp = recaptcha_check_answer ($privatekey,
                                $_SERVER["REMOTE_ADDR"],
                                $_POST["recaptcha_challenge_field"],
                                $_POST["recaptcha_response_field"]);

  if (!$resp->is_valid) {
    // What happens when the CAPTCHA was entered incorrectly
    die ("The reCAPTCHA wasn't entered correctly. Go back and try it again." .
         "(reCAPTCHA said: " . $resp->error . ")");
  } else {
    // Your code here to handle a successful verification
    $email_to = "miguel@mikerai.com";
	$name = $_POST["name"];
	$email = $_POST["email"];
	$message = $_POST["message"];
	$text = "NAME: $name<br>
	         EMAIL: $email<br>	 
	         MESSAGE: $message";
	$headers = "MIME-Version: 1.0" . "\r\n"; 
	$headers .= "Content-type:text/html; charset=utf-8" . "\r\n"; 
	$headers .= "From: <$email>" . "\r\n";
	mail($email_to, "Message", $text, $headers);
  }
?>