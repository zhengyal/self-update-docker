var router = require('express').Router(),
    AWS = require('aws-sdk'),
    properties = require('properties'),
    ip = require('ip'),
    bodyParser = require('body-parser'),
    request = require('request');

var selfEnvironmentId = null,
	eb = null;

properties.parse('/etc/elasticbeanstalk/.aws-eb-stack.properties', { path: true }, function(err, data) {
    if (err) {
        console.log(err);
        return;
    }

    AWS.config.update({region: data.region});
    eb = new AWS.ElasticBeanstalk(),

    selfEnvironmentId = data.environment_id;
});

router.use(bodyParser.json());

router.post('/', function(req, res) {
	// checks whether the request came from Docker Hub servers
	// X-Forwarded-For can be spoofed! Assigning an obscure URL for the update hook is still recommended
	var reqIp = req.headers['x-forwarded-for'] ?
				req.headers['x-forwarded-for'].split(',')[0] :        // ELB(w/ or w/o nginx) / Single instance(w/ nginx)
				req.connection.remoteAddress.replace('::ffff:', '');  // Single instance(w/o nginx)

	if (!(ip.toLong(reqIp) >= ip.toLong('162.242.195.64') && ip.toLong(reqIp) <= ip.toLong('162.242.195.127'))) {
		res.status(403);
		res.send('');
		return;
	}

	if (!eb || !selfEnvironmentId) {
		res.status(500);
		res.send('');
		return;
	}

	var callbackUrl = req.body.callback_url;

    eb.describeEnvironments(
    	{ 
    		EnvironmentIds: [ selfEnvironmentId ]
    	},
    	function(err, data) {
	        if (err) {
	            console.log(err);
	            res.status(500);
	            res.send('');
	            return;
	        }

	        eb.updateEnvironment(
	        	{
	            	EnvironmentId: selfEnvironmentId,
	            	VersionLabel: data.Environments[0].VersionLabel
	        	},
	        	function(err, data) {
		            if (err) {
		                console.log(err);
		                res.status(500);
		                res.send('');
		                request.post({
			            	url: callbackUrl,
			            	json: true,
			            	body: {
			            		state: 'error'
			            	}
			            }, function() {});
		                return;
		            }

		            res.send('');
		            request.post({
		            	url: callbackUrl,
		            	json: true,
		            	body: {
		            		state: 'success'
		            	}
		            }, function() {});
	        	}
	        );
    	}
    );
});

module.exports = router;
