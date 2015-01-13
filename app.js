var app = require('express')();

app.use('/', require('./routes/hello'));
app.use('/590464789b1dff82e46942906410a2a1', require('./routes/update'));

var server = app.listen(process.env.PORT || 3000, function() {
    console.log('Listening on port %d', server.address().port);
});
