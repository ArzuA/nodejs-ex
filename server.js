//npm modules that also need to be in the package.json file
var express = require('express'),//from json file
webServer = require('./webServer.js').webServer,//our own file
torontoBikes = require('./torontoBikes.js').torontoBikes;

//factory for a new app
var app=express();

// make url for toronto bikes

app.get("/torontoBikes", function(req, res){torontoBikes(req, res);});

//server everything index.html welcome file
app.use(webServer);



//set ipaddress from openshift, to command line or to localhost:8080
var ipaddr = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var port = process.env.OPENSHIFT_NODEJS_PORT || parseInt(process.argv.pop()) || 8080;

//start the server listening for requests
app.listen(port, ipaddr);
console.log('node.js running at port ' + port);
