function onScroll(t){var e=$(document).scrollTop();$("#ha-header nav a").each(function(){var t=$(this),n=$(t.attr("href"));n.position().top-62<=e&&n.position().top+n.height()>e?($("#ha-header nav a").removeClass("active"),t.addClass("active")):t.removeClass("active")})}function scaleVideoContainer(){var t=$(window).height()+5,e=parseInt(t)+"px";$(".homepage-hero-module").css("height",e)}function initBannerVideoSize(t){$(t).each(function(){$(this).data("height",$(this).height()),$(this).data("width",$(this).width())}),scaleBannerVideoSize(t)}function scaleBannerVideoSize(t){var e=$(window).width(),n=$(window).height()+5,i,o;console.log(n),$(t).each(function(){var t=$(this).data("height")/$(this).data("width");$(this).width(e),e<1e3&&(o=n,i=o/t,$(this).css({"margin-top":0,"margin-left":-(i-e)/2+"px"}),$(this).width(i).height(o)),$(".homepage-hero-module .video-container video").addClass("fadeIn animated")})}$(function(){function t(){return $(window).width()<=767}function e(){return $(window).width()<=1024&&$(window).width()>=768}function n(){return $(window).width()>=1025}if($(document).foundation(),e(),n()){var i=0,o=!1,r=document.getElementById("parallax-bg"),a=2,l=function(){i=window.pageYOffset,s()};window.addEventListener("scroll",l,!1);var s=function(){o||(window.requestAnimationFrame(c),o=!0)},c=function(){var t=i/a;t<0&&(t=0),u(r,t),o=!1},u=function(t,e){var n="translate3d(0px,"+e+"px, 0px)";t.style["-webkit-transform"]=n,t.style["-moz-transform"]=n,t.style["-ms-transform"]=n,t.style["-o-transform"]=n,t.style.transform=n}}t()&&($(".large.download.button").text("View My Resume"),$(".g-recaptcha").attr("data-size","compact")),$(this).on("click",".mobile .accordion .accordion-title",function(){$(".mobile .accordion .accordion-item").toggleClass("is-active"),$(".mobile .accordion .accordion-content").slideToggle()}),$(this).on("click",".footer .back-to-top a",function(){$("body").stop().animate({scrollTop:0},700,"swing")})}),$(document).ready(function(){$(document).on("scroll",onScroll),$('a[href^="#"]').on("click",function(t){$(".mobile .accordion .accordion-content").slideUp(),$(".mobile .accordion .accordion-item.is-active").removeClass("is-active"),t.preventDefault(),$(document).off("scroll"),$("a").each(function(){$(this).removeClass("active")}),$(this).addClass("active");var e=this.hash,n=e;$target=$(e),$("html, body").stop().animate({scrollTop:$target.offset().top-60},1e3,"swing",function(){window.location.hash=e,$(document).on("scroll",onScroll)})})}),$(document).ready(function(){scaleVideoContainer(),initBannerVideoSize(".video-container .poster img"),initBannerVideoSize(".video-container .filter"),initBannerVideoSize(".video-container video"),$(window).on("resize",function(){scaleVideoContainer(),scaleBannerVideoSize(".video-container .poster img"),scaleBannerVideoSize(".video-container .filter"),scaleBannerVideoSize(".video-container video")})}),function(){var t=[].indexOf||function(t){for(var e=0,n=this.length;e<n;e++)if(e in this&&this[e]===t)return e;return-1},e=[].slice;!function(t,e){return"function"==typeof define&&define.amd?define("waypoints",["jquery"],function(n){return e(n,t)}):e(t.jQuery,t)}(this,function(n,i){var o,r,a,l,s,c,u,f,d,h,p,v,m,w,g,y;return o=n(i),f=t.call(i,"ontouchstart")>=0,l={horizontal:{},vertical:{}},s=1,u={},c="waypoints-context-id",p="resize.waypoints",v="scroll.waypoints",m=1,w="waypoints-waypoint-ids",g="waypoint",y="waypoints",r=function(){function t(t){var e=this;this.$element=t,this.element=t[0],this.didResize=!1,this.didScroll=!1,this.id="context"+s++,this.oldScroll={x:t.scrollLeft(),y:t.scrollTop()},this.waypoints={horizontal:{},vertical:{}},t.data(c,this.id),u[this.id]=this,t.bind(v,function(){var t;if(!e.didScroll&&!f)return e.didScroll=!0,t=function(){return e.doScroll(),e.didScroll=!1},i.setTimeout(t,n[y].settings.scrollThrottle)}),t.bind(p,function(){var t;if(!e.didResize)return e.didResize=!0,t=function(){return n[y]("refresh"),e.didResize=!1},i.setTimeout(t,n[y].settings.resizeThrottle)})}return t.prototype.doScroll=function(){var t,e=this;return t={horizontal:{newScroll:this.$element.scrollLeft(),oldScroll:this.oldScroll.x,forward:"right",backward:"left"},vertical:{newScroll:this.$element.scrollTop(),oldScroll:this.oldScroll.y,forward:"down",backward:"up"}},!f||t.vertical.oldScroll&&t.vertical.newScroll||n[y]("refresh"),n.each(t,function(t,i){var o,r,a;return a=[],r=i.newScroll>i.oldScroll,o=r?i.forward:i.backward,n.each(e.waypoints[t],function(t,e){var n,o;return i.oldScroll<(n=e.offset)&&n<=i.newScroll?a.push(e):i.newScroll<(o=e.offset)&&o<=i.oldScroll?a.push(e):void 0}),a.sort(function(t,e){return t.offset-e.offset}),r||a.reverse(),n.each(a,function(t,e){if(e.options.continuous||t===a.length-1)return e.trigger([o])})}),this.oldScroll={x:t.horizontal.newScroll,y:t.vertical.newScroll}},t.prototype.refresh=function(){var t,e,i,o=this;return i=n.isWindow(this.element),e=this.$element.offset(),this.doScroll(),t={horizontal:{contextOffset:i?0:e.left,contextScroll:i?0:this.oldScroll.x,contextDimension:this.$element.width(),oldScroll:this.oldScroll.x,forward:"right",backward:"left",offsetProp:"left"},vertical:{contextOffset:i?0:e.top,contextScroll:i?0:this.oldScroll.y,contextDimension:i?n[y]("viewportHeight"):this.$element.height(),oldScroll:this.oldScroll.y,forward:"down",backward:"up",offsetProp:"top"}},n.each(t,function(t,e){return n.each(o.waypoints[t],function(t,i){var o,r,a,l,s;if(o=i.options.offset,a=i.offset,r=n.isWindow(i.element)?0:i.$element.offset()[e.offsetProp],n.isFunction(o)?o=o.apply(i.element):"string"==typeof o&&(o=parseFloat(o),i.options.offset.indexOf("%")>-1&&(o=Math.ceil(e.contextDimension*o/100))),i.offset=r-e.contextOffset+e.contextScroll-o,(!i.options.onlyOnScroll||null==a)&&i.enabled)return null!==a&&a<(l=e.oldScroll)&&l<=i.offset?i.trigger([e.backward]):null!==a&&a>(s=e.oldScroll)&&s>=i.offset?i.trigger([e.forward]):null===a&&e.oldScroll>=i.offset?i.trigger([e.forward]):void 0})})},t.prototype.checkEmpty=function(){if(n.isEmptyObject(this.waypoints.horizontal)&&n.isEmptyObject(this.waypoints.vertical))return this.$element.unbind([p,v].join(" ")),delete u[this.id]},t}(),a=function(){function t(t,e,i){var o,r;i=n.extend({},n.fn[g].defaults,i),"bottom-in-view"===i.offset&&(i.offset=function(){var t;return t=n[y]("viewportHeight"),n.isWindow(e.element)||(t=e.$element.height()),t-n(this).outerHeight()}),this.$element=t,this.element=t[0],this.axis=i.horizontal?"horizontal":"vertical",this.callback=i.handler,this.context=e,this.enabled=i.enabled,this.id="waypoints"+m++,this.offset=null,this.options=i,e.waypoints[this.axis][this.id]=this,l[this.axis][this.id]=this,o=null!=(r=t.data(w))?r:[],o.push(this.id),t.data(w,o)}return t.prototype.trigger=function(t){if(this.enabled)return null!=this.callback&&this.callback.apply(this.element,t),this.options.triggerOnce?this.destroy():void 0},t.prototype.disable=function(){return this.enabled=!1},t.prototype.enable=function(){return this.context.refresh(),this.enabled=!0},t.prototype.destroy=function(){return delete l[this.axis][this.id],delete this.context.waypoints[this.axis][this.id],this.context.checkEmpty()},t.getWaypointsByElement=function(t){var e,i;return(i=n(t).data(w))?(e=n.extend({},l.horizontal,l.vertical),n.map(i,function(t){return e[t]})):[]},t}(),h={init:function(t,e){var i;return null==e&&(e={}),null==(i=e.handler)&&(e.handler=t),this.each(function(){var t,i,o,l;return t=n(this),o=null!=(l=e.context)?l:n.fn[g].defaults.context,n.isWindow(o)||(o=t.closest(o)),o=n(o),i=u[o.data(c)],i||(i=new r(o)),new a(t,i,e)}),n[y]("refresh"),this},disable:function(){return h._invoke(this,"disable")},enable:function(){return h._invoke(this,"enable")},destroy:function(){return h._invoke(this,"destroy")},prev:function(t,e){return h._traverse.call(this,t,e,function(t,e,n){if(e>0)return t.push(n[e-1])})},next:function(t,e){return h._traverse.call(this,t,e,function(t,e,n){if(e<n.length-1)return t.push(n[e+1])})},_traverse:function(t,e,o){var r,a;return null==t&&(t="vertical"),null==e&&(e=i),a=d.aggregate(e),r=[],this.each(function(){var e;return e=n.inArray(this,a[t]),o(r,e,a[t])}),this.pushStack(r)},_invoke:function(t,e){return t.each(function(){var t;return t=a.getWaypointsByElement(this),n.each(t,function(t,n){return n[e](),!0})}),this}},n.fn[g]=function(){var t,i;return i=arguments[0],t=2<=arguments.length?e.call(arguments,1):[],h[i]?h[i].apply(this,t):n.isFunction(i)?h.init.apply(this,arguments):n.isPlainObject(i)?h.init.apply(this,[null,i]):i?n.error("The "+i+" method does not exist in jQuery Waypoints."):n.error("jQuery Waypoints needs a callback function or handler option.")},n.fn[g].defaults={context:i,continuous:!0,enabled:!0,horizontal:!1,offset:0,triggerOnce:!1},d={refresh:function(){return n.each(u,function(t,e){return e.refresh()})},viewportHeight:function(){var t;return null!=(t=i.innerHeight)?t:o.height()},aggregate:function(t){var e,i,o;return e=l,t&&(e=null!=(o=u[n(t).data(c)])?o.waypoints:void 0),e?(i={horizontal:[],vertical:[]},n.each(i,function(t,o){return n.each(e[t],function(t,e){return o.push(e)}),o.sort(function(t,e){return t.offset-e.offset}),i[t]=n.map(o,function(t){return t.element}),i[t]=n.unique(i[t])}),i):[]},above:function(t){return null==t&&(t=i),d._filter(t,"vertical",function(t,e){return e.offset<=t.oldScroll.y})},below:function(t){return null==t&&(t=i),d._filter(t,"vertical",function(t,e){return e.offset>t.oldScroll.y})},left:function(t){return null==t&&(t=i),d._filter(t,"horizontal",function(t,e){return e.offset<=t.oldScroll.x})},right:function(t){return null==t&&(t=i),d._filter(t,"horizontal",function(t,e){return e.offset>t.oldScroll.x})},enable:function(){return d._invoke("enable")},disable:function(){return d._invoke("disable")},destroy:function(){return d._invoke("destroy")},extendFn:function(t,e){return h[t]=e},_invoke:function(t){var e;return e=n.extend({},l.vertical,l.horizontal),n.each(e,function(e,n){return n[t](),!0})},_filter:function(t,e,i){var o,r;return(o=u[n(t).data(c)])?(r=[],n.each(o.waypoints[e],function(t,e){if(i(o,e))return r.push(e)}),r.sort(function(t,e){return t.offset-e.offset}),n.map(r,function(t){return t.element})):[]}},n[y]=function(){var t,n;return n=arguments[0],t=2<=arguments.length?e.call(arguments,1):[],d[n]?d[n].apply(null,t):d.aggregate.call(null,n)},n[y].settings={resizeThrottle:100,scrollThrottle:30},o.load(function(){return n[y]("refresh")})})}.call(this),$(document).ready(function(){$("#submit").click(function(){var t=$("#name").val(),e=$("#email").val(),n=$("#message").val();$("#returnmessage").empty(),""==t||""==e?alert("Please complete all the fields"):$.post("mailer.php",{name1:t,email1:e,message1:n},function(t){$("#returnmessage").append(t),"Your message has arrived, I will contact you as soon as possible."==t&&($("#form")[0].reset(),$("p.message").addClass("success"),$("p.message").removeClass("error")),"Please use only letters."!=t&&"<span>* Invalid email address *</span>"!=t||($("p.message").addClass("error"),$("p.message").removeClass("success"))})})}),$(".ha-waypoint").each(function(t){var e=$("#ha-header"),n=$(this),i=n.data("animateDown"),o=n.data("animateUp");n.waypoint(function(t){"down"===t&&i?e.attr("class","ha-header "+i):"up"===t&&o&&e.attr("class","ha-header "+o)},{offset:"100%"})});