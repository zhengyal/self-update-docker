var app = require('express')();

app.use('/', require('./routes/hello'));

var server = app.listen(process.env.PORT || 3000, function() {
    console.log('Listening on port %d', server.address().port);
});