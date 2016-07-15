/**
 * what-input - A global utility for tracking the current input method (mouse, keyboard or touch).
 * @version v3.0.0
 * @link https://github.com/ten1seven/what-input
 * @license MIT
 */
!function(e,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define("whatInput",[],t):"object"==typeof exports?exports.whatInput=t():e.whatInput=t()}(this,function(){return function(e){function t(o){if(n[o])return n[o].exports;var i=n[o]={exports:{},id:o,loaded:!1};return e[o].call(i.exports,i,i.exports,t),i.loaded=!0,i.exports}var n={};return t.m=e,t.c=n,t.p="",t(0)}([function(e,t){e.exports=function(){"use strict";function e(e){n(),o(e),w=!0,x=window.setTimeout(function(){w=!1},650)}function t(e){w||o(e)}function n(){window.clearTimeout(x)}function o(e){var t=r(e),n=l[e.type];if("pointer"===n&&(n=u(e)),m!==n){var o=document.activeElement.nodeName.toLowerCase();!c.hasAttribute("data-whatinput-formswitching")&&!c.hasAttribute("data-whatinput-formtyping")&&m&&v.indexOf(o)>-1||y.indexOf(t)>-1||i(n)}"keyboard"===n&&d(t)}function i(e){m=e,c.setAttribute("data-whatinput",m),-1===E.indexOf(m)&&E.push(m)}function r(e){return e.keyCode?e.keyCode:e.which}function u(e){return"number"==typeof e.pointerType?b[e.pointerType]:"pen"===e.pointerType?"touch":e.pointerType}function d(e){-1===f.indexOf(L[e])&&L[e]&&f.push(L[e])}function s(e){var t=r(e),n=f.indexOf(L[t]);-1!==n&&f.splice(n,1)}function a(){c=document.body,window.PointerEvent?(c.addEventListener("pointerdown",t),c.addEventListener("pointermove",t)):window.MSPointerEvent?(c.addEventListener("MSPointerDown",t),c.addEventListener("MSPointerMove",t)):(c.addEventListener("mousedown",t),c.addEventListener("mousemove",t),"ontouchstart"in window&&c.addEventListener("touchstart",e)),c.addEventListener(h,t),c.addEventListener("keydown",e),c.addEventListener("keyup",e),document.addEventListener("keyup",s)}function p(){return h="onwheel"in document.createElement("div")?"wheel":void 0!==document.onmousewheel?"mousewheel":"DOMMouseScroll"}var c,f=[],w=!1,m=null,v=["button","input","select","textarea"],h=p(),y=[16,17,18,91,93],l={keydown:"keyboard",keyup:"keyboard",mousedown:"mouse",mousemove:"mouse",MSPointerDown:"pointer",MSPointerMove:"pointer",pointerdown:"pointer",pointermove:"pointer",touchstart:"touch"};l[p()]="mouse";var x,E=[],L={9:"tab",13:"enter",16:"shift",27:"esc",32:"space",37:"left",38:"up",39:"right",40:"down"},b={2:"touch",3:"touch",4:"mouse"};return"addEventListener"in window&&Array.prototype.indexOf&&(document.body?a():document.addEventListener("DOMContentLoaded",a)),{ask:function(){return m},keys:function(){return f},types:function(){return E},set:i}}()}])});