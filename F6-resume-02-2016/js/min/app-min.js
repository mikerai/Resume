function onScroll(e){var n=$(document).scrollTop();$("#ha-header nav a").each(function(){var e=$(this),i=$(e.attr("href"));i.position().top-62<=n&&i.position().top+i.height()>n?($("#ha-header nav a").removeClass("active"),e.addClass("active")):e.removeClass("active")})}function scaleVideoContainer(){var e=$(window).height()+5,n=parseInt(e)+"px";$(".homepage-hero-module").css("height",n)}function initBannerVideoSize(e){$(e).each(function(){$(this).data("height",$(this).height()),$(this).data("width",$(this).width())}),scaleBannerVideoSize(e)}function scaleBannerVideoSize(e){var n=$(window).width(),i=$(window).height()+5,t,o;console.log(i),$(e).each(function(){var e=$(this).data("height")/$(this).data("width");$(this).width(n),1e3>n&&(o=i,t=o/e,$(this).css({"margin-top":0,"margin-left":-(t-n)/2+"px"}),$(this).width(t).height(o)),$(".homepage-hero-module .video-container video").addClass("fadeIn animated")})}$(function(){function e(){return $(window).width()<=767?!0:!1}function n(){return $(window).width()<=1024&&$(window).width()>=768?!0:!1}function i(){return $(window).width()>=1025?!0:!1}if($(document).foundation(),n(),i()){var t=0,o=!1,a=document.getElementById("parallax-bg"),r=2,d=function(){t=window.pageYOffset,s()};window.addEventListener("scroll",d,!1);var s=function(){o||(window.requestAnimationFrame(c),o=!0)},c=function(){var e=t/r;0>e&&(e=0),h(a,e),o=!1},h=function(e,n){var i="translate3d(0px,"+n+"px, 0px)";e.style["-webkit-transform"]=i,e.style["-moz-transform"]=i,e.style["-ms-transform"]=i,e.style["-o-transform"]=i,e.style.transform=i}}$(this).on("click",".footer .back-to-top a",function(){$("body").stop().animate({scrollTop:0},700,"swing")})}),$(document).ready(function(){$(document).on("scroll",onScroll),$('a[href^="#"]').on("click",function(e){e.preventDefault(),$(document).off("scroll"),$("a").each(function(){$(this).removeClass("active")}),$(this).addClass("active");var n=this.hash,i=n;$target=$(n),$("html, body").stop().animate({scrollTop:$target.offset().top-60},1e3,"swing",function(){window.location.hash=n,$(document).on("scroll",onScroll)})})}),$(document).ready(function(){scaleVideoContainer(),initBannerVideoSize(".video-container .poster img"),initBannerVideoSize(".video-container .filter"),initBannerVideoSize(".video-container video"),$(window).on("resize",function(){scaleVideoContainer(),scaleBannerVideoSize(".video-container .poster img"),scaleBannerVideoSize(".video-container .filter"),scaleBannerVideoSize(".video-container video")})});