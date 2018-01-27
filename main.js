// Andrew Humphreys, Licensed MIT. ALl packages bundled should be MIT Licensed.
// 2018.
var spider = require('../spider.js');
var scrape = require('../scrape.js');
var defaultFile = './data/userlist.json';
var alternateFile = './data/userlist (#NUM#).json'; // Put "#NUM#" (without quotes) where you intend to have the number stored.
var spidering = false; // Keep track of whether or not the spider is running.``


(function foobar(){

  document.getElementById('start_spider').addEventListener('click', spiderUsers);
  function spiderUsers(){
    if(spidering===false){
      spidering = true;
      document.getElementById('is_spidering').value = "true";
      var userlimit = Number(document.getElementById('userlimit').value);
      var pages = Number(document.getElementById('pagelimit').value);
      var bttn = document.getElementById('start_spider');
      bttn.style.backgroundColor = '#c54949';
      bttn.innerHTML = 'stop';
      spider.spiderUsers(defaultFile, alternateFile, pages, userlimit, document);

      (function foobar(){
        setInterval(doStuff,15) // 66.66hz.
        function doStuff(){
          // if(spider.document != document){
          //   document = spider.document;
          // }
          if(document.getElementById('is_spidering').value == 'false' && spidering == true){
            spidering == false;
            alert('stopped!');
            bttn.style.backgroundColor = '#49c583';
            bttn.innerHTML = 'Start Spidering';
            spidering = false;
          }
        }
      })();

    }
    else {
      alert('Sorry, please close the entire window to stop. This will be fixed in future updates.');
    }
  }
})();

(function foobar(){

  document.getElementById('start_scanner').addEventListener('click', spiderUsers);
  function spiderUsers(){
    if(spidering===false){
      spidering = true;
      var bttn = document.getElementById('start_spider');
      bttn.style.backgroundColor = '#c54949';
      bttn.innerHTML = 'stop';
      scrape.scrapeData();
    }
    else {
      alert('Sorry, please close the entire window to stop. This will be fixed in future updates.');
    }
  }
})();



// Use functions:
function prompt(question, callback) {
    var stdin = process.stdin,
        stdout = process.stdout;

    stdin.resume();
    stdout.write(question);

    stdin.once('data', function (data) {
        callback(data.toString().trim());
    });
}
setInterval(function scrollBottomOfProgress(){
  var objDiv = document.getElementById("progress-box"); // Credits Stack Exchange
  objDiv.scrollTop = objDiv.scrollHeight; // Scrolls the height of the scroll *ability* from the top.
},30) // At 33.33 FPS. I'd go sixty but there is really no reason here.
