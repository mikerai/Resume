function scaleVideoContainer(){var e=$(window).height()+5,i=parseInt(e)+"px";$(".homepage-hero-module").css("height",i)}function initBannerVideoSize(e){$(e).each(function(){$(this).data("height",$(this).height()),$(this).data("width",$(this).width())}),scaleBannerVideoSize(e)}function scaleBannerVideoSize(e){var i=$(window).width(),a=$(window).height()+5,n,o;console.log(a),$(e).each(function(){var e=$(this).data("height")/$(this).data("width");$(this).width(i),i<1e3&&(o=a,n=o/e,$(this).css({"margin-top":0,"margin-left":-(n-i)/2+"px"}),$(this).width(n).height(o)),$(".homepage-hero-module .video-container video").addClass("fadeIn animated")})}$(document).foundation(),$(function(){$('a[href*="#"]:not([href="#"])').click(function(){if(location.pathname.replace(/^\//,"")==this.pathname.replace(/^\//,"")&&location.hostname==this.hostname){var e=$(this.hash);if(e=e.length?e:$("[name="+this.hash.slice(1)+"]"),e.length)return $("html, body").animate({scrollTop:e.offset().top-60},1e3),!1}})}),$(".off-canvas a").on("click",function(){$(".off-canvas").foundation("close")}),$(document).ready(function(){$("#submit").click(function(){var e=$("#name").val(),i=$("#email").val(),a=$("#message").val();$("#returnmessage").empty(),""==e||""==i?alert("Por favor llena los campos requeridos"):$.post("verify.php",{name1:e,email1:i,message1:a},function(e){$("#returnmessage").append(e),"Tu mensaje ha sido recibido; te responderé a la brevedad."==e&&($("#form")[0].reset(),$("p.message").addClass("success"),$("p.message").removeClass("error")),"Por favor usa sólo letras."!=e&&"<span>* Dirección de correo inválida *</span>"!=e||($("p.message").addClass("error"),$("p.message").removeClass("success"))})})}),$(document).ready(function(){scaleVideoContainer(),initBannerVideoSize(".video-container .poster img"),initBannerVideoSize(".video-container .filter"),initBannerVideoSize(".video-container video"),$(window).on("resize",function(){scaleVideoContainer(),scaleBannerVideoSize(".video-container .poster img"),scaleBannerVideoSize(".video-container .filter"),scaleBannerVideoSize(".video-container video")})});
//# sourceMappingURL=./app-min.js.map