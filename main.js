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

var cluster = require('cluster');


if (cluster.isMaster){ // If it is the master cluster
	cluster.fork(); // It will create a sub cluster
	cluster.on('exit', function(wkr,code,signal){ // If one of the clusters die:
		if(signal!="SIGINT"){ // SIGINT is the CtrL+C exit code. This sets it so it won't try and fork on user-exit.
			console.log('\x1b[31mCluster died! Starting a new one.\x1b[0m'); // tells the user what's happening.
			cluster.fork(); // Creates a new cluster.
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



function doMainCont(){ // A function that does the first, main stuff/content.
	scrapeAll.doMain(0,megaList,afterCmt,function(megaList,afterCmt){ // 0 is where it should start, it is a function from scrapeAll.js that collects a list of URLs to scrape for users. It adds links to the existing megaList and passes it onto the callback.
		scrapePostPages.scrapeFunc({},megaList); // Once it has done that it will scrape the pages in megalist of users. First argument is the 'existing' userlist so that you can possibly contiue existing userlists.
	});
}

setTimeout(function(){ // There are usually a few warnings with depriciateds found in libraries yet to be updated. This is to make sure these messages are AFTER.
	var didFail = false; // A variable that controls the "failure" status. This means, if it is stopped unexpectedly (most likely from an error) it will restart. Ctrl+C is considered expected.
	if(fs.existsSync('userlist.json')){ // If the file that we're indexing already exists:
		myObj = JSON.parse(fs.readFileSync('userlist.json')); // It parses the existing userlist.
		if(typeof myObj['i'] != 'undefined' && myObj['i']['stopUngracfully'] == 'true'){ // If the "stopUngracfully" var in it is true
			didFail = true; // then it sets this variable to true telling it that it wasn't meant to be stopped.
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
							if(fs.existsSync('userlistordered.txt')){ // if it is overwriting, and the userlistordered file exists it will:
								fs.unlinkSync('userlistordered.txt'); // Delete said file, as it relies on it for the userlist order to stay static. If that does not change and the userlist does some REALLY jenky shit's goin down.
							}
							doMainCont(); // If the user chooses to overwrite despite the file already existing,it'll run the function that WILL overwrite it.

						}
						else{ // If the user entered the wrong phrase it will fail and tell the user to try again then exit (as it will not automatically.).
							console.log("\x1b[31mThat didn't work! Try again.\x1b[0m");
							process.exit();
						}
					});

				}
				else{
					doMainCont(); // Does the main things so long as the file does not exist.
				}

			}
			else if(information=='2'){ // If the user wants to do option 2
				console.log('Spidering the users.'); // It will tell them it is
				spiderusers.spiderMain(); // And do.. just that.

			}
			else{ // And if they didn't choose 1 or 2, it will fail, tell them and exit.
				console.log("\x1b[31mThat didn't work! Try again.\x1b[0m");
				process.exit();
			}
		});


	}
	else{ // If the JSON data tells us that it wasn't shut down expectedly, it will continue without asking. This is to deal with clusters.
		console.log('\x1b[31mUngracfully shut down last time. Resuming automatically in 10 seconds. If this for some reason is wrong, gracefully shutdown with ctrl+c and restart.\x1b[0m');
		setTimeout(contJob,10000); // Waits 10 seconds (10,000 milliseconds) then runs contJob which will continue by starting up spiderMain.
		function contJob(){
			spiderusers.spiderMain();
		}
	}

},75);



// Todo: Remove event-emitters from here.


function promptInput(question, callback) { // Function to gather user input without including another library.
	var stdin = process.stdin,
		stdout = process.stdout;

	stdin.resume();
	stdout.write(question);

	stdin.once('data', function (data) {
		callback(data.toString().trim());
	});
}

}
