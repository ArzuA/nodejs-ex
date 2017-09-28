var webServer = function(req, res){
        res.sendfile(__dirname + '/public' + req._parsedUrl.path, function(err){
                if(err){
                        console.log(err);
                        res.send(err.status, err.code);
                }
        });
};

module.exports.webServer = webServer;