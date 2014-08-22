var port = (process.env.VCAP_APP_PORT || 3000);
var http = require('http');
var express = require('express');

var prefix = "http://www.iana.org/assignments/link-relations#";
var data;

function fetch(cb) {
  data = [];
  var options = {
    hostname: 'www.iana.org',
    port: 80,
    path: '/assignments/link-relations/link-relations-1.csv',
    method: 'GET'
  };
  var req = http.get(options, function(res) {
    var buffer = "";
    res.setEncoding('utf8');
    res.on('data', function (chunk) {
      buffer += chunk;
      var lines = buffer.split('\r\n');
      lines.forEach(
        function(d,i) {
          if (i == lines.length - 1) return;
          data.push(d.split(','));
        }
      );
      buffer = lines[lines.length-1]
    }).on('end', function() {
      cb(data); // callback with all the data
    });
  }).on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });
}

function jsonLdWriter(writer) {
  return function(data) {
     writer.write('{"@context":{', "UTF-8");
     writer.write('"link":"'+prefix+'"');
     data.forEach(function(d,i) {
       if (i!=0) {
         writer.write(',');
         writer.write('"'+d[0]+'": {');
         writer.write('"@id":"link:'+d[0]+'",');
         writer.write('"@container":"@set",');
         writer.write('"@type":"@id"');
         writer.write('}');
       }
     });
     writer.write('}}', "UTF-8");
     writer.end();
  }
}

var app = express();

app.get('/links', function(req, res) {
  res.statusCode = 200;
  res.set({
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=86400',
    'Content-Type': 'application/ld+json'
  });
  fetch(jsonLdWriter(res));
}).listen(port);
