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
							else{
								console.log("\x1b[31mThat didn't work! Try again.\x1b[0m");
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
								if(Object.keys(usermap).length<1501){
									usrName = element.children[0].raw;
									usermap[usrName] = {};
									usrCount += 1
									//console.log(usermap);
								}
								else {
									console.log('\x1b[33mGood news! You have finished at 1500 users.\x1b[0m');
									// process.exit(); // Commented as I need to ensure it all works good.
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

eventEmitter.once('spiderUsers',function(){
	if(fs.existsSync('userlist.json')){
		// shh
	}
	else{
		console.log('\x1b[31mNo userlist.json file found! Please make sure to generate first.\x1b[0m');
		process.exit();
	}
	userlist = JSON.parse(fs.readFileSync('userlist.json'));

	function spiderUser(url,user,callback){
		if(typeof userlist[user]['timestamps'] == 'undefined'){
			userlist[user]['timestamps'] = [];
		}
		http.get(url,spdrUsr);
		function spdrUsr(res){
			res.on('err',function(){
				console.log('\x1b[31mError fetching!\x1b[0m');
			});
			var data = '';
			res.on('data',function(chunk){
				data += chunk;
			});
			res.on('end',function(){
				console.log('\x1b[33mDownloaded page for '+user+'.\x1b[0m');
				var handler = new htmlparser.DefaultHandler(handlerFunc);
				function handlerFunc(err, dom){
					if(err){
						console.log('\x1b[31mError: \x1b[0m\x1b[1m'+err);
					}
					else{
						// Start doing useful stuff around here.
						select(dom, '.tagline time').forEach(function(element){
							if(element.attribs.class == 'edited-timestamp'){
							}
							else{
								userlist[user]['timestamps'].push(element.attribs.datetime);
							}
						});
						console.log('\x1b[43m'+userlist[user]['timestamps'].length+' Timestamp records for '+user+'.\x1b[0m');
						userlist[user]['nextlink'] = 'forward';
						select(dom, '.next-button a').forEach(function(element){
							userlist[user]['nextlink'] = element.attribs.href;
						});
					}
					callback();


				}
				var parser = new htmlparser.Parser(handler);
				parser.parseComplete(data);
			});
		}
	}
	var userIndex = [];
	for(var user in userlist){
		if(user!='i'){
			userIndex.push(user);
		}
	}
	var Readable = require('stream').Readable;
	//console.log(userIndex);
	// I did a similar idea with eventListeners above (which is kind of horrific and needs a revamp later on), but it was stack-exchange which properly made me do this with functions.
	function loopUsers(j,k){ // "j" as in the substitute for i(terator) simply because "i" is very generic and I may use it ("i") at some point globally. And k as in after j. K is still an iterator. (Just-kidding, too :P)
	// The position of j is to act as a "user iterator", where as k is merely a value to ensure you only iterate a certain users X times.
		//'https://www.reddit.com/user/'+userIndex[j]+'/overview/?limit=100'
		//console.log(j);
		if(typeof userlist[userIndex[j]]['nextlink'] == 'undefined' || userlist[userIndex[j]]['nextlink'] == '' || userlist[userIndex[j]]['nextlink'] == 'forward' || userlist[userIndex[j]]['nextlink'] == 'err'){
			userLink = 'https://www.reddit.com/user/'+userIndex[j]+'/overview/?limit=100'
		}
		else{
			userLink = userlist[userIndex[j]]['nextlink'];
		}
		spiderUser(userLink, userIndex[j],function(){
			userlist['i']['progress'] = j;
			userlist['i']['iteratee'] = k;
			//console.log(userlist['22051777']['nextlink']);
			//fs.writeFileSync('userlist.json',JSON.stringify(userlist)); // It is important to keep the file updated. Incase if it gets interrupted it is always possible to recover. (With some manual work involved of course.)
			var s = new Readable();
			var wStream = fs.createWriteStream('userlist.json', { flags : 'w' });
			s._read = function noop() {}; // To a large degree, this is a copy & paste from stack-exchange. I do not fully understand it. 
			var content = JSON.stringify(userlist);
			if(content!=''&&typeof content=='string'){
				s.push(content); 
				s.push(null);
				s.pipe(wStream);
				wStream.on('close', function () {
					// Good to keep around. (Troubleshooting, further development, etc)
				});
			}
			
			if(userlist[userIndex[j]]['nextlink']=='forward'){ // If the user has no next button, the link will be set to 'forward'. To stop it from trying to lookup the domain 'forward' (and failing in an exception) it will call the next function to go.
				userlist[userIndex[j]]['nextlink'] = ''; // And said next function will not have a set link, and if it is forward for *some* reason it will be dealt with.
				loopUsers(j+1,0);

			}
			else if(userlist[userIndex[j]]['nextlink']=='err'){ // The else...ifs here are used to prevent multiple instances of the function from running.
				setTimeout(function(){
					loopUsers(j,k+0.5); //Basically if it fails, try again. It will iterate many more times before picking a new user. This is set so, say a user is deleted. It will *eventually* move on.
					// For it to stop if a failure happened would be painstakingly stupid. Considering the upper-limits of user-scraping is 1500, and 5 cycles on the users.. That is 7,500 requests. A lot of time to toss away.
					userlist[userIndex[j]] = 'https://www.reddit.com/user/'+userIndex[j]+'/overview/?limit=100'; // It will need to be reset. Better few than none.
				},30000); // Wait thirty seconds if there is an error. This is a "reasonable" time, and (I deem) polite to reddit incase it starts denying requests.
			}
			else if(k>4){
				loopUsers(j+1,0); // Right here, If it has looped a user more than 4 times (preferably five) it will move onto the next user.
			}
			else if(k<=4){
				loopUsers(j,k+1); // And if it has not looped 5 times+ it will add another tick to the iterator mark.
			}

		});
		
	}
	if(typeof userlist['i'] == 'undefined'||typeof userlist['i']['iteratee'] == 'undefined'||typeof userlist['i']['progress'] == 'undefined'){
		console.log('\x1b[33mSet progress info to zero.\x1b[0m');
		userlist['i'] = {};
		userlist['i']['iteratee'] = 0;
		userlist['i']['progress'] = 0;
	}
	loopUsers(userlist['i']['progress'],userlist['i']['iteratee']); // Right here it starts the loop right up, and it should maintain itself. 




});

//eventEmitter.setMaxListeners(1800); // memory leak much? If this is carried into the publicized version it isn't enough of an issue. 


