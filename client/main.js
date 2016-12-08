import { Template } from 'meteor/templating';
import { Session } from 'meteor/session'

import './main.html';

Session.setDefault("mainResults", null);
Session.setDefault("resultsType", null);
Session.setDefault("numberResults", "");
Session.setDefault("recordResult", null);
Session.setDefault("artistResult", null);
Session.setDefault("trackResult", null);

var handleSearch = function(event, isClick){
	if(isClick || event.which === 13){
		var type = $('#search-type').val();
		var text = $('#search-input').val();

		if(text){
			var keyword = 'keyword' + '=' + text;
			var type = 'type' + '=' + type;

			Router.go('results', null, {query: keyword + '&' + type, hash: '#'});
		}
	}
}

var getClassType = function(type){
	if(type == "genre")
		return "record";
	if(type == "tag")
		return "record";
	if(type == "lyric")
		return "track";

	return type;
}

//
// template Home
Template.Home.onCreated(function HomeOnCreated() {});
Template.Home.helpers({});
Template.Home.events({
	'keypress #search-input'(event, instance){
		handleSearch(event, false);
	},
	'click #search-btn'(event, instance){
		handleSearch(event, true);
	}
});

//
// template Results
Template.Results.onCreated(function ResultsOnCreated() {});
Template.Results.helpers({
	getSearchType: function(type){ return type == Session.get("resultsType"); },
	getNumberOfResults: function(){ return Session.get("numberResults"); },
	getResults: function(){ return Session.get("mainResults"); }
});
Template.Results.events({
	'keypress #search-input'(event, instance){
		handleSearch(event, false);
	},
	'click #search-btn'(event, instance){
		handleSearch(event, true);
	}
});

//
// template Artist
Template.Artist.onCreated(function ArtistOnCreated() {});
Template.Artist.helpers({
	getName: function(){ return Session.get("artistResult").name; },
	getBiography: function(){ return Session.get("artistResult").biography; },
	getHomepage: function(){ return Session.get("artistResult").homepage; },
	getRecords: function(){ return Session.get("artistResult").records; },
	getImage: function(){ return Session.get("artistResult").img; },
});
Template.Artist.events({
	'keypress #search-input'(event, instance){
		handleSearch(event, false);
	},
	'click #search-btn'(event, instance){
		handleSearch(event, true);
	}
});

//
// template Record
Template.Record.onCreated(function RecordOnCreated() {});
Template.Record.helpers({
	getName: function(){ return Session.get("recordResult").name; },
	getDescription: function(){ return Session.get("recordResult").description; },
	getNumberofTracks: function(){ return Session.get("recordResult").ntracks; },
	getTags: function(){ return Session.get("recordResult").tags; },
	getTracks: function(){ return Session.get("recordResult").tracks; },
	getArtist: function(){ return Session.get("recordResult").artist; },
	getArtistID: function(){ return Session.get("recordResult").artist_id; },
	getImage: function(){ return Session.get("recordResult").img; },
});
Template.Record.events({
	'keypress #search-input'(event, instance){
		handleSearch(event, false);
	},
	'click #search-btn'(event, instance){
		handleSearch(event, true);
	}
});

//
// template Track
Template.Track.onCreated(function TrackOnCreated() {});
Template.Track.helpers({
	getTitle: function(){ return Session.get("trackResult").title; },
	getLyrics: function(){ return Session.get("trackResult").lyrics; },
	getLicense: function(){ return Session.get("trackResult").license; },
	getArtist: function(){ return Session.get("trackResult").artist; },
	getArtistID: function(){ return Session.get("trackResult").artist_id; },
});
Template.Track.events({
	'keypress #search-input'(event, instance){
		handleSearch(event, false);
	},
	'click #search-btn'(event, instance){
		handleSearch(event, true);
	}
});

//
// Routers
Router.route('/', function () {
	this.render('Home');
}, {
	name: 'home'
});

Router.route('/results', function () {
	this.render('Results');

	// this two lines adds a visual clue that a search is in progress
	Session.set("resultsType", "");
	Session.set("numberResults", "Searching..");

	var query = this.params.query;
	var hash = this.params.hash;
	var type = query.type;
	var class_type = getClassType(type);

	Meteor.call('test', function(error, result){
		if(error){
			console.log(error);
		} else {
			console.log(result);
		}

		// TODO: set results and number of results here based on the requested search
		var artistExample = [
			{ score: '100', name: 'A', homepage: 'fb', area: 'China', tags: ['pop', 'rock'] },
			{ score: '98', name: 'B', homepage: 'yt', area: 'Djibouti', tags: ['dnb'] },
		];

		Session.set("mainResults", artistExample);
		Session.set("resultsType", class_type);
		Session.set("numberResults", "Got " + artistExample.length + " results");
	});
}, {
	name: 'results'
});

Router.route('/artist/:_id', function () {
	this.render('Artist');
	var id = this.params._id;

	// TODO: meteor call to get artist info
	var artistExample = {
		name: "Caucenus",
		biography: "asdasd asdasdas dasdsdas dasdas das dasda sd",
		homepage: "https://caucenus.bandcamp.com/",
		img: "http://placehold.it/150x150",
		records: [
			{ title: 'Nomad', record_id: '1', type: 'Album', ntracks: 9, tags: ['dnb'] },
			{ title: 'Manimals', record_id: '2', type: 'Single', ntracks: 1, tags: ['pop', 'rock'] },
		]
	};

	Session.set("artistResult", artistExample);

}, {
	name: 'artist'
});

Router.route('/record/:_id', function () {
	this.render('Record');
	var id = this.params._id;

	// TODO: meteor call to get record info
	var recordExample = {
		name: "Nomad",
		description: "asdasd asdasdas dasdsdas dasdas das dasda sd",
		ntracks: 9,
		tags: ["pop", "rock", "dnb", "punk"],
		artist: "Caucenus",
		artist_id: 1,
		img: "http://placehold.it/150x150",
		tracks: [
			{ title: 'Guiriot', track_id: '1' },
			{ title: 'Manimals', track_id: '2' },
		]
	};

	Session.set("recordResult", recordExample);
}, {
	name: 'record'
});

Router.route('/track/:_id', function () {
	this.render('Track');
	var id = this.params._id;

	// TODO: meteor call to get track info
	var trackExample = {
		title: "Guiriot",
		lyrics: "Exaaaacto é cancro.. I got iiiiiiiiiiiiiiiiiiiiit in my mind",
		license: "http://creativecommons.org/licenses/by-nc-nd/3.0/",
		artist: "Caucenus",
		artist_id: 1,
	};

	Session.set("trackResult", trackExample);
}, {
	name: 'track'
});

Router.route('/(.*)', function() {
	this.render('Page404');
});
