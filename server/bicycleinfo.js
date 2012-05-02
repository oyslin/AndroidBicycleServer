
var URL = require('url'),
	http = require('http'),
	util = require('util');
var cityArray = ['suzhou', 'changshu', 'kunshan', 'nantong', 'zhongshan', 'shaoxing', 'wujiang'],
	mapUrls = ['http://www.subicycle.com/map.asp','http://www.csbike01.com/map.asp', 'http://www.ksbike01.com/map2.asp', 'http://www.ntbike.com/map.asp', 
			  'http://www.zsbicycle.com/zsbicycle/map.asp', 'http://www.sxbicycle.com/map1.asp', 'http://www.wjbicycle.com/wjbicycle/map.asp'],
	allBicyclesUrl = ['http://www.subicycle.com/szmap/ibikestation.asp' ,'http://www.csbike01.com/csmap/ibikestation.asp', 'http://www.ksbike01.com/ksmap/ibikestation.asp',
					  'http://www.ntbike.com/ntmap/ibikestation.asp','http://www.zsbicycle.com/zsbicycle/zsmap/ibikestation.asp',
					  'http://www.sxbicycle.com/sxmap/ibikestation.asp', 'http://www.wjbicycle.com/wjbicycle/wjmap/ibikestation.asp'],
	singleBicycleUrl = ['http://www.subicycle.com/szmap/ibikestation.asp?id=', 'http://www.csbike01.com/csmap/ibikestation.asp?id=', 'http://www.ksbike01.com/ksmap/ibikestation.asp?id=',
						'http://www.ntbike.com/ntmap/ibikestation.asp?id=', 'http://www.zsbicycle.com/zsbicycle/zsmap/ibikestation.asp?id=',
						'http://www.sxbicycle.com/sxmap/ibikestation.asp?id=', 'http://www.wjbicycle.com/wjbicycle/wjmap/ibikestation.asp?id='],
	cookieArray = [null, null, null, null, null, null, null],
	proxyPath = 'http://60.190.129.52:3128',
	proxyOptions = null,
	db = null;
	
function redirect(req, res){	
	var city = req.query['city'];
	var id = req.query['id'];
	
	var index = getIndex(city);
	// console.log('redirect index = ' + index);
	
	console.log('time = ' + new Date().toGMTString());
	
	if(!cookieArray[index]){
		console.log('===========================New Cookie==================================');
		getCookie(index, id, res);
	}else{
		console.log('===========================Old Cookie==================================');
		console.log('city = ' + city + ', id = ' + id);
		getBicycleInfo(index, id, res);
	}
	// getCookie(index, id, res);
}

function getIndex(city){
	var index = -1;
	for(var i in cityArray){
		if(cityArray[i] == city){
			index = i;
			break;
		}
	}
	return index;
}

function getCookie(index, id, res){
	var mapUrl = mapUrls[index];
	// var options = URL.parse(mapUrl);
	var options = proxyOptions;
	options.path = mapUrl;
	
	options.headers = {
		Connection : 'keep-alive',
		Host : mapUrl		
	};
	// options.port = '80';
	
	var req = http.get(options, function(response) {
		response.setEncoding('utf8');

		response.on('end', function(){
			var cookie = response.headers['set-cookie'][0].split('\\;');
			console.log('getCookie cookie = ' + cookie);
			cookieArray[index] = cookie;
			getBicycleInfo(index, id, res);
			// keepSessinTask(index);
		});
	});
	req.on('error', function(){
		res.writeHeader(404, "404");
		res.end('404');
	});
}

function getBicycleInfo(index, id, res){
	// var bicycleOption = URL.parse(getBicycleUrl(index, id));
	var bicycleOption = proxyOptions;
	var bicyclePath = getBicycleUrl(index, id)
	bicycleOption.path = bicyclePath;
	bicycleOption.headers = {
		Connection : 'keep-alive',
		Host : bicyclePath,
		cookie : cookieArray[index]		
	}
	
	http.get(bicycleOption, function(response) {
		response.setEncoding('utf8');
		var data = '';	
		response.on('data', function(chunck) {
			data += chunck;
		});
		response.on('end', function(){
			if(data){	
				if(data.length < 20){
					console.log('===============================***************************')
					removeCurrentProxy();
					initProxyOption();					
				}
				res.writeHead(200, {'Content-Type': 'text/plain'});
				res.end(data);
			}
		});
	});
}

function refreshCookieTask(){
	proxyOptions = URL.parse(proxyPath);
	console.log('----------------------refreshCookieTask------------------------------');
	for(var i = 0; i < 1; i++){
		//first get cookie
		getCookieTask(i);
		//then refresh cookie every 5 minutes
		setInterval(getCookieTask, 300000, [i]);
		//keep session in every 2 minutes
		// keepSessinTask(i);
	}
}

function getCookieTask(index){
	console.log('****************Refresh City ' + cityArray[index] +' cookie ****************')
	var mapUrl = mapUrls[index];
	// var options = URL.parse(mapUrl);
	
	var options = proxyOptions;
	options.path = mapUrl;
	
	console.log('options = ' + util.inspect(options));
	
	options.headers = {
		Connection : 'close',
		Host : mapUrl
	};
	
	http.get(options, function(response) {
		response.on('end', function() {
			// var cookie = response.headers['set-cookie'][0].split('\\;');
			// console.log('-----------Refresh Cookie city = ' + cityArray[index] + ', cookie = ' + cookie + ', time = ' + new Date().toGMTString());
			// cookieArray[index] = cookie;
			var newOptions = options;
			newOptions.headers.Connection = 'keep-alive';
			http.get(options, function(res) {
				res.on('end', function() {
					var cookieHeader = response.headers['set-cookie'];
					if(cookieHeader != null && cookieHeader.length > 0) {
						var cookie = response.headers['set-cookie'][0].split('\\;');
						cookieArray[index] = cookie;
						console.log('-----------Refresh Cookie city = ' + cityArray[index] + ', cookie = ' + cookie + ', time = ' + new Date().toGMTString());
					}
				});
			});
		});
	});
}

function keepSessinTask(index){
	console.log('-------------start time = ' + new Date().toString());
	setInterval(getBicycleInfoTask, 300000, [index]);
}

function getBicycleInfoTask(index){
	console.log('================getBicycleInfoTask=========== index = ' + index);
	// var bicycleOption = URL.parse(getBicycleUrl(index, 1));
	var bicycleOption = proxyOptions;
	var bicyclePath = getBicycleUrl(index, 1);
	
	bicycleOption.path = bicyclePath;
	bicycleOption.headers = {
		Connection : 'keep-alive',
		Host : bicyclePath,
		cookie : cookieArray[index]
	}
	
	http.get(bicycleOption, function(response){
		response.on('data', function(chunck){
			console.log('************bicycle info = ' + chunck);
			if(chunck.length < 20){
				console.log('-------------end time = ' + new Date().toGMTString());
			}
		});
	});
}

function getBicycleUrl(index, id){
	var url = "";
	if(id){
		url = singleBicycleUrl[index] + id;
	}else{
		url = allBicyclesUrl[index];
	}
	return url;
}

function initProxy(mongodb){	
	db = mongodb;
}

function initProxyOption(){
	var proxyList = db.collection('proxy');
	
	proxyList.findOne({}, function(err, result){
		console.log('err = ' + err + ', result = ' + util.inspect(result));
		if(err){
			return;
		}else{
			if(result){
				proxyPath = result.proxyUrl;				
				proxyOptions = URL.parse(proxyPath);
			}
		}
	});
}

function removeCurrentProxy(){
	var proxy = db.collection('proxy');
	proxy.remove({proxyUrl : proxyPath}, function(err, result){
		console.log('=======================Deleted proxy : ' + proxyPath);
		if(!err){
			console.log('Deleted proxy : ' + proxyPath);
		}
	});
}

exports.redirect = redirect;
exports.initProxy = initProxy;
exports.refreshCookieTask = refreshCookieTask;
