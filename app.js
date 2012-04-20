
var express = require('express'),
	app = express.createServer(),
	mongo = require('mongoskin'),
	util = require('util'),
	mongodb = mongo.db('127.0.0.1:27017/bicycleproxy'),
	bicycleInfo = require('./server/bicycleinfo');
	
app.configure(function() {
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.set('view options', { layout: false});
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
	app.use(express.errorHandler({
		dumpExceptions : true,
		showStack : true
	}));
});

app.configure('production', function() {
	app.use(express.errorHandler());
});

app.get('/', function(req, res){
	var versioninfo = mongodb.collection('versioninfo');
	versioninfo.findOne({appName:'AndroidBicycle'}, function(err, data){
		if(err){
			res.redirect('/error');
		}else{
			var versionName = data.versionName,
				versionCode = data.versionCode;
			if(versionName == null || versionName == ''){
				versionName = '1.0';
				versionCode = 1;
			}
			res.render('index.jade', {title:'AndroidBicycle', verionInfo : {versionName : versionName, versionCode : versionCode}});
		}
	});	
});

app.get('/bicycleinfo', function(req, res){
	bicycleInfo.redirect(req, res);
});

app.get('/versioninfo', function(req, res){
	var versioninfo = mongodb.collection('versioninfo');
	versioninfo.findOne({appName:'AndroidBicycle'}, function(err, data){
		if(err){
			res.redirect('/error');
		}else{
			res.json({versionName:data.versionName, versionCode: data.versionCode});
		}
	});
});

app.get('/updateversioninfo', function(req, res){	
	res.render('uploadverioninfo.jade',{title:'Update Version'});
});

app.get('/feedback', function(req, res){
	var feedback = mongodb.collection('feedback');
	feedback.find({}).toArray(function(err, result){
		if(err){
			res.redirect('/error');
		}else{
			// console.log('result = ' + util.inspect(result));
			res.render('feedback.jade', {title:'AndroidBicycle Feedback', feedbackArray : result});
		}
	});
	
});

app.get('/error', function(req, res){
	res.send('Error!', 404);
});

app.post('/versioninfo', function(req, res){
	var versionName = req.body.versionName;
	var versionCode = req.body.versionCode;	
	
	var versioninfo = mongodb.collection('versioninfo');
	
	versioninfo.find({appName:'AndroidBicycle'}).toArray(function(err, data){
		if(err){
			res.redirect('/error');
		}else{
			if(data.length == 0){
				versioninfo.insert({appName:'AndroidBicycle', versionName:versionName, versionCode : versionCode}, function(err){
					if(err){
						res.redirect('/error');
					}else{						
						res.redirect('/');						
					}
				});
			}else{
				versioninfo.update({appName:'AndroidBicycle'}, {$set:{versionName:versionName, versionCode : versionCode}}, function(err){
					if(err){
						res.redirect('/error');
					}else{
						res.redirect('/');
					}
				});
			}
		}
	});	
});

app.post('/feedback', function(req, res){
	var feedbackMsg = req.body.msg;
	var feedback = mongodb.collection('feedback');
	feedback.inert({appName:'AndroidBicycle', feedbackMsg : feedbackMsg, uploadTime : new Date().toLocaleString}, function(err, result){
		if(err){
			res.redirect('/error');
		}else{
			if(result){
				res.redirec('/');
			}else{
				res.redirect('/error');
			}
		}
	});
});

app.listen(8000);

bicycleInfo.refreshCookieTask();

console.log('Listen on port 4000!');
