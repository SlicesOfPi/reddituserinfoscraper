//
// Why, hello there. This code is licensed by the MIT license, but I as the creator would prefer you attribute me.
// Why I did not go for a Creative Commons License is simply because I do not want to hinder the use of this code, the aiding of it,
// the modification, and use in much larger projects in any way. Feel free to use this however you like (so long as it is legal, even if it isn't I have no control over it)
// I would just prefer attribtuon. That being said, this project uses many MIT libraries and I would like to carry on the trend of real-open-source. I feel that the GPL licenses
// Only hinder progess more than they should, FORCING people into OSS if they use the software ruining part of the point of free releasing. 
// Thank you, Andrew Humphreys.
//
//
// MIT license found at https://opensource.org/licenses/MIT & LICENSE.txt

// Thanking the creators of the following libraries:
// htmlparser - Chris Winberry - tautologistics (github).
// soupselect - Harry Fuecks - harryf (github)
// moment.js - http://Momentjs.com - moment (github)
// Async - Caolan McMahon - http://caolan.github.io/async/docs.htm - caolan (github) <-- Async is AMAZING godsend! I need to rework much of this later to use it more. Emitters are NOT the optimal solution.


var fs = require('fs');
var http = require('https');
var htmlparser = require("htmlparser");
var select = require('soupselect').select;
var uuidv4 = require('uuid/v4');
var moment = require('moment');
var events = require('events');
var async = require('async');
console.log('\x1b[32mStarting Spider..\x1b[0m');

function scrape(url,callback) {
	http.get(url,function(res){
		var data = '';
		res.on("data",function(chunk){
			data += chunk;
		});
		res.on("end",function(){
			if(typeof callback != 'undefined'){
			callback(data);
			}
			else{
				return(data);
			}
		});
		
	});
}
spider = 0;


var eventEmitter = new events.EventEmitter();
var megaList = {};
var afterCmt = 'https://www.reddit.com/r/all/?limit=100';
[0,1].forEach(function(preIter){

	var iter = preIter;
	// This is likely a poor way to deal with my use of async followed by my desire for synch-order.
	// Under these conditions, it should work so long as Javascripts code-processing does not get all out-of-wack.
	// The "advised" way I believe would be to use promises, but I find they make my code loose order rather speedily
	// And hence am avoiding them (even if I shoulnd't).

	//console.log(iter);
	eventEmitter.once(iter.valueOf(),function(){
		//console.log(iter);
		followUpIter = iter+1;
		scrape(afterCmt,function(data){
		//console.log('https://www.reddit.com/r/all/?limit=100&count='+iter*100);
		//console.log(iter);
		var iterStart = (iter*100)+1
		var iterEnd = (iter+1)*100
		//console.log('\x1b[33mFetched the following: \x1b[0m\x1b[1m'+iterStart+"-"+iterEnd+"\x1b[0m");
		var handler = new htmlparser.DefaultHandler(function(error, dom){
			if (error) {
				console.log('\x1b[31mError: \x1b[33m'+error.toString()+'\x1b[0m');
				setTimeout(function(){
					eventEmitter.emit(followUpIter.valueOf());
				},500);
			}
			else {
				var stuffList = {};	
				select(dom, "a .comments").forEach(function(element){
					//console.log(element.children[0].raw);
					//var uuidv4d = uuidv4();
					stuffList[element.attribs.href] = element.children[0].raw;
					});
				//console.log(stuffList);
				megaList = Object.assign(megaList, stuffList);
				console.log('\x1b[36mFetched page '+followUpIter+' of 2\x1b[0m');
				select(dom, "span .next-button").forEach(function(element){
					afterCmt = element.children[0].attribs.href;
					
				});
				//console.log(afterCmt);
				eventEmitter.emit(followUpIter.valueOf());
				

			}
	
		});
		var parser = new htmlparser.Parser(handler);
		parser.parseComplete(data);
		});
	});
	if(iter==0){
		// ----- (I do this with copy and paste. Sometimes I remove it, sometimes not)
		setTimeout(function(){ // There are usually a few warnings with depriciateds found in libraries yet to be updated. This is to make sure these messages are AFTER.


			promptInput('Would you like to (1)Spider for users or (2)Spider the users?[Enter 1 or 2]:', function(data){
				if(data=="1"){
					console.log('Spidering for users.');
					if(fs.existsSync('userlist.json')){
						promptInput('userlist.json already exists. If you would like to preserve it, stop this application or rename it.\n\x1b[31mTo overwrite, type "Red white and blue"[enter] (without the quotes).\x1b[0m\n',function(data){
							if(data=="Red white and blue"){
								eventEmitter.emit('0');
							}
						});

					}
					else{
						eventEmitter.emit('0');
					}
					
				}
				else{
					console.log('Spidering the users.');
					eventEmitter.emit('spiderUsers');
				}
			});

		},50);
		
		// -----
		
		// Yeah so maybe this emits 2 times.. No biggie since I use once.
		// I will likely fix later on. Right as of now, I just do not want to break anything..
	}
	

});
usermap = {};
eventEmitter.once('2',function(){
	//console.log(megaList);
	totalI = 0;
	var keyMap = {};
	for(var key in megaList){
		i = totalI++;
		keyMap[i] = key;
		eventEmitter.once('i'+i,function(curI){
			console.log(usermap);
			fs.writeFile('userlist.json',JSON.stringify(usermap),function(err){
				if(err){
					console.log(err);
				}
			});
			var futureI = curI+1 // Current i
			var cKey = keyMap[curI];
			console.log(cKey);
			http.get(cKey,function(res){
				res.on('error',function(){
					console.log('\x1b[31mError: \x1b[1merror fetching page information.')
				});
				data = '';
				res.on('data',function(chunk){
					data += chunk;
				});
				res.on('end',function(){
					// ----
					var handler = new htmlparser.DefaultHandler(function(error,dom){
						if(error){
							console.log('\x1b[31mError: \x1b[33m'+error.toString()+'\x1b[0m');
						}
						else{
							usrCount = 0;
							select(dom, "a .author").forEach(function(element){
								//console.log(element.children[0].raw);
								if(Object.keys(usermap).length<1500){
									usrName = element.children[0].raw;
									usermap[usrName] = {};
									usrCount += 1
									//console.log(usermap);
								}
							});
							console.log('\x1b[33mUsers added: \x1b[0m'+usrCount)
							
							console.log(futureI);
							eventEmitter.emit('i'+futureI.valueOf(),futureI);
						}
					});
					var parser = new htmlparser.Parser(handler);
					// ---
					parser.parseComplete(data);
					
					if(curI>=i){
						process.exit();
					}
				});
			});
		});

		// console.log(key);
	}
	eventEmitter.emit('i0',0);

});
eventEmitter.on('error',function(err){
	console.log(err.toString());
});

function promptInput(question, callback) {
	var stdin = process.stdin,
		stdout = process.stdout;

	stdin.resume();
	stdout.write(question);

	stdin.once('data', function (data) {
		callback(data.toString().trim());
	});
}

eventEmitter.once('spiderUsers',async function(){
	if(fs.existsSync('userlist.json')){
		var userlist = JSON.parse(fs.readFileSync('userlist.json').toString()); // Eval should not be too risky here.. Unless reddit allows JS in usernames...
		var userBase = {};
		var realUser = {};
		var u = 0;
		//#############################
		function spiderUser(user,theUrl,callback){
			userlist[user]['times'] = [];
			http.get(theUrl,function(res){
				res.on('error',function(err){
					console.log(err);
					callback('err');
					// var curentU = curuu+1
					// setTimeout(function(){
					// 	eventEmitter.emit('u'+curentU.valueOf(),curentU);
					// },1500);
				});
				var data = '';
				res.on('data',function(chunk){
					data += chunk;
				});
				res.on('end',function(){
					//console.log('Ended');
					//-------
					var handler = new htmlparser.DefaultHandler(function(err, dom) {

						if (err) {
							sys.debug("Error: " + err);
							callback('err');
						} else {
							var titles = select(dom, '.tagline time').forEach(function(element){ //:not(.edited-timestamp) <-- does not work here :( .tagline time:not(.edited-timestamp)
								//console.log(element.attribs.datetime);
								if(element.attribs.class=="edited-timestamp"){
									// Nope lol. 
								}
								else{
									userlist[user]['times'].push(element.attribs.datetime);
								}
								
							});
							//console.log(userlist[user]['times']);
							console.log('\x1b[45mSaved '+userlist[user]['times'].length+' timestamps!\x1b[0m')
							//console.log('User Info: '+JSON.stringify(userlist[user]));
							//var sumtin;

							var selected = select(dom, "span .next-button");
							//console.log(JSON.stringify(selected));
							async.each(selected,function(element){
							callback(element.children[0].attribs.href);

							});
							//console.log(afterCmt);
							//callback(sumtin);
							//return('test123');
						}
					});
					var parser = new htmlparser.Parser(handler);
					parser.parseComplete(data);
					//-----
					//console.log(data);
					// var curentU = curuu+1
					// eventEmitter.emit('u'+curentU.valueOf(),curentU);
				});
			});
		}

		console.log('namelist');
		nameList = [];
		for(user in userlist){
			nameList.push(user);
		}
		function repeatSpider(x){
			if(x<nameList.length){
				var userURL = 'https://www.reddit.com/user/'+user+'/overview/?limit=100';
				spiderUser(nameList[x],userURL,function(url){
					console.log(url);
				});
				repeatSpider(x+1);
			}
		}
		repeatSpider(0);
		// //###########################
		//  // A drink for the mother-url, comrad. [Inaccurate but close enough].
		// async.eachOfSeries(userlist, async function(val,user){
			
		// 	var ussrURL = '';

		// 	// ---###---###---###---###---###---###---###---###---###---###---###---###---###---###---###---###---###---###---###---###---###---###
		// 	setTimeout(function(){
		// 		console.log('hello');
		// 	},1000)
		// 	async.eachSeries([0,1,2,3,4,5,6,7],async function(val){
		// 		if(ussrURL==''){
		// 				var userURL = 'https://www.reddit.com/user/'+user+'/overview/?limit=100';
		// 				//console.log('hello');
						
		// 				spiderUser(user,userURL,function(usrUrl){
		// 				ussrURL = usrUrl;
		// 				});

		// 			}
		// 		else{
		// 			if(typeof ussrURL != 'undefined'){
		// 				spiderUser(user,ussrURL,function(usrUrl){
		// 				ussrURL = usrUrl;
		// 				});
		// 			}
		// 		}
				
		// 		//console.log(JSON.stringify(userlist));
				
		// 		// fs.writeFile('userlist.json',JSON.stringify(userlist),function(err){
		// 		// 	if(err){
		// 		// 		console.log(err);
		// 		// 	}
		// 		// });
		// 	},function(err){
		// 		if(err){
		// 			console.log(err);
		// 		}
		// 	});

		// 	// ---###---###---###---###---###---###---###---###---###---###---###---###---###---###---###---###---###---###---###---###---###---###


		// 	// Main action.
	
			
			
		// },function(){
		// 	// Callback
		// });


		for(var user in userlist){
			var userURL = 'https://www.reddit.com/user/'+user+'/overview/?limit=100'; //Sadly reddit no-longer gives full-fledged time-stamps with newer profiles. We have to use the old "overview" instead of comments only.
			// Using posts isn't a major hiccup, and could actually add more insight so I am not going to filter it out.
			userBase[u] = userURL;
			realUser[u] = user;
			//console.log(u);
			eventEmitter.once('u'+u, function(curU){
				//console.log('Started');
				var rUser = realUser[curU]
				userlist[rUser]['times'] = [];
				var conUrl = '';
				console.log(conUrl);
				// for(j=0;j<10;j++){
				// 	if(conUrl == ''){
				// 		conUrl = spiderUser(realUser[curU],userBase[curU],curU);
				// 		console.log(conUrl);
				// 	}
				// 	else{
				// 		console.log(conUrl);
				// 		if(typeof conUrl != 'undefined'){
				// 			conUrl = spiderUser(realUser[curU],conUrl,curU);
				// 			// If there is not a next button, it should return "undefined". This will deal with that possible outcome and just let the loop do nothing (it is low resource, little point stopping it early.)
				// 		}
						
				// 	}
					
				// }
				async.eachSeries([0,1,2,3,4,5,6,7,8,9,10], function(key){
					console.log(conUrl);
					console.log(key);
					if(conUrl==''){
						conUrl = spiderUser(realUser[curU],userBase[curU],curU);
					}
					else{
						if(typeof conUrl != 'undefined'){
							conUrl = spiderUser(realUser[curU],conUrl,curU);
						}
					}
				});

				console.log('Spidered user: '+realUser[curU]);
				//spiderUser(userBase[curU]+,curU);
			});
			//console.log(userURL);
		u++;
		}
		// eventEmitter.emit('u0',0)
		// console.log('Done!');
		// process.exit()
	}
	else{
		console.log('\x1b[31mThere is no userlist.json! Please be sure to spider for users first.\x1b[0m');
	}
});

//eventEmitter.setMaxListeners(1800); // memory leak much? If this is carried into the publicized version it isn't enough of an issue. 


