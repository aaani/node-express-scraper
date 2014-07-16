var express = require('express');
var app = express();
var cheerio = require('cheerio');
var request = require('request');

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
    var base = url;
    var visited = {};
    var queue = {};
    request(base, function (error, response, html) {
        visited[base] = true;
      if (!error && response.statusCode == 200) {  
        var $ = cheerio.load(html);
        $('a').each(function(i, element){
          //console.log(relToAbsUrl(base, $(this).attr("href")));
            var newurl = relToAbsUrl(base, $(this).attr("href"));
            if(newurl) queue[newurl] = true;
        });
      }
    
    for (var key in queue) {
        if(!queue[key] || visited[key]) continue;
        var newurl = key;
        request(newurl, function (error2, response2, html2) {
            visited[newurl] = true;
            queue[newurl] = false;
            if (!error2 && response2.statusCode == 200) {  
                var $$ = cheerio.load(html2);
                var byline = $$(target).text();
                if(byline) console.log(byline);
            }
        });
    }
    res.send(queue);        
    });

});

app.listen(3000);