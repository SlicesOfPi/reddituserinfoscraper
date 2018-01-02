var http = require('https');
var htmlparser = require("htmlparser");
var select = require('soupselect').select;

function scrape(url,callback) {
	//console.log('Scraping');  //For debugging
	http.get(url,function(res){
		var data = '';
		res.on("data",function(chunk){
			data += chunk;
			//console.log('Data'); //For debugging
		});
		res.on("end",function(){
			//console.log('Scraped');  //For debugging
			if(typeof callback == 'function'){
			callback(data);
			}
			else{
				return(data);
			}
		});
		
	});
}
var afterCmt = '';
var megaList = '';
exports.doMain = function(x,startingMegalist,startLink,callback){
	if(x==0){
		afterCmt = startLink; // These two lines are so I am not trying to change an argument var, which when I transfered all this code to another file was a very real issue I overlooked was happening at first. 
		megaList = startingMegalist; // ^
	}
	if(x==2){
		callback(megaList,afterCmt); // Once x is two, the loop will be stopped (by not continueing onto calling x=3), and it will preform the callback with the afterCmt (next page URL) & the megaList ( list of posts to spider ).
	}
	else{
		scrape(afterCmt,function(data){
			var iterStart = (x*100)+1 // The first posts range (post #1, post #2 on reddit /r/all) that is being displayed/read. For the first page it is 1. (0*100)+1
			var iterEnd = (x+1)*100 // The last posts range that is being read. For the first page this will be 100. (0+1)*100
			var handler = new htmlparser.DefaultHandler(function(error, dom){
				if (error) {
					console.log('\x1b[31mError: \x1b[33m'+error.toString()+'\x1b[0m'); 
					setTimeout(function(){ // There was an error, so it is best to wait a little bit of time before continueing. 
						exports.doMain(x+1,megaList,startLink,callback); // Continue by moving onto the next page.
					},500);
				}
				else { // There was not an error so it moves on.
					var stuffList = {};	// Define stuffList as nothing so it doesn't have repeats in megaList.
					select(dom, "a .comments").forEach(function(element){ // User the DOM object provided by htmlparser select (in soupselect) will use the CSS like selector to select all <a> elements that reference to the comments page.
						stuffList[element.attribs.href+'?sort=new'] = element.children[0].raw; // For each all of the elements, add the link to the comments page (that sorts newest comments) to stuffList.
						});
					megaList = Object.assign(megaList, stuffList); // Add all of the links in stuffList to the megaList.
					var followUpIter = x+1; // Define a followup iter, so we're not doing 'my String'+(myInt+myOtherInt).valueOf(); for neatness.
					console.log('\x1b[36mFetched page '+followUpIter+' of 2\x1b[0m'); // 
					select(dom, "span .next-button").forEach(function(element){
						afterCmt = element.children[0].attribs.href;
						
					});
					exports.doMain(x+1,megaList,startLink,callback); // Call the function again, to keep the loop going. 
					

				}

			});
			var parser = new htmlparser.Parser(handler); // Create the parser, which will use the handler code as part of the parsing.
			parser.parseComplete(data); // Here it actually parses the data.
		});
	}
}


