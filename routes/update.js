var router = require('express').Router(),
    AWS = require('aws-sdk'),
    properties = require('properties');

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

router.post('/', function(req, res) {
	if (!eb || !selfEnvironmentId) {
		res.status(500);
		res.send('');
		return;
	}

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
		                return;
		            }

		            res.send(JSON.stringify(data));
	        	}
	        );
    	}
    );
});

module.exports = router;
