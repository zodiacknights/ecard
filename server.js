var express = require('express');
var app = express();

app.get('/', function(req, res) {res.sendFile(__dirname + '/index.html');});
app.get('/app.js', function(req, res) {res.sendFile(__dirname + '/app.js');});
app.get('/style.css', function(req, res) {res.sendFile(__dirname + '/style.css');});

console.log('listening on port ' + (process.env.PORT || 3000));
app.listen(process.env.PORT || 3000);
