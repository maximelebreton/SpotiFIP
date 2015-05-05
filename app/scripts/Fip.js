// This module requires jQuery.

try {
	// Enable module to work with jQuery in Node.JS
	var $ = require('jquery').create();
}
catch(e) {}

var Fip = {};
console.log('hey');

Fip.collection1 = function (callback) {
	var type = 'GET';

	var headers = {};

	var queryString = "?" + "start_hour" + "=" + encodeURIComponent("17") + "&" + "search" + "=" + encodeURIComponent("") + "&" + "start_date" + "=" + encodeURIComponent("2014-02-26") + "&";

	var data = "";

	var url = "http://www.fipradio.fr/archives-antenne" + queryString;

	$.ajax({
		type: type,
		url: url,
		headers: headers,
		data: data,
		crossDomain: true,


		beforeSend: function(xmlHttpRequest) {
			// Requires node-XMLHttpRequest version 1.5.1 or later to set some headers in Node.js
			if(xmlHttpRequest.setDisableHeaderCheck) xmlHttpRequest.setDisableHeaderCheck(true);
			return true;
		}
	})
	.always(
		function (response, error) {
			response = response || '';

			if (!response.responseText) {
				try {
					var $html = $(toStaticHTML(response));
				}
				catch(e) {
					var $html = $(response);
				}
			}
			else response = response.responseText;
			var _album = $html.find('#content-area .album');
			var _artist = $html.find('#content-area .artiste, #content-area .artistes');

			var fullResponse = {
				response: response,
				album: _album,
				artist: _artist,
			};

			callback(null, fullResponse);

		}
	);
};
if(typeof(exports) != "undefined") exports.collection1 = Fip.collection1; // For nodeJS

