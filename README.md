# reddituserinfoscraper
This is a tool (in the works) that scrapes
  * users
  * timestamps
  * post/comment title and/or body [TO-DO]
  * post/comment type (which is it?) [To-DO]
  * post/comment Karma
  * Current timestamp for time comparisons (likely to do with karma).

It is intended to include a few other data-manipulation tools later on.

# Usage
first off, you have to have NodeJS installed. Head over to https://nodejs.org/en/ to install if you have not already.
It should carry all of it's dependancies with it. This tool is currently being developed on v8.9.1 however will likely work on any v8 subset and most likely any v8.9.x version.
### Clone
`$ git clone https://github.com/SlicesOfPi/reddituserinfoscraper.git` or you can merely download the ZIP.
If it is zipped, extract it first, open a terminal, gitbash or CMD.
### Starting
`$ node main.js`
### Input
At that point, it will ask you if you would like to scrape for/the users. First off you have to scrape for users. Type "1" (without quotes) then press enter. It will begin to scrape for users. At this time, it has not currently featured an automatic stop to the program and will in fact keep running (even if it is not scraping) until closed. It *will* attempt to scrape everything in it's queue reguardless if it has hit the maximum account limit of 1500 and will no longer log. It is planned to fix this as soon as I move onto this section for re-vamping.
### Input #2
After you have gotten a userlist.json file, which does not have to be full length mind you, you can move onto method 2: scraping the users. This will go through each user, and scrape for the timestamps and yet to the post/comment title and/or body, and what type it is. It will record the before mentioned `userlist.json` file. For stopping it midway see notes#1. Once, if you have amazing internet, have scraped the entire list (hours, days, weeks it could take. A VPS is a good idea.), it.. will have finished. You can move onto analytics. See the JSON structure below.

### JSON Structure
The current structure is similar to the following:

```

'username': {
              '2015-08-03T16:48:04+00:00': {
                                            'type': 'comment',
                                            'body': "Wow That is sooo cool. \"I like pie\" was my favorite part.",
                                            'karma': '162',
                                            'currentTimestamp': '2017-12-31T22:54:45.064',
                                            'id': 't1_dr8kbyo'
               },
              '2015-08-03T16:38:37+00:00': {
                                            'edited': '...someISO8601reddittimestamp',
                                            'type': 'post',
                                            'title': '10 new types of chicken nuggest at McDonalds',
                                            'link': 'https://mcdonalds.com/news/article/51256/new-chicken-nuggets-being-released.',
                                            'karma': '-624',
                                            'currentTimestamp': '2017-12-31T22:55:36.574',
                                            'id': 't1_dr8kbyo'
              }

            }

```

### #1
Currently, (is yet to be fixed) stopping it randomly may or may not be fine. If it does not end up deleting the entire list. It is pretty much a chance based on your timing/if you stop it during the write process so be mindful of the timing and you should be okay. [Sorry for the bugs]. Next, if you timed it properlly it will have saved it's scraping location in the file and will be able to pickup later.

# Changelogs
I am yet to create a "release", but these are more or less a more in depth guide to what I am pushing when pushing updates than the commit message.

## 1.2.2 Changelog
+ Added a better error handling system.


#### Todo:
 * Clean up code and add more commenting. (Commenting close to done.)
 * Add tools to manipulate data
 * Setup error handling system to count failures and stop trying after X many.
 * Setup error handling system to have a delay before retrying so it doesn't spam reddit, or your LAN if that.
 * Fix issue where intentional process.exit(); calls will restarting the application. Givin the intentional shutdown. A full functionality restart does NOT happen but it does leave you at the option page.
 * Fix where I had .valueOf(); when I should've used something like Number();
## 1.2.1 Changelog
+ Fixed 'iteratee'
+ Fixed timestamps.
+ Standardized my timstamps to ISO8601 standard that reddit uses.
+ Added comment ID to scrape data

#### Todo:
  * Add better error handling, so it will restart after a failure automatically (at least a few times and waiting a bit). (Clusters)
  * Clean up code and add more commenting.
  * Add tools to manipulate data


## 1.2.0 Changelog
+ Automatically delete userlistordered.txt on overwriting /r/all scrape.
+ Scrapes now for timestamps,
  * Post title/URL
  * Comment body
  * Karma
  * Current timestamp [Needs some fixing, but it "works"].
+ Fixed issue where caused when closing during write to userlist.json.

#### Todo:
 * Still forgot to fix 'iteratee'. It is just a typo that doesn't fix it's variable position.
 * Fix the currentTimestamp for time diffs.
 * Set currentTimestamp's timestamp format to that of what reddit uses.
 * Add comment ID to post data.
 * Add tools to manipulate data.
 * Clean up code a little more & add more commenting.

## 1.1.0 Changelog
+ Added setting so it fetches newest comments, not most upvoted. This is because the people who comment the most upvoted comments may have abnormal behavours.
- Removed all the eventEmitter dependancies.
+ Replaced all those eventEmitter setups with linear-function loops. Same concept, much cleaner and less error prone.
+ Seperated the respective fragments/pieces of my code in various files.
+ Added more commenting to what is happening for personal/other use. (Still unfinished).
+ Reworked a fair bit of code
+ Fixed the userlist.json wiping issue.
+ Changed the JSON up a little to support future updates

#### Todo:
 * Automatically delete userlistordered.txt on scrape [small release].
 * Feature more data collection
 * Add tools to manipulate the data.
 * Fix iteratee to iteree
