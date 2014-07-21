var express = require('express');
var app = express();
var cheerio = require('cheerio');
var request = require('request');
var q = require("q");

var relToAbsUrl = function(base, url){
    if(!url) return "";
    
    if(url.indexOf("http:") == 0 || 
       url.indexOf("https:") == 0 || 
       url.indexOf("tel:") == 0 || 
       url.indexOf("mailto:") == 0) 
        return url;
    return base+url;
}    

app.get('/', function(req, res){
    var url = req.query.url;
    var target = req.query.target;
    if(!url || !target ) res.render('index.jade', { errors: 'URL and target fields must be present' });
    var baseurl = req.query.base || url;
    var rejecttarget = req.query.target;
    var base = url;
    var visited = {};
    var queue = {};
    request(base, function (error, response, html) {
      visited[base] = true;
      if (!error && response.statusCode == 200) {  
        var $ = cheerio.load(html);
        $('a').each(function(i, element){
          //console.log(relToAbsUrl(base, $(this).attr("href")));
            var newurl = relToAbsUrl(baseurl, $(this).attr("href"));
            if(newurl) {
                queue[newurl] = [true, $(this).text()];
                       }
        });
      }
    
        var requests_all = [];
        var results_all = [];
        j = 0;
        for (var key in queue) {
            if(!queue[key][0] || visited[key]) continue;
            var newurl = key;
            visited[newurl] = true;
            queue[newurl][0] = false;
            var deferred = q.defer();
            
            (function(deferred, newurl){
                request(newurl, function (error2, response2, html2) {

                    if (!error2 && response2.statusCode == 200) {  
                        var $$ = cheerio.load(html2);
                        var byline = $$(target).text();
                        if(rejecttarget && !$$(rejecttarget).text()){
                           deferred.resolve("");
                            return;
                        }
                        if(byline) {
//                            console.log(queue[key][1]);
//                            console.log(byline);
//                            console.log("-------------");
                            queue[newurl].push(byline);
//                            results_all.push(byline);
                            deferred.resolve(queue[newurl][1]+","+byline+"|");
                        }
                    else
                        deferred.resolve("");
//                        console.log(j);
                        
                    }else
                     deferred.reject("");   
                });
            }(deferred, newurl));
            
            requests_all[j++] = deferred.promise;
            
        }
        q.all(requests_all).then(function (results) {
            res.send(results);
        });
        
    });

});

app.get('/view', function(req, res){
    res.render('index.jade');
});

app.listen(3000);