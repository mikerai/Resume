!function(){function t(t){k.set(t)}function e(t){if(100!=t.get(Be)&&y(ht(t,De))%1e4>=100*lt(t,Be))throw"abort"}function n(t){if(q(ht(t,Me)))throw"abort"}function i(){var t=H.location.protocol;if("http:"!=t&&"https:"!=t)throw"abort"}function a(e){try{F.navigator.sendBeacon?t(42):F.XMLHttpRequest&&"withCredentials"in new F.XMLHttpRequest&&t(40)}catch(n){}e.set(pe,x(e),!0),e.set(Lt,lt(e,Lt)+1);var i=[];ct.map(function(t,n){if(n.F){var a=e.get(t);void 0!=a&&a!=n.defaultValue&&("boolean"==typeof a&&(a*=1),i.push(n.F+"="+E(""+a)))}}),i.push("z="+ot()),e.set(Ct,i.join("&"),!0)}function r(t){var e=ht(t,Ke)||Y()+"/collect",n=ht(t,At);if(!n&&t.get(Tt)&&(n="beacon"),n){var i=ht(t,Ct),a=t.get(Ot),a=a||I;"image"==n?Q(e,i,a):"xhr"==n&&tt(e,i,a)||"beacon"==n&&et(e,i,a)||J(e,i,a)}else J(e,ht(t,Ct),t.get(Ot));e=t.get(Me),e=it(e),n=e.hitcount,e.hitcount=n?n+1:1,e=t.get(Me),delete it(e).pending_experiments,t.set(Ot,I,!0)}function o(t){(F.gaData=F.gaData||{}).expId&&t.set(oe,(F.gaData=F.gaData||{}).expId),(F.gaData=F.gaData||{}).expVar&&t.set(se,(F.gaData=F.gaData||{}).expVar);var e,n=t.get(Me);if(n=it(n).pending_experiments){var i=[];for(e in n)n.hasOwnProperty(e)&&n[e]&&i.push(encodeURIComponent(e)+"."+encodeURIComponent(n[e]));e=i.join("!")}else e=void 0;e&&t.set(ce,e,!0)}function s(){if(F.navigator&&"preview"==F.navigator.loadPurpose)throw"abort"}function c(t){var e=F.gaDevIds;O(e)&&0!=e.length&&t.set("&did",e.join(","),!0)}function u(t){if(!t.get(Me))throw"abort"}function h(e){var n=lt(e,fe);n>=500&&t(15);var i=ht(e,St);if("transaction"!=i&&"item"!=i){var i=lt(e,de),a=(new Date).getTime(),r=lt(e,ge);if(0==r&&e.set(ge,a),r=Math.round(2*(a-r)/1e3),r>0&&(i=Math.min(i+r,20),e.set(ge,a)),0>=i)throw"abort";e.set(de,--i)}e.set(fe,++n)}function l(e,n,i,a){n[e]=function(){try{return a&&t(a),i.apply(this,arguments)}catch(n){throw nt("exc",e,n&&n.name),n}}}function f(){var t,e,n;if((n=(n=F.navigator)?n.plugins:null)&&n.length)for(var i=0;i<n.length&&!e;i++){var a=n[i];-1<a.name.indexOf("Shockwave Flash")&&(e=a.description)}if(!e)try{t=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7"),e=t.GetVariable("$version")}catch(r){}if(!e)try{t=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6"),e="WIN 6,0,21,0",t.AllowScriptAccess="always",e=t.GetVariable("$version")}catch(r){}if(!e)try{t=new ActiveXObject("ShockwaveFlash.ShockwaveFlash"),e=t.GetVariable("$version")}catch(r){}return e&&(t=e.match(/[\d]+/g))&&3<=t.length&&(e=t[0]+"."+t[1]+" r"+t[2]),e||void 0}function g(t,e,n){"none"==e&&(e="");var i=[],a=z(t);t="__utma"==t?6:2;for(var r=0;r<a.length;r++){var o=(""+a[r]).split(".");o.length>=t&&i.push({hash:o[0],R:a[r],O:o})}return 0==i.length?void 0:1==i.length?i[0]:d(e,i)||d(n,i)||d(null,i)||i[0]}function d(t,e){var n,i;null==t?n=i=1:(n=y(t),i=y(T(t,".")?t.substring(1):"."+t));for(var a=0;a<e.length;a++)if(e[a].hash==n||e[a].hash==i)return e[a]}function p(t){t=t.get(De);var e=v(t,0);return"_ga=1."+E(e+"."+t)}function v(t,e){for(var n=new Date,i=F.navigator,a=i.plugins||[],n=[t,i.userAgent,n.getTimezoneOffset(),n.getYear(),n.getDate(),n.getHours(),n.getMinutes()+e],i=0;i<a.length;++i)n.push(a[i].description);return y(n.join("."))}function m(t,e){if(e==H.location.hostname)return!1;for(var n=0;n<t.length;n++)if(t[n]instanceof RegExp){if(t[n].test(e))return!0}else if(0<=e.indexOf(t[n]))return!0;return!1}function w(t){return 0<=t.indexOf(".")||0<=t.indexOf(":")}function y(t){var e=1,n,i;if(t)for(e=0,i=t.length-1;i>=0;i--)n=t.charCodeAt(i),e=(e<<6&268435455)+n+(n<<14),n=266338304&e,e=0!=n?e^n>>21:e;return e}var b=function(t){this.w=t||[]};b.prototype.set=function(t){this.w[t]=!0},b.prototype.encode=function(){for(var t=[],e=0;e<this.w.length;e++)this.w[e]&&(t[Math.floor(e/6)]^=1<<e%6);for(e=0;e<t.length;e++)t[e]="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".charAt(t[e]||0);return t.join("")+"~"};var k=new b,_=function(t,e){var n=new b(j(t));n.set(e),t.set(ve,n.w)},x=function(t){t=j(t),t=new b(t);for(var e=k.w.slice(),n=0;n<t.w.length;n++)e[n]=e[n]||t.w[n];return new b(e).encode()},j=function(t){return t=t.get(ve),O(t)||(t=[]),t},S=function(t){return"function"==typeof t},O=function(t){return"[object Array]"==Object.prototype.toString.call(Object(t))},C=function(t){return void 0!=t&&-1<(t.constructor+"").indexOf("String")},T=function(t,e){return 0==t.indexOf(e)},A=function(t){return t?t.replace(/^[\s\xa0]+|[\s\xa0]+$/g,""):""},L=function(t){var e=H.createElement("img");return e.width=1,e.height=1,e.src=t,e},I=function(){},E=function(e){return encodeURIComponent instanceof Function?encodeURIComponent(e):(t(28),e)},D=function(e,n,i,a){try{e.addEventListener?e.addEventListener(n,i,!!a):e.attachEvent&&e.attachEvent("on"+n,i)}catch(r){t(27)}},P=/^[\w\-:\/.?=&%!]+$/,V=function(t,e,n){t&&(n?(n="",e&&P.test(e)&&(n=' id="'+e+'"'),P.test(t)&&H.write("<script"+n+' src="'+t+'"></script>')):(n=H.createElement("script"),n.type="text/javascript",n.async=!0,n.src=t,e&&(n.id=e),t=H.getElementsByTagName("script")[0],t.parentNode.insertBefore(n,t)))},M=function(){return"https:"==H.location.protocol},N=function(){var t=""+H.location.hostname;return 0==t.indexOf("www.")?t.substring(4):t},G=function(t){var e=H.referrer;if(/^https?:\/\//i.test(e)){if(t)return e;t="//"+H.location.hostname;var n=e.indexOf(t);if((5==n||6==n)&&(t=e.charAt(n+t.length),"/"==t||"?"==t||""==t||":"==t))return;return e}},R=function(t,e){if(1==e.length&&null!=e[0]&&"object"==typeof e[0])return e[0];for(var n={},i=Math.min(t.length+1,e.length),a=0;i>a;a++){if("object"==typeof e[a]){for(var r in e[a])e[a].hasOwnProperty(r)&&(n[r]=e[a][r]);break}a<t.length&&(n[t[a]]=e[a])}return n},U=function(){this.keys=[],this.values={},this.m={}};U.prototype.set=function(t,e,n){this.keys.push(t),n?this.m[":"+t]=e:this.values[":"+t]=e},U.prototype.get=function(t){return this.m.hasOwnProperty(":"+t)?this.m[":"+t]:this.values[":"+t]},U.prototype.map=function(t){for(var e=0;e<this.keys.length;e++){var n=this.keys[e],i=this.get(n);i&&t(n,i)}};var F=window,H=document,q=function(t){var e=F._gaUserPrefs;if(e&&e.ioo&&e.ioo()||t&&!0===F["ga-disable-"+t])return!0;try{var n=F.external;if(n&&n._gaUserPrefs&&"oo"==n._gaUserPrefs)return!0}catch(i){}return!1},z=function(t){var e=[],n=H.cookie.split(";");t=new RegExp("^\\s*"+t+"=\\s*(.*?)\\s*$");for(var i=0;i<n.length;i++){var a=n[i].match(t);a&&e.push(a[1])}return e},B=function(e,n,i,a,r,o){if(r=q(r)?!1:!(K.test(H.location.hostname)||"/"==i&&W.test(a)),!r)return!1;if(n&&1200<n.length&&(n=n.substring(0,1200),t(24)),i=e+"="+n+"; path="+i+"; ",o&&(i+="expires="+new Date((new Date).getTime()+o).toGMTString()+"; "),a&&"none"!=a&&(i+="domain="+a+";"),a=H.cookie,H.cookie=i,!(a=a!=H.cookie))t:{for(e=z(e),a=0;a<e.length;a++)if(n==e[a]){a=!0;break t}a=!1}return a},X=function(t){return E(t).replace(/\(/g,"%28").replace(/\)/g,"%29")},W=/^(www\.)?google(\.com?)?(\.[a-z]{2})?$/,K=/(^|\.)doubleclick\.net$/i,Y=function(){return(kt||M()?"https:":"http:")+"//www.google-analytics.com"},Z=function(t){this.name="len",this.message=t+"-8192"},J=function(t,e,n){if(n=n||I,2036>=e.length)Q(t,e,n);else{if(!(8192>=e.length))throw nt("len",e.length),new Z(e.length);et(t,e,n)||tt(t,e,n)||Q(t,e,n)}},Q=function(t,e,n){var i=L(t+"?"+e);i.onload=i.onerror=function(){i.onload=null,i.onerror=null,n()}},tt=function(t,e,n){var i=F.XMLHttpRequest;if(!i)return!1;var a=new i;return"withCredentials"in a?(a.open("POST",t,!0),a.withCredentials=!0,a.setRequestHeader("Content-Type","text/plain"),a.onreadystatechange=function(){4==a.readyState&&(n(),a=null)},a.send(e),!0):!1},et=function(t,e,n){return F.navigator.sendBeacon&&F.navigator.sendBeacon(t,e)?(n(),!0):!1},nt=function(t,e,n){1<=100*Math.random()||q("?")||(t=["t=error","_e="+t,"_v=j44","sr=1"],e&&t.push("_f="+e),n&&t.push("_m="+E(n.substring(0,100))),t.push("aip=1"),t.push("z="+rt()),Q(Y()+"/collect",t.join("&"),I))},it=function(t){var e=F.gaData=F.gaData||{};return e[t]=e[t]||{}},at=function(){this.M=[]};at.prototype.add=function(t){this.M.push(t)},at.prototype.D=function(t){try{for(var e=0;e<this.M.length;e++){var n=t.get(this.M[e]);n&&S(n)&&n.call(F,t)}}catch(i){}e=t.get(Ot),e!=I&&S(e)&&(t.set(Ot,I,!0),setTimeout(e,10))};var rt=function(){return Math.round(2147483647*Math.random())},ot=function(){try{var t=new Uint32Array(1);return F.crypto.getRandomValues(t),2147483647&t[0]}catch(e){return rt()}},st=function(){this.data=new U},ct=new U,ut=[];st.prototype.get=function(t){var e=dt(t),n=this.data.get(t);return e&&void 0==n&&(n=S(e.defaultValue)?e.defaultValue():e.defaultValue),e&&e.Z?e.Z(this,t,n):n};var ht=function(t,e){var n=t.get(e);return void 0==n?"":""+n},lt=function(t,e){var n=t.get(e);return void 0==n||""===n?0:1*n};st.prototype.set=function(t,e,n){if(t)if("object"==typeof t)for(var i in t)t.hasOwnProperty(i)&&ft(this,i,t[i],n);else ft(this,t,e,n)};var ft=function(t,e,n,i){if(void 0!=n)switch(e){case Me:Pn.test(n)}var a=dt(e);a&&a.o?a.o(t,e,n,i):t.data.set(e,n,i)},gt=function(t,e,n,i,a){this.name=t,this.F=e,this.Z=i,this.o=a,this.defaultValue=n},dt=function(t){var e=ct.get(t);if(!e)for(var n=0;n<ut.length;n++){var i=ut[n],a=i[0].exec(t);if(a){e=i[1](a),ct.set(e.name,e);break}}return e},pt=function(t){var e;return ct.map(function(n,i){i.F==t&&(e=i)}),e&&e.name},vt=function(t,e,n,i,a){return t=new gt(t,e,n,i,a),ct.set(t.name,t),t.name},mt=function(t,e){ut.push([new RegExp("^"+t+"$"),e])},wt=function(t,e,n){return vt(t,e,n,void 0,yt)},yt=function(){},bt=C(window.GoogleAnalyticsObject)&&A(window.GoogleAnalyticsObject)||"ga",kt=!1,_t=wt("apiVersion","v"),xt=wt("clientVersion","_v");vt("anonymizeIp","aip");var jt=vt("adSenseId","a"),St=vt("hitType","t"),Ot=vt("hitCallback"),Ct=vt("hitPayload");vt("nonInteraction","ni"),vt("currencyCode","cu"),vt("dataSource","ds");var Tt=vt("useBeacon",void 0,!1),At=vt("transport");vt("sessionControl","sc",""),vt("sessionGroup","sg"),vt("queueTime","qt");var Lt=vt("_s","_s");vt("screenName","cd");var It=vt("location","dl",""),Et=vt("referrer","dr"),Dt=vt("page","dp","");vt("hostname","dh");var Pt=vt("language","ul"),Vt=vt("encoding","de");vt("title","dt",function(){return H.title||void 0}),mt("contentGroup([0-9]+)",function(t){return new gt(t[0],"cg"+t[1])});var Mt=vt("screenColors","sd"),Nt=vt("screenResolution","sr"),Gt=vt("viewportSize","vp"),Rt=vt("javaEnabled","je"),$t=vt("flashVersion","fl");vt("campaignId","ci"),vt("campaignName","cn"),vt("campaignSource","cs"),vt("campaignMedium","cm"),vt("campaignKeyword","ck"),vt("campaignContent","cc");var Ut=vt("eventCategory","ec"),Ft=vt("eventAction","ea"),Ht=vt("eventLabel","el"),qt=vt("eventValue","ev"),zt=vt("socialNetwork","sn"),Bt=vt("socialAction","sa"),Xt=vt("socialTarget","st"),Wt=vt("l1","plt"),Kt=vt("l2","pdt"),Yt=vt("l3","dns"),Zt=vt("l4","rrt"),Jt=vt("l5","srt"),Qt=vt("l6","tcp"),te=vt("l7","dit"),ee=vt("l8","clt"),ne=vt("timingCategory","utc"),ie=vt("timingVar","utv"),ae=vt("timingLabel","utl"),re=vt("timingValue","utt");vt("appName","an"),vt("appVersion","av",""),vt("appId","aid",""),vt("appInstallerId","aiid",""),vt("exDescription","exd"),vt("exFatal","exf");var oe=vt("expId","xid"),se=vt("expVar","xvar"),ce=vt("exp","exp"),ue=vt("_utma","_utma"),he=vt("_utmz","_utmz"),le=vt("_utmht","_utmht"),fe=vt("_hc",void 0,0),ge=vt("_ti",void 0,0),de=vt("_to",void 0,20);mt("dimension([0-9]+)",function(t){return new gt(t[0],"cd"+t[1])}),mt("metric([0-9]+)",function(t){return new gt(t[0],"cm"+t[1])}),vt("linkerParam",void 0,void 0,p,yt);var pe=vt("usage","_u"),ve=vt("_um");vt("forceSSL",void 0,void 0,function(){return kt},function(e,n,i){t(34),kt=!!i});var me=vt("_j1","jid");mt("\\&(.*)",function(t){var e=new gt(t[0],t[1]),n=pt(t[0].substring(1));return n&&(e.Z=function(t){return t.get(n)},e.o=function(t,e,i,a){t.set(n,i,a)},e.F=void 0),e});var we=wt("_oot"),ye=vt("previewTask"),be=vt("checkProtocolTask"),ke=vt("validationTask"),_e=vt("checkStorageTask"),xe=vt("historyImportTask"),je=vt("samplerTask"),Se=vt("_rlt"),Oe=vt("buildHitTask"),Ce=vt("sendHitTask"),Te=vt("ceTask"),Ae=vt("devIdTask"),Le=vt("timingTask"),Ie=vt("displayFeaturesTask"),Ee=wt("name"),De=wt("clientId","cid"),Pe=wt("clientIdTime"),Ve=vt("userId","uid"),Me=wt("trackingId","tid"),Ne=wt("cookieName",void 0,"_ga"),Ge=wt("cookieDomain"),Re=wt("cookiePath",void 0,"/"),$e=wt("cookieExpires",void 0,63072e3),Ue=wt("legacyCookieDomain"),Fe=wt("legacyHistoryImport",void 0,!0),He=wt("storage",void 0,"cookie"),qe=wt("allowLinker",void 0,!1),ze=wt("allowAnchor",void 0,!0),Be=wt("sampleRate","sf",100),Xe=wt("siteSpeedSampleRate",void 0,1),We=wt("alwaysSendReferrer",void 0,!1),Ke=vt("transportUrl"),Ye=vt("_r","_r"),Ze=function(){this.V=1e4,this.fa=void 0,this.$=!1,this.ea=1},Je=function(){var t=new Ze,e;return t.fa&&t.$?0:(t.$=!0,0==t.V?0:(void 0===e&&(e=ot()),0==e%t.V?Math.floor(e/t.V)%t.ea+1:0))},Qe=function(t,e){var n=Math.min(lt(t,Xe),100);if(!(y(ht(t,De))%100>=n)&&(n={},tn(n)||en(n))){var i=n[Wt];void 0==i||1/0==i||isNaN(i)||(i>0?(nn(n,Yt),nn(n,Qt),nn(n,Jt),nn(n,Kt),nn(n,Zt),nn(n,te),nn(n,ee),e(n)):D(F,"load",function(){Qe(t,e)},!1))}},tn=function(t){var e=F.performance||F.webkitPerformance,e=e&&e.timing;if(!e)return!1;var n=e.navigationStart;return 0==n?!1:(t[Wt]=e.loadEventStart-n,t[Yt]=e.domainLookupEnd-e.domainLookupStart,t[Qt]=e.connectEnd-e.connectStart,t[Jt]=e.responseStart-e.requestStart,t[Kt]=e.responseEnd-e.responseStart,t[Zt]=e.fetchStart-n,t[te]=e.domInteractive-n,t[ee]=e.domContentLoadedEventStart-n,!0)},en=function(t){if(F.top!=F)return!1;var e=F.external,n=e&&e.onloadT;return e&&!e.isValidLoadTime&&(n=void 0),n>2147483648&&(n=void 0),n>0&&e.setPageReadyTime(),void 0==n?!1:(t[Wt]=n,!0)},nn=function(t,e){var n=t[e];(isNaN(n)||1/0==n||0>n)&&(t[e]=void 0)},an=function(t){return function(e){"pageview"!=e.get(St)||t.I||(t.I=!0,Qe(e,function(e){t.send("timing",e)}))}},rn=!1,on=function(e){if("cookie"==ht(e,He)){var n=ht(e,Ne),i=un(e),a=fn(ht(e,Re)),r=ln(ht(e,Ge)),o=1e3*lt(e,$e),s=ht(e,Me);if("auto"!=r)B(n,i,a,r,s,o)&&(rn=!0);else{t(32);var c;if(i=[],r=N().split("."),4!=r.length||(c=r[r.length-1],parseInt(c,10)!=c)){for(c=r.length-2;c>=0;c--)i.push(r.slice(c).join("."));i.push("none"),c=i}else c=["none"];for(var u=0;u<c.length;u++)if(r=c[u],e.data.set(Ge,r),i=un(e),B(n,i,a,r,s,o))return void(rn=!0);e.data.set(Ge,"auto")}}},sn=function(t){if("cookie"==ht(t,He)&&!rn&&(on(t),!rn))throw"abort"},cn=function(e){if(e.get(Fe)){var n=ht(e,Ge),i=ht(e,Ue)||N(),a=g("__utma",i,n);a&&(t(19),e.set(le,(new Date).getTime(),!0),e.set(ue,a.R),(n=g("__utmz",i,n))&&a.hash==n.hash&&e.set(he,n.R))}},un=function(t){var e=X(ht(t,De)),n=ln(ht(t,Ge)).split(".").length;return t=gn(ht(t,Re)),t>1&&(n+="-"+t),["GA1",n,e].join(".")},hn=function(t,e,n){for(var i=[],a=[],r,o=0;o<t.length;o++){var s=t[o];s.H[n]==e?i.push(s):void 0==r||s.H[n]<r?(a=[s],r=s.H[n]):s.H[n]==r&&a.push(s)}return 0<i.length?i:a},ln=function(t){return 0==t.indexOf(".")?t.substr(1):t},fn=function(t){return t?(1<t.length&&t.lastIndexOf("/")==t.length-1&&(t=t.substr(0,t.length-1)),0!=t.indexOf("/")&&(t="/"+t),t):"/"},gn=function(t){return t=fn(t),"/"==t?1:t.split("/").length},dn=new RegExp(/^https?:\/\/([^\/:]+)/),pn=/(.*)([?&#])(?:_ga=[^&#]*)(?:&?)(.*)/,vn=function(e){t(48),this.target=e,this.T=!1};vn.prototype.ca=function(t,e){if(t.tagName){if("a"==t.tagName.toLowerCase())return void(t.href&&(t.href=mn(this,t.href,e)));if("form"==t.tagName.toLowerCase())return wn(this,t)}return"string"==typeof t?mn(this,t,e):void 0};var mn=function(t,e,n){var i=pn.exec(e);i&&3<=i.length&&(e=i[1]+(i[3]?i[2]+i[3]:"")),t=t.target.get("linkerParam");var a=e.indexOf("?"),i=e.indexOf("#");return n?e+=(-1==i?"#":"&")+t:(n=-1==a?"?":"&",e=-1==i?e+(n+t):e.substring(0,i)+n+t+e.substring(i)),e=e.replace(/&+_ga=/,"&_ga=")},wn=function(t,e){if(e&&e.action){var n=t.target.get("linkerParam").split("=")[1];if("get"==e.method.toLowerCase()){for(var i=e.childNodes||[],a=0;a<i.length;a++)if("_ga"==i[a].name)return void i[a].setAttribute("value",n);i=H.createElement("input"),i.setAttribute("type","hidden"),i.setAttribute("name","_ga"),i.setAttribute("value",n),e.appendChild(i)}else"post"==e.method.toLowerCase()&&(e.action=mn(t,e.action))}};vn.prototype.S=function(e,n,i){function a(i){try{i=i||F.event;var a;t:{var o=i.target||i.srcElement;for(i=100;o&&i>0;){if(o.href&&o.nodeName.match(/^a(?:rea)?$/i)){a=o;break t}o=o.parentNode,i--}a={}}("http:"==a.protocol||"https:"==a.protocol)&&m(e,a.hostname||"")&&a.href&&(a.href=mn(r,a.href,n))}catch(s){t(26)}}var r=this;if(this.T||(this.T=!0,D(H,"mousedown",a,!1),D(H,"keyup",a,!1)),i){i=function(t){if(t=t||F.event,(t=t.target||t.srcElement)&&t.action){var n=t.action.match(dn);n&&m(e,n[1])&&wn(r,t)}};for(var o=0;o<H.forms.length;o++)D(H.forms[o],"submit",i)}};var yn=/^(GTM|OPT)-[A-Z0-9]+$/,bn=/;_gaexp=[^;]*/g,kn=/;((__utma=)|([^;=]+=GAX?\d+\.))[^;]*/g,_n=function(t){function e(t,e){e&&(n+="&"+t+"="+E(e))}var n="https://www.google-analytics.com/gtm/js?id="+E(t.id);return"dataLayer"!=t.B&&e("l",t.B),e("t",t.target),e("cid",t.ja),e("cidt",t.ka),e("gac",t.la),e("aip",t.ia),t.na&&e("m","sync"),e("cycle",t.G),n},xn=function(t,e,n){this.U=me,this.aa=e,(e=n)||(e=(e=ht(t,Ee))&&"t0"!=e?Tn.test(e)?"_gat_"+X(ht(t,Me)):"_gat_"+X(e):"_gat"),this.Y=e},jn=function(t,e){var n=e.get(Oe);e.set(Oe,function(e){Sn(t,e);var i=n(e);return On(t,e),i});var i=e.get(Ce);e.set(Ce,function(e){var n=i(e);return Cn(t,e),n})},Sn=function(t,e){e.get(t.U)||("1"==z(t.Y)[0]?e.set(t.U,"",!0):e.set(t.U,""+rt(),!0))},On=function(t,e){e.get(t.U)&&B(t.Y,"1",e.get(Re),e.get(Ge),e.get(Me),6e5)},Cn=function(t,e){if(e.get(t.U)){var n=new U,i=function(t){dt(t).F&&n.set(dt(t).F,e.get(t))};i(_t),i(xt),i(Me),i(De),i(Ve),i(t.U),n.set(dt(pe).F,x(e));var a=t.aa;n.map(function(t,e){a+=E(t)+"=",a+=E(""+e)+"&"}),a+="z="+rt(),L(a),e.set(t.U,"",!0)}},Tn=/^gtm\d+$/,An=function(t,e){var n=t.b;if(!n.get("dcLoaded")){_(n,29),e=e||{};var i;e[Ne]&&(i=X(e[Ne])),i=new xn(n,"https://stats.g.doubleclick.net/r/collect?t=dc&aip=1&_r=3&",i),jn(i,n),n.set("dcLoaded",!0)}},Ln=function(t){if(!t.get("dcLoaded")&&"cookie"==t.get(He)){_(t,51);var e=new xn(t);Sn(e,t),On(e,t),t.get(e.U)&&(t.set(Ye,1,!0),t.set(Ke,Y()+"/r/collect",!0))}},In=function(){var t=F.gaGlobal=F.gaGlobal||{};return t.hid=t.hid||rt()},En,Dn=function(t,e,n){if(!En){var i;i=H.location.hash;var a=F.name,r=/^#?gaso=([^&]*)/;(a=(i=(i=i&&i.match(r)||a&&a.match(r))?i[1]:z("GASO")[0]||"")&&i.match(/^(?:!([-0-9a-z.]{1,40})!)?([-.\w]{10,1200})$/i))&&(B("GASO",""+i,n,e,t,0),window._udo||(window._udo=e),window._utcp||(window._utcp=n),t=a[1],V("https://www.google.com/analytics/web/inpage/pub/inpage.js?"+(t?"prefix="+t+"&":"")+rt(),"_gasojs")),En=!0}},Pn=/^(UA|YT|MO|GP)-(\d+)-(\d+)$/,Vn=function(t){function l(t,e){g.b.data.set(t,e)}function f(t,e){l(t,e),g.filters.add(t)}var g=this;this.b=new st,this.filters=new at,l(Ee,t[Ee]),l(Me,A(t[Me])),l(Ne,t[Ne]),l(Ge,t[Ge]||N()),l(Re,t[Re]),l($e,t[$e]),l(Ue,t[Ue]),l(Fe,t[Fe]),l(qe,t[qe]),l(ze,t[ze]),l(Be,t[Be]),l(Xe,t[Xe]),l(We,t[We]),l(He,t[He]),l(Ve,t[Ve]),l(Pe,t[Pe]),l(_t,1),l(xt,"j44"),f(we,n),f(ye,s),f(be,i),f(ke,u),f(_e,sn),f(xe,cn),f(je,e),f(Se,h),f(Te,o),f(Ae,c),f(Ie,Ln),f(Oe,a),f(Ce,r),f(Le,an(this)),Mn(this.b,t[De]),Nn(this.b),this.b.set(jt,In()),Dn(this.b.get(Me),this.b.get(Ge),this.b.get(Re))},Mn=function(e,n){if("cookie"==ht(e,He)){rn=!1;var i;t:{var a=z(ht(e,Ne));if(a&&!(1>a.length)){i=[];for(var r=0;r<a.length;r++){var o;o=a[r].split(".");var s=o.shift();("GA1"==s||"1"==s)&&1<o.length?(s=o.shift().split("-"),1==s.length&&(s[1]="1"),s[0]*=1,s[1]*=1,o={H:s,s:o.join(".")}):o=void 0,o&&i.push(o)}if(1==i.length){t(13),i=i[0].s;break t}if(0!=i.length){if(t(14),a=ln(ht(e,Ge)).split(".").length,i=hn(i,a,0),1==i.length){i=i[0].s;break t}a=gn(ht(e,Re)),i=hn(i,a,1),i=i[0]&&i[0].s;break t}t(12)}i=void 0}i||(i=ht(e,Ge),a=ht(e,Ue)||N(),i=g("__utma",a,i),void 0!=i?(t(10),i=i.O[1]+"."+i.O[2]):i=void 0),i&&(e.data.set(De,i),rn=!0)}if(i=e.get(ze),(r=(i=H.location[i?"href":"search"].match("(?:&|#|\\?)"+E("_ga").replace(/([.*+?^=!:${}()|\[\]\/\\])/g,"\\$1")+"=([^&#]*)"))&&2==i.length?i[1]:"")&&(e.get(qe)?(i=r.indexOf("."),-1==i?t(22):(a=r.substring(i+1),"1"!=r.substring(0,i)?t(22):(i=a.indexOf("."),-1==i?t(22):(r=a.substring(0,i),i=a.substring(i+1),r!=v(i,0)&&r!=v(i,-1)&&r!=v(i,-2)?t(23):(t(11),e.data.set(De,i)))))):t(21)),n&&(t(9),e.data.set(De,E(n))),!e.get(De))if(i=(i=F.gaGlobal&&F.gaGlobal.vid)&&-1!=i.search(/^(?:utma\.)?\d+\.\d+$/)?i:void 0)t(17),e.data.set(De,i);else{for(t(8),i=F.navigator.userAgent+(H.cookie?H.cookie:"")+(H.referrer?H.referrer:""),a=i.length,r=F.history.length;r>0;)i+=r--^a++;e.data.set(De,[rt()^2147483647&y(i),Math.round((new Date).getTime()/1e3)].join("."))}on(e)},Nn=function(e){var n=F.navigator,i=F.screen,a=H.location;if(e.set(Et,G(e.get(We))),a){var r=a.pathname||"";"/"!=r.charAt(0)&&(t(31),r="/"+r),e.set(It,a.protocol+"//"+a.hostname+r+a.search)}i&&e.set(Nt,i.width+"x"+i.height),i&&e.set(Mt,i.colorDepth+"-bit");var i=H.documentElement,o=(r=H.body)&&r.clientWidth&&r.clientHeight,s=[];if(i&&i.clientWidth&&i.clientHeight&&("CSS1Compat"===H.compatMode||!o)?s=[i.clientWidth,i.clientHeight]:o&&(s=[r.clientWidth,r.clientHeight]),i=0>=s[0]||0>=s[1]?"":s.join("x"),e.set(Gt,i),e.set($t,f()),e.set(Vt,H.characterSet||H.charset),e.set(Rt,n&&"function"==typeof n.javaEnabled&&n.javaEnabled()||!1),e.set(Pt,(n&&(n.language||n.browserLanguage)||"").toLowerCase()),a&&e.get(ze)&&(n=H.location.hash)){for(n=n.split(/[?&#]+/),a=[],i=0;i<n.length;++i)(T(n[i],"utm_id")||T(n[i],"utm_campaign")||T(n[i],"utm_source")||T(n[i],"utm_medium")||T(n[i],"utm_term")||T(n[i],"utm_content")||T(n[i],"gclid")||T(n[i],"dclid")||T(n[i],"gclsrc"))&&a.push(n[i]);0<a.length&&(n="#"+a.join("&"),e.set(It,e.get(It)+n))}};Vn.prototype.get=function(t){return this.b.get(t)},Vn.prototype.set=function(t,e){this.b.set(t,e)};var Gn={pageview:[Dt],event:[Ut,Ft,Ht,qt],social:[zt,Bt,Xt],timing:[ne,ie,re,ae]};Vn.prototype.send=function(t){if(!(1>arguments.length)){var e,n;"string"==typeof arguments[0]?(e=arguments[0],n=[].slice.call(arguments,1)):(e=arguments[0]&&arguments[0][St],n=arguments),e&&(n=R(Gn[e]||[],n),n[St]=e,this.b.set(n,void 0,!0),this.filters.D(this.b),this.b.data.m={})}},Vn.prototype.ma=function(t,e){var n=this;Xn(t,n,e)||(Kn(t,function(){Xn(t,n,e)}),Wn(String(n.get(Ee)),t,void 0,e,!0))};var Rn=function(t){return"prerender"==H.visibilityState?!1:(t(),!0)},$n=function(e){if(!Rn(e)){t(16);var n=!1,i=function(){if(!n&&Rn(e)){n=!0;var t=i,a=H;a.removeEventListener?a.removeEventListener("visibilitychange",t,!1):a.detachEvent&&a.detachEvent("onvisibilitychange",t)}};D(H,"visibilitychange",i)}},Un=/^(?:(\w+)\.)?(?:(\w+):)?(\w+)$/,Fn=function(t){if(S(t[0]))this.u=t[0];else{var e=Un.exec(t[0]);if(null!=e&&4==e.length&&(this.c=e[1]||"t0",this.K=e[2]||"",this.C=e[3],this.a=[].slice.call(t,1),this.K||(this.A="create"==this.C,this.i="require"==this.C,this.g="provide"==this.C,this.ba="remove"==this.C),this.i&&(3<=this.a.length?(this.X=this.a[1],this.W=this.a[2]):this.a[1]&&(C(this.a[1])?this.X=this.a[1]:this.W=this.a[1]))),e=t[1],t=t[2],!this.C)throw"abort";if(this.i&&(!C(e)||""==e))throw"abort";if(this.g&&(!C(e)||""==e||!S(t)))throw"abort";if(w(this.c)||w(this.K))throw"abort";if(this.g&&"t0"!=this.c)throw"abort"}},Hn,qn,zn,Bn;Hn=new U,zn=new U,Bn=new U,qn={ec:45,ecommerce:46,linkid:47};var Xn=function(t,e,n){e==ti||e.get(Ee);var i=Hn.get(t);return S(i)?(e.plugins_=e.plugins_||new U,e.plugins_.get(t)?!0:(e.plugins_.set(t,new i(e,n||{})),!0)):!1},Wn=function(e,n,i,a,r){if(!S(Hn.get(n))&&!zn.get(n)){if(qn.hasOwnProperty(n)&&t(qn[n]),yn.test(n)){if(t(52),e=ti.j(e),!e)return!0;i=a||{},a={id:n,B:i.dataLayer||"dataLayer",ia:!!e.get("anonymizeIp"),na:r,G:!1},e.get("&gtm")==n&&(a.G=!0);var o=String(e.get("name"));"t0"!=o&&(a.target=o),q(String(e.get("trackingId")))||(a.ja=String(e.get(De)),a.ka=Number(e.get(Pe)),e=i.palindrome?kn:bn,e=(e=H.cookie.replace(/^|(; +)/g,";").match(e))?e.sort().join("").substring(1):void 0,a.la=e),e=a.B,i=(new Date).getTime(),F[e]=F[e]||[],i={"gtm.start":i},r||(i.event="gtm.js"),F[e].push(i),i=_n(a)}!i&&qn.hasOwnProperty(n)?(t(39),i=n+".js"):t(43),i&&(i&&0<=i.indexOf("/")||(i=(kt||M()?"https:":"http:")+"//www.google-analytics.com/plugins/ua/"+i),a=Jn(i),e=a.protocol,i=H.location.protocol,("https:"==e||e==i||("http:"!=e?0:"http:"==i))&&Zn(a)&&(V(a.url,void 0,r),zn.set(n,!0)))}},Kn=function(t,e){var n=Bn.get(t)||[];n.push(e),Bn.set(t,n)},Yn=function(t,e){Hn.set(t,e);for(var n=Bn.get(t)||[],i=0;i<n.length;i++)n[i]();Bn.set(t,[])},Zn=function(t){var e=Jn(H.location.href);return T(t.url,"https://www.google-analytics.com/gtm/js?id=")?!0:t.query||0<=t.url.indexOf("?")||0<=t.path.indexOf("://")?!1:t.host==e.host&&t.port==e.port?!0:(e="http:"==t.protocol?80:443,!("www.google-analytics.com"!=t.host||(t.port||e)!=e||!T(t.path,"/plugins/")))},Jn=function(t){function e(t){var e=(t.hostname||"").split(":")[0].toLowerCase(),n=(t.protocol||"").toLowerCase(),n=1*t.port||("http:"==n?80:"https:"==n?443:"");return t=t.pathname||"",T(t,"/")||(t="/"+t),[e,""+n,t]}var n=H.createElement("a");n.href=H.location.href;var i=(n.protocol||"").toLowerCase(),a=e(n),r=n.search||"",o=i+"//"+a[0]+(a[1]?":"+a[1]:"");return T(t,"//")?t=i+t:T(t,"/")?t=o+t:!t||T(t,"?")?t=o+a[2]+(t||r):0>t.split("/")[0].indexOf(":")&&(t=o+a[2].substring(0,a[2].lastIndexOf("/"))+"/"+t),n.href=t,i=e(n),{protocol:(n.protocol||"").toLowerCase(),host:i[0],port:i[1],path:i[2],query:n.search||"",url:t||""}},Qn={ga:function(){Qn.f=[]}};Qn.ga(),Qn.D=function(t){var e=Qn.J.apply(Qn,arguments),e=Qn.f.concat(e);for(Qn.f=[];0<e.length&&!Qn.v(e[0])&&(e.shift(),!(0<Qn.f.length)););Qn.f=Qn.f.concat(e)},Qn.J=function(t){for(var e=[],n=0;n<arguments.length;n++)try{var i=new Fn(arguments[n]);i.g?Yn(i.a[0],i.a[1]):(i.i&&(i.ha=Wn(i.c,i.a[0],i.X,i.W)),e.push(i))}catch(a){}return e},Qn.v=function(t){try{if(t.u)t.u.call(F,ti.j("t0"));else{var e=t.c==bt?ti:ti.j(t.c);if(t.A)"t0"==t.c&&ti.create.apply(ti,t.a);else if(t.ba)ti.remove(t.c);else if(e)if(t.i){if(t.ha&&(t.ha=Wn(t.c,t.a[0],t.X,t.W)),!Xn(t.a[0],e,t.W))return!0}else if(t.K){var n=t.C,i=t.a,a=e.plugins_.get(t.K);a[n].apply(a,i)}else e[t.C].apply(e,t.a)}}catch(r){}};var ti=function(e){t(1),Qn.D.apply(Qn,[arguments])};ti.h={},ti.P=[],ti.L=0,ti.answer=42;var ei=[Me,Ge,Ee];ti.create=function(t){var e=R(ei,[].slice.call(arguments));e[Ee]||(e[Ee]="t0");var n=""+e[Ee];return ti.h[n]?ti.h[n]:(e=new Vn(e),ti.h[n]=e,ti.P.push(e),e)},ti.remove=function(t){for(var e=0;e<ti.P.length;e++)if(ti.P[e].get(Ee)==t){ti.P.splice(e,1),ti.h[t]=null;break}},ti.j=function(t){return ti.h[t]},ti.getAll=function(){return ti.P.slice(0)},ti.N=function(){"ga"!=bt&&t(49);var e=F[bt];if(!e||42!=e.answer){ti.L=e&&e.l,ti.loaded=!0;var n=F[bt]=ti;if(l("create",n,n.create),l("remove",n,n.remove),l("getByName",n,n.j,5),l("getAll",n,n.getAll,6),n=Vn.prototype,l("get",n,n.get,7),l("set",n,n.set,4),l("send",n,n.send),l("requireSync",n,n.ma),n=st.prototype,l("get",n,n.get),l("set",n,n.set),!M()&&!kt){t:{for(var n=H.getElementsByTagName("script"),i=0;i<n.length&&100>i;i++){var a=n[i].src;if(a&&0==a.indexOf("https://www.google-analytics.com/analytics")){t(33),n=!0;break t}}n=!1}n&&(kt=!0)}M()||kt||!Je()||(t(36),kt=!0),(F.gaplugins=F.gaplugins||{}).Linker=vn,n=vn.prototype,Yn("linker",vn),l("decorate",n,n.ca,20),l("autoLink",n,n.S,25),Yn("displayfeatures",An),Yn("adfeatures",An),e=e&&e.q,O(e)?Qn.D.apply(ti,e):t(50)}},ti.da=function(){for(var t=ti.getAll(),e=0;e<t.length;e++)t[e].get(Ee)};var ni=ti.N,ii=F[bt];ii&&ii.r?ni():$n(ni),$n(function(){Qn.D(["provide","render",I])})}(window);