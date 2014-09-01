var Destination = new Array(); // Leave line as is.

// Two customization steps --
//
// Step 1:
// Specify each applicable language code and its URL,
//   one line per code, in this format:
//
//   Destination["code"] = "http://mikerai.com";

Destination["es"] = "http://mikerai.com/index_es.html";


// Step 2:
// Specify the default destination URL for when none of 
//   the above match. (May be blank for no default redirect.)

var DefaultDestination = "http://mikerai.com/";


 // No other customization required. //
//////////////////////////////////////
var lang = navigator.language ? navigator.language :
           navigator.browserlanguage ? navigator.browserlanguage : 
           navigator.systemLanguage ? navigator.systemLanguage : 
           navigator.userLanguage ? navigator.userLanguage : 
           '---';
lang = lang.toLowerCase();
var dest = new String();
for( var t in Destination ) {
   if( t == lang ) {
      dest = Destination[t];
      break;
      }
   }
if( dest.length == 0 ) {
   lang = lang.substr(0,2);
   for( var t in Destination ) {
      if( t == lang ) {
         dest = Destination[t];
         break;
         }
      }
   }
if( dest.length == 0 ) { dest = DefaultDestination; }
if( dest.length > 0 ) { location.href = dest; }