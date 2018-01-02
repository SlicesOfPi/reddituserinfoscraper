var fs = require('fs');
var http = require('https');
var htmlparser = require("htmlparser");
var select = require('soupselect').select;
var usermap = {};
exports.scrapeFunc = function(usrmap,mgList) {
	usermap = usrmap;
	//console.log(megaList);
	var keyMap = {};
	megList = []// I gues megaList is really megaObject..
	megaList = mgList;
	megList = Object.keys(megaList);
	function traverseMegaList(x){
		if(x>megList.length){
			console.log('All the links have been exhausted!');
			process.exit();
		}
		else{


			i = x;
			curKey = megList[i];
			var cKey = megList[x]; // Todo: Remove all cKey for curKey.
			//console.log('Usermap'+usermap);
			fs.writeFile('userlist.json',JSON.stringify(usermap),function(err){
				if(err){
					console.log(err);
				}
			});
			var futureI = x+1;
			//console.log(cKey);
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
									process.exit(); // Commented as I need to ensure it all works good.
								}
							});
							console.log('\x1b[33mUsers indexed: \x1b[0m'+usrCount)
							
							//console.log(futureI);
							traverseMegaList(x+1);
						}
					});
					var parser = new htmlparser.Parser(handler);
					// ---
					parser.parseComplete(data);
					
				});
			});
		}

			// console.log(key);
	}
	traverseMegaList(0);

}