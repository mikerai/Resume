$(document).foundation(),$(function(){$('a[href*="#"]:not([href="#"])').click(function(){if(location.pathname.replace(/^\//,"")==this.pathname.replace(/^\//,"")&&location.hostname==this.hostname){var e=$(this.hash);if(e=e.length?e:$("[name="+this.hash.slice(1)+"]"),e.length)return $("html, body").animate({scrollTop:e.offset().top-44},1e3),!1}})}),$(".off-canvas a").on("click",function(){$(".off-canvas").foundation("close")}),$(document).ready(function(){$("#submit").click(function(){var e=$("#name").val(),a=$("#email").val(),s=$("#message").val();$("#returnmessage").empty(),""==e||""==a?alert("Por favor llena los campos requeridos"):$.post("verify.php",{name1:e,email1:a,message1:s},function(e){$("#returnmessage").append(e),"Tu mensaje ha sido recibido; te responderé a la brevedad."==e&&($("#form")[0].reset(),$("p.message").addClass("success"),$("p.message").removeClass("error")),"Por favor usa sólo letras."!=e&&"<span>* Dirección de correo inválida *</span>"!=e||($("p.message").addClass("error"),$("p.message").removeClass("success"))})})});
//# sourceMappingURL=./app-min.js.map