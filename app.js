
var express = require('express'),
	app = express.createServer(),
	redis = require('redis'),
	redisDB = redis.createClient(),
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

redisDB.on("error", function (err) {
    console.log("Error " + err);
});

app.get('/', function(req, res){
	redisDB.mget('versionName', 'versionCode', function(err, versionInfo){
		if(err){
			res.redirect('/error');
		}else{
			var versionName = versionInfo[0],
				versionCode = versionInfo[1];
			console.log('versionName = ' + versionName);
			console.log('versionCode = ' + versionCode);
			res.render('index.jade', {title:'AndroidBicycle', verionInfo : {versionName : versionName, versionCode : versionCode}});
		}
	});
	
});

app.get('/bicycleinfo', function(req, res){
	bicycleInfo.redirect(req, res);
});

app.get('/versioninfo', function(req, res){
	redisDB.mget('versionName', 'versionCode', function(err, versionInfo){
		if(err){
			res.redirect('/error');
		}else{
			res.json({versionName: versionInfo[0], versionCode : versionInfo[1]});
		}
	});
});

app.get('/updateversioninfo', function(req, res){	
	res.render('uploadverioninfo.jade',{title:'Update Version'});
});

app.get('/feedback', function(req, res){
	res.render('feedback.jade', {title: 'Feedback'});
});

app.get('/error', function(req, res){
	res.send('Error!', 404);
});

app.post('/versioninfo', function(req, res){
	var versionName = req.body.versionName;
	var versionCode = req.body.versionCode;
	console.log('versionName = ' + versionName);
	console.log('versionCode = ' + versionCode);
	redisDB.set('versionName', versionName);
	redisDB.set('versionCode', versionCode);
	
	res.redirect('/');
});

app.post('/feedback', function(req, res){
	
});

app.listen(8000);

bicycleInfo.refreshCookieTask();

console.log('Listen on port 4000!');
