var fs = require('fs');
var http = require('https');
var htmlparser = require("htmlparser");
var select = require('soupselect').select;
var uuidv4 = require('uuid/v4');
var moment = require('moment');
var events = require('events');
var Readable = require('stream').Readable; 
var writing = false;
var moment = require('moment');
exports.spiderMain = function() {
	if(fs.existsSync('userlist.json')){
		// shh
	}

	else{
		console.log('\x1b[31mNo userlist.json file found! Please make sure to generate first.\x1b[0m');
		process.exit();
	}
	userlist = JSON.parse(fs.readFileSync('userlist.json'));

	function spiderUser(url,user,callback){
		if(typeof userlist[user]['postdata'] == 'undefined'){
			userlist[user]['postdata'] = {};
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
						select(dom, '.comment').forEach(function(subDom){
							select(subDom, '.entry').forEach(function(element){ // :not(.reddit-entry) currently does not work, so instead we have to filter below.
								useDom(element,'comment');

							});
						});
						select(dom, '.link').forEach(function(subDom){
							karma = 0;
							select(subDom, '.midcol .score.unvoted').forEach(function(karmDom){
								karma = karmDom.attribs.title.valueOf();
							});
							select(subDom, '.entry').forEach(function(element){ // :not(.reddit-entry) currently does not work, so instead we have to filter below.
								useDom(element,karma);

							});
						});
							
						function useDom(element,karma){
							if(element.attribs.class.indexOf('reddit-entry') == -1){ // If the class attribute contains 'reddit-entry' it will not index it. This is because reddit-entry is the class of the side-bar of recently viewed posts.
								var dateTime = ''; 
								var anIterator = 0;
								select(element, '.tagline time').forEach(function(child){
									anIterator++;
									if(anIterator==1){ 
										userlist[user]['postdata'][child.attribs.datetime] = {};
										dateTime = child.attribs.datetime;
									}	
								});
								if(typeof karma == 'string'){
									select(element, '.tagline span.score.unvoted').forEach(function(child){ // This should not be ran logged in, as cookies are not kept. This means everything will be unvoted.
										userlist[user]['postdata'][dateTime]['karma'] = child.attribs.title.valueOf();

									});
								}
								else{
									//console.log('Karma: '+karma);
									userlist[user]['postdata'][dateTime]['karma'] = karma;
								}
								select(element, '.tagline .edited-timestamp').forEach(function(child){
									userlist[user]['postdata'][dateTime]['edited'] = child.attribs.datetime;
								});
								select(element, '.usertext .usertext-body .md p').forEach(function(child){
									userlist[user]['postdata'][dateTime]['body'] = child.children[0].raw;
									userlist[user]['postdata'][dateTime]['type'] = 'comment';
								});
								select(element, '.top-matter .title .title').forEach(function(child){
									userlist[user]['postdata'][dateTime]['url'] = child.attribs.href;
									userlist[user]['postdata'][dateTime]['title'] = child.children[0].raw;
									userlist[user]['postdata'][dateTime]['type'] = 'post';
								});
								select(element, '.entry .reportform').forEach(function(child){
									userlist[user]['postdata'][dateTime]['id'] = child.attribs.class.replace('reportform report-','');
									// https://www.reddit.com/api/info.json?id=
									// https://www.reddit.com/api/info?id=t1_dr8kbyo
									// Either/or. One returns useful JSON data the other has to be parsed but is easily human-readable.
								});
								userlist[user]['postdata'][dateTime]['currentTimestamp'] = moment().utc().format().toString(); // The format should defaul to ISO8601 standard, which is what reddit uses. Although it will look a little different, +00:00 and Z both mean "UTC" timestamp.
								
							}
							else{
								//console.log(element.attribs.class+'[debugging no.2]');
							}
						}
						//console.log(userlist[user]['postdata']);
						console.log('\x1b[43m'+Object.keys(userlist[user]['postdata']).length+' Timestamp records for '+user+'.\x1b[0m');
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
	var userIndex = []; // Define a list fo the user-index.
	if(typeof userlist['i'] == 'undefined'||typeof userlist['i']['iteree'] == 'undefined'||typeof userlist['i']['progress'] == 'undefined'){ // This line right here, ensures that if the i (for info) tag in the data set is not existing, it will be.
		// It also writes the other desired variables, that may be needed. (The iterations, and progress).
		// This process is similar to what Steam does with their app-manifest on downloads where it saves the bytes as it goes.
		console.log('\x1b[33mSet progress info to zero.\x1b[0m');
		userlist['i'] = {};
		userlist['i']['iteree'] = 0;
		userlist['i']['progress'] = 0;
	}
	setuserIndex = function(callback){
		if(fs.existsSync('userlistordered.txt')){ // if the list already exists take it, and parse it into a list.
			console.log('\x1b[33mUserlist ordered found. Pickup up from there.\x1b[0m'); // Alert the user it's picking up.
			userIndex = JSON.parse(fs.readFileSync('userlistordered.txt'))[0]; // it will remain a 'list type' if it is written as part of a JSON string, so the list is parsed, then the value of the '0' key containing the list is extracted.
		}
		else{
			for(var user in userlist){
				if(user!='i'){ // I is not a reddit user at all, and here it means 'info'. 
					userIndex.push(user); // Adds the user to the user index. This index will remain constant.
				}
			}
			fs.writeFileSync('userlistordered.txt',JSON.stringify({'0':userIndex})); // Saves the list into a JSON object where it will remain part of the list-type. This is to preserve the index-order incase of an exit or crash.
		} 
		callback();
	}
	setuserIndex(function(){
		loopUsers(userlist['i']['progress'],userlist['i']['iteree']); // Right here it starts the loop right up, and it should maintain itself.
	});

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
			userlist['i']['progress'] = j; // Update the progress/user so if the program is stopped it can resume.
			userlist['i']['iteree'] = k; // Updates the section of the user it is on.
			//console.log(userlist['22051777']['nextlink']);
			//fs.writeFileSync('userlist.json',JSON.stringify(userlist)); // It is important to keep the file updated. Incase if it gets interrupted it is always possible to recover. (With some manual work involved of course.)
			var s = new Readable(); // Creates a new readable stream.
			var wStream = fs.createWriteStream('userlist.json', { flags : 'w' }); // Creates a new writable stream writing it's input to userlist.json.
			s._read = function noop() {}; 
			var content = JSON.stringify(userlist);
			writing = true;
			s.push(content); 
			s.push(null);
			s.pipe(wStream);
			wStream.on('close', function () {
				writing = false;
			});

			
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

	


}

// process.on('exit',function(){
// 	if(writing==true){
// 		console.log('Program is currently writing');
// 	}
// });


process.on ("SIGINT", function(){ // SIGINT is called on ctrl+c exit. This stops that from happening, while if the user wants to do something like `killall nodejs` it'll still work (or shut the terminal, etc).
	// Peacful exit when ctrl+c but less intended to be peacful exits are unpeacful and risky.
	if(writing){ // Writing will be set to true once it starts writing to the file.
	    console.log('\x1b[31mCurrently writing to the file! Waiting for write to finish to avoid corruption.\x1b[0m'); // Alert the user what's happening so they don't freak out and hit the X if it takes a while to write.
	    var testWriting = function(callback){ // This is a loop that preforms the following: if(writing==true)-->wait 15 seconds-->Go to start of function
	    	if(writing){
	    		setTimeout(function(){
	    			testWriting(callback);
	    		},15);
	    	}
	    	else { // And if it is not true, it will callback.
	    		callback();
	    	}
	    }
	    testWriting(function(){
	    	process.exit(); // The callback is to exit, so once it stops writing (15ms max after that happens) it will stop.
	    });
    }
    else{ // If it is not writing, then it will exit.
    	process.exit();
    }
});

// function safeStringify(str) {
//   try {
//      JSON.stringify(str);
//   } catch (error) {
//     return null;
//   }
// }