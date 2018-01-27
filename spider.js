// Andrew Humphreys 2018
// MIT Licensed
var fs = require('fs');
var https = require('https');
var events = require('events');
var eventEmitter = new events.EventEmitter();

exports.spiderUsers = function(defaultFile, alternateFile, pages, userlimit, document){
  var progressBox = document.getElementById('progress-box');
  var linkChain = [];
  var fileIter = 0;
  var fileName = '';
  var iterateFiles = function(x){

    function stopIter(y){ // Stop iter may be a misleading name, simply put due to the looping mechanism it will self-stop.
      // Really what we're doing is merely setting fileName.
      if(y==0){
        fileName = defaultFile
      }
      else {
        fileName = alternateFile.replace('#NUM#', y); // I'd use regex just for fun but little much for this.
      }
    }

    if(x===0){ // If x is zero, we need special handling. userlist (0).json anyone?  (0==[]=='' >:(. Why it gotta be like this JS?)

      if(fs.existsSync(defaultFile)){
        iterateFiles(1);
      }
      else{
        stopIter(x);
      }

    }

    else{

      if(fs.existsSync(alternateFile.replace('#NUM#', x))){
        iterateFiles(x+1)
      }
      else{
        stopIter(x);
      }

    }

  } // --iterateFiles


  iterateFiles(0);
  if(!fs.existsSync('./data/')){
    fs.mkdirSync('./data/');
  }
  alert(fileName);
  fs.writeFileSync(fileName,'');

  var iterateGet = function(x, lastCom){
    var baseUrl = 'https://www.reddit.com/.json?count=100&after=$$$';
    var lastComment = '';
    if(typeof lastCom != 'undefined'||lastCom !== null){
      lastComment = lastCom;
    }

    https.get(baseUrl.replace('$$$',lastComment), useHTTPS);
    function useHTTPS(res){
      var data = '';
      res.on('data', function(chunk){
        data += chunk;
      });
      res.on('end', doRestHTTPS);
      function doRestHTTPS(){
        var dataParsed = JSON.parse(data);
        // t1_	Comment, t2_	Account, t3_	Link,t4_	Message,t5_	Subreddit,t6_	Award
        var posts = dataParsed["data"]["children"];
        for(var post in posts){
          linkChain.push(posts[post]);
        }

        progressBox.innerHTML += '<p>Fetched page '+(x+1)+' out of '+pages+'</p>';
        if(x<pages-1){
          iterateGet(x+1, dataParsed["data"]["before"]);
        }
        else {
          progressBox.innerHTML += '<p>Finished fetching pages</p>';
          scrapePages(linkChain);
        }

      }

    }
  }

  iterateGet(0);
  var scrapePages = function(linkChain) {
    var finalUserList = [];
    var totalAuthors = 0;
    var doneGetPage = false;
    function getPage(post, callback){
      //document.getElementById('users').innerHTML += post['data']['permalink']+'<br>';
      progressBox.innerHTML += "<p>Processing links for users</p>"
      var fullUrl = 'https://www.reddit.com'+post['data']['permalink']+'.json?limit=500';
      progressBox.innerHTML += "<p>Fetching "+post['data']['permalink']+'.json?limit=500'+"</p>";
      https.get(fullUrl, processData);
      function processData(red){
        var dta = '';
        red.on('data', function(chunk){
          dta += chunk;
        });
        red.on('end', resEnd);
        function resEnd(){
          progressBox.innerHTML += "<p>Fetched page. Processing data.</p>";
          //var parsedData = JSON.parse(data);
          var authors = dta.match(/\"author\".*?".*?"/g); // Why bother with recursion, when some basic Regex on a string would solve it?
          for(let author in uniqueify(authors)){

            // <li id="[username]" class="user">[username]</li>
            if(totalAuthors<userlimit){
              let username = uniqueify(authors)[author].replace('"author":', "").replace('"','').replace('"',''); // Ugly, lazy but.. it works.
              document.getElementById('users').innerHTML += '<li id="'+username+'" class="user">'+username+'</li>';
              document.getElementById('usercount').innerHTML = "&nbsp;"+(totalAuthors+1)+"&nbsp;";
              finalUserList.push(username);
            }
            else{
              doneGetPage = true;
            }
            totalAuthors++;


          }
          var objDiv = document.getElementById("users"); // Credits Stack Exchange
          objDiv.scrollTop = objDiv.scrollHeight; // Scrolls the height of the scroll *ability* from the top.
          callback(doneGetPage);
        }

      }

    }
    function syncDoLinks(x){
      if(x<linkChain.length){
        getPage(linkChain[x],function syncLinksCont(getPage){
          if(!getPage){
            syncDoLinks(x+1);
          }
          else {
            var object = {
              userlist: finalUserList
            }
            fs.writeFileSync(fileName, JSON.stringify(object));
            document.getElementById('is_spidering').value = "false";
          }
        });

      }
    }
    syncDoLinks(0);
    // for (let post in linkChain){
    //   getPage(linkChain[post]);
    // }
  }



}
function uniqueify(arry){
	var dupeFreeArray = [];
	for(let value in arry){
  	val = arry[value];
  	if(arry.indexOf(val)==value){
    	dupeFreeArray.push(val);
    }
  }
  return dupeFreeArray;
}
