//
// Why, hello there. This code is licensed by the MIT license, but I as the creator would prefer you attribute me.
// Why I did not go for a Creative Commons License is simply because I do not want to hinder the use of this code, the aiding of it,
// the modification, and use in much larger projects in any way. Feel free to use this however you like (so long as it is legal, even if it isn't I have no control over it)
// I would just prefer attribtuon. That being said, this project uses many MIT libraries and I would like to carry on the trend of real-open-source. I feel that the GPL licenses
// Only hinder progess more than they should. If they can only use the software under X conditions, that ruins part of the point of free releasing. 
// Thank you, Andrew Humphreys.
//
//
// MIT license found at https://opensource.org/licenses/MIT & LICENSE.txt

// Thanking the creators of the following libraries:
// htmlparser - Chris Winberry - tautologistics (github).
// soupselect - Harry Fuecks - harryf (github)
// moment.js - http://Momentjs.com - moment (github)
// Async - Caolan McMahon - http://caolan.github.io/async/docs.htm - caolan (github) <-- Async is AMAZING godsend! I need to rework much of this later to use it more. Emitters are NOT the optimal solution.

var cluster = require('cluster');


if (cluster.isMaster){
	cluster.fork();
	cluster.on('exit', function(wkr,code,signal){
		if(signal!="SIGINT"){ // SIGINT is the CtrL+C exit code. This sets it so it won't try and fork on user-exit.
			console.log('\x1b[31mCluster died! Starting a new one.\x1b[0m');
			cluster.fork();
		}

	});
}

else { // Here I opted not to indent all the following as it will make the code that would normally be most high level, well.. indented. It is best for my personal organization and likely others to do it this way.


var fs = require('fs');
var http = require('https');
var htmlparser = require("htmlparser");
var select = require('soupselect').select;
var moment = require('moment');
var spiderusers = require('./spiderusers.js');
var scrapeAll = require('./scrapeAll.js');
var scrapePostPages = require('./scrapePostPage.js');
var usermap = {}; // Define usermap as an object.
var megaList = {}; // Define megaList as an object
var afterCmt = 'https://www.reddit.com/r/all/?limit=100'; // Set the initial page to screen in an easily configurable area. (Minimal to resource usage).
console.log('\x1b[32mStarting Spider..\x1b[0m');



function doMainCont(){
	scrapeAll.doMain(0,megaList,afterCmt,function(megaList,afterCmt){
		scrapePostPages.scrapeFunc({},megaList);
	});
}

setTimeout(function(){ // There are usually a few warnings with depriciateds found in libraries yet to be updated. This is to make sure these messages are AFTER.
	var didFail = false;
	if(fs.existsSync('userlist.json')){
		myObj = JSON.parse(fs.readFileSync('userlist.json'));
		if(typeof myObj['i'] != 'undefined' && myObj['i']['stopUngracfully'] == 'true'){
			didFail = true;
		}
	}
	if(!didFail){ // If it failed previously (on option 2. Option one is more forgiving and short.), then it will restart without this stuff.
		promptInput('Would you like to (1)Spider for users or (2)Spider the users?[Enter 1 or 2]:', function(information){ // information was data but I later used that in a higher scope which was messing with the code.
			if(information=="1"){ // If the user decides to spider FOR users:
				console.log('Spidering for users.'); // Tell them that everything's working and following their command.
				if(fs.existsSync('userlist.json')){ // Checks if the userlist already exists for overwrite protection.
					promptInput('userlist.json already exists. If you would like to preserve it, stop this application or rename it.\n\x1b[31mTo overwrite, type "Red white and blue"[enter] (without the quotes).\x1b[0m\n',function(info2){
						// ^ Tell the user that there already is a userlist file. Asks them for a phrase to overwrite it (Better safe than sorry).
						if(info2=="Red white and blue"){ // Checks the input.
							if(fs.existsSync('userlistordered.txt')){
								fs.unlinkSync('userlistordered.txt');
							}
							doMainCont();

						}
						else{
							console.log("\x1b[31mThat didn't work! Try again.\x1b[0m");
							process.exit();
						}
					});

				}
				else{
					doMainCont();
				}
				
			}
			else if(information=='2'){
				console.log('Spidering the users.');
				spiderusers.spiderMain();
				
			}
			else{
				console.log("\x1b[31mThat didn't work! Try again.\x1b[0m");
				process.exit();
			}
		});

	
	}
	else{
		console.log('\x1b[31mUngracfully shut down last time. Resuming automatically. If this for some reason is wrong, gracefully shutdown with ctrl+c and restart.\x1b[0m');
		spiderusers.spiderMain(); // Spiders the users after a drop-off.
	}

},75);
	

	
// Todo: Remove event-emitters from here.


function promptInput(question, callback) {
	var stdin = process.stdin,
		stdout = process.stdout;

	stdin.resume();
	stdout.write(question);

	stdin.once('data', function (data) {
		callback(data.toString().trim());
	});
}

}