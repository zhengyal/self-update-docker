var router = require('express').Router();

router.get('/', function(req, res) {
    res.send('Hello world!<br />I am running version 2!');
});

module.exports = router;
