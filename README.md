

## TV TRACK - A TV show tracker using AngularJS, NodeJS and Mongodb.

---
### AngularJS + Node + Gulp + Mongoose + Passport Authentication + TVDB API

REST API with Express, authentication and signup process with Passport, create and retrieve data from MongoDB using Mongoose. The front-end will be built using AngularJS and Bootstrap Sass. The last step involves using gulp.js to optimize your static assets.

---

#### Apps Routes:
* Home - display a list of popular shows.
* Detail - information about one particular TV show.
* Login - user login form.
* Signup - user signup form.
* Add - add a new show form.

---
#### To Do:
- [ ] User profile page with a list of subscribed shows
- [ ] Dynamically update page &lt;title&gt; on each route
- [ ] Create a personalized calendar view with subscribed shows
- [ ] Create a calendar view that displays every show (time, date, network, episode overview)
- [ ] Display a show’s episodes in Bootstrap Tabs, grouped by seasons
- [ ] Text message notifications
- [ ] Customizable alert time (2 hours in advance, 1 day in advance, etc.)
- [ ] Add an admin role; only admins can add new TV shows
- [ ] Display Twitter feed for each TV show
- [ ] Create an AngularJS service for fetching and displaying latest news and gossip about a TV show
- [ ] Resize thumbnails via sharp and optimize via gulp-imagemin then upload to Amazon S3
- [ ] Add Redis database as a caching layer
- [ ] Explore token-based authentication
- [ ] Live validation of email availability during user signup

---
#### Optimization - To Do List
**DONE:**
- [x] Concatenate and minify the scripts
- [x] Minify the stylesheet
- [x] Cache AngularJS templates
- [x] Removing unused CSS
- [x] Enable gzip compression
- [x] Enable static assets caching

**To be working on:**
- [ ] not necessary for us to retrieve information about every single episode of every show because we don’t see it until we view the detail page of that show.

- [ ] Currently storing images as Base64 strings that are are fairly large in size and resolution (680 x 1000), not cached, not optimized.

- [ ] Put Redis database in front of the MongoDB for caching?  Couchbase database which seems to combine the best of both worlds. Couchbase seems to replace Redis, MongoDB and Riak all togther.

**API : [TheTVDB.com API](http://thetvdb.com/)**

---

