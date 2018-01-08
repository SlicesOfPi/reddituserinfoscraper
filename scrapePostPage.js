var fs = require('fs');
var http = require('https');
var htmlparser = require("htmlparser");
var select = require('soupselect').select;
var usermap = {};
exports.scrapeFunc = function(usrmap,mgList) {
	usermap = usrmap; // Same idea as comment below.
	megaList = mgList; // This allows megaList to be changed, unlike the argument mgList.
	megList = Object.keys(megaList); // All the keys: in megaList to be seperated from the values. Doing this, you get a static list that
	// will not be changed in order. This is, more of an issue when saving to a file that may be ran on another node version, device,
	// etc. because it may parse the JSON in different order.
	function traverseMegaList(x){ // This function (sync) will be called at presumably zero (or wherever it left off) --> do stuff --> call itself x+1.
		if(x>megList.length){ // If X is larger than the keys in megaList it will exit as all the pages on reddit have been exhausted.
			console.log('All the links have been exhausted!'); // Tell the user what is happening.
			process.exit(); // Exit.
		}
		else{ // If it is NOT longer, e.g. most of the time it will be running it will do the following:


			i = x; // I can have the freedom to use i OR x as my iterator.
			curKey = megList[i]; // The current key in megList.
			var cKey = megList[x]; // Todo: Remove all cKey for curKey.
			//console.log('Usermap'+usermap);
			fs.writeFile('userlist.json',JSON.stringify(usermap),function(err){ // Writes to the userlist.json file the userlist. It will at this time look like user: {}, user2: {},
				if(err){ // If there was an error..
					console.log(err); // Log said error.
				}
			});
			var futureI = x+1; // This is used to prevent (in my mind ugly) things like myVar = thisVar+(x+1);.
			http.get(cKey,function(res){ // cKey as above will be the URL to the page.
				res.on('error',function(){ // 'error handling'. It won't work for exceptions but it's there.
					console.log('\x1b[31mError: \x1b[1merror fetching page information.'); // Alert the user there was an error.
				});
				data = ''; // Delcares data as an empty string.
				res.on('data',function(chunk){ // when data is recieved (acts if it is not a readStream).
					data += chunk; // It will add said data to the whole of the data string.
				});
				res.on('end',function(){ // When the stream is ended.
					var handler = new htmlparser.DefaultHandler(function(error,dom){ // Defines a handler to use when parsing the HTML.
						if(error){
							console.log('\x1b[31mError: \x1b[33m'+error.toString()+'\x1b[0m');
						}
						else{
							usrCount = 0; // Declares usrCount as a zero number.
							select(dom, "a .author").forEach(function(element){ // uses soupselect to select using CSS selector "a .author" to get parts of the dom that match. Then loops it in a forEach.
								//console.log(element.children[0].raw);
								if(Object.keys(usermap).length<1501){ // if the length of the usermap is less than 1501 (maxing out at 1500) it will continue.
									usrName = element.children[0].raw;
									usermap[usrName] = {};
									usrCount += 1
									//console.log(usermap);
								}
								else {
									console.log('\x1b[33mGood news! You have finished at 1500 users.\x1b[0m'); // Alert the user what's happening.
									process.exit(); // When it has 1500 users, it will stop.
								}
							});
							console.log('\x1b[33mUsers indexed: \x1b[0m'+usrCount) // Tell the user how many users are indexed.

							//console.log(futureI);
							traverseMegaList(x+1); // Calls the function again, to continue scraping links.
						}
					});
					var parser = new htmlparser.Parser(handler); // creates a parser to the handle we just declared.
					// ---
					parser.parseComplete(data); // Actually parses the data.

				});
			});
		}

			// console.log(key);
	}
	traverseMegaList(0); // Starts the megalist traverser.

}
