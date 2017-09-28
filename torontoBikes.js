var jQuery = require('js-toolbox')._jQuery;

//https://feeds.bikesharetoronto.com/stations/stations.json is no longer available

var torontoBikes = function (req, res, next, callback){
	jQuery.ajax({url:"https://tor.publicbikesystem.net/ube/stations"})
	.done(function(data){
		res.setHeader("Content-Type", "application/json");
		res.end(data);
		if(callback)callback(null);
	}).fail(function(err){
		console.log(err);
		res.send(err.status, err.code);	
		if(callback)calback(err);
	});
}


module.exports.torontoBikes = torontoBikes;