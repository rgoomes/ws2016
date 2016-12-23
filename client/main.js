import { Template } from 'meteor/templating';
import { Session } from 'meteor/session'

import './main.html';

Session.setDefault("mainResults", null);
Session.setDefault("resultsType", null);
Session.setDefault("numberResults", "");
Session.setDefault("recordResult", null);
Session.setDefault("artistResult", null);
Session.setDefault("trackResult", null);
Session.setDefault("resultsLabel", "");
Session.setDefault("globalLoading", false);

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

	return type;
}

var firstLetterCapital = function(str) {
	return str.charAt(0).toUpperCase() + str.slice(1);
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
	isSearchType: function(type){ return type == Session.get("resultsType"); },
	getResultsLabel: function(){ return Session.get("resultsLabel"); },
	getNumberOfResults: function(){ return Session.get("numberResults"); },
	getResults: function(){ return Session.get("mainResults"); },
	loading: function(){ return Session.get("globalLoading") == true; },
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
	getArtist: function(){ return Session.get("artistResult"); },
	loading: function(){ return Session.get("globalLoading") == true; },
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
	getRecord: function(){ return Session.get("recordResult"); },
	loading: function(){ return Session.get("globalLoading") == true; },
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
	getTrack: function(){ return Session.get("trackResult"); },
	loading: function(){ return Session.get("globalLoading") == true; },
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
// TODO: remove meteor calls from routers
Router.route('/', function () {
	this.render('Home');
}, {
	name: 'home'
});

var searchKeyword = function(route_params){
	Session.set("resultsLabel", "Searching..");

	var query = route_params.query;
	var hash = route_params.hash;
	var class_type = getClassType(query.type);

	var t0 = performance.now();
	Meteor.call('search', query.keyword.toLowerCase(), query.type, class_type, function(error, result){
		if(error){
			console.log(error);
			return;
		}
		if(result == null){
			Session.set("resultsLabel", "Sorry! Some sort of error happened.");
			return;
		}

		var t1 = performance.now();
		var elapsed = (t1 - t0) / 1000;

		Session.set("globalLoading", false);
		Session.set("mainResults", result);
		Session.set("resultsType", class_type);
		Session.set("resultsLabel", firstLetterCapital(class_type) + " " + "Results");
		Session.set("numberResults", "Got " + result.length + " results in " + elapsed.toFixed(2) + " seconds");
	});
}

var lookupEntity = function(entity_session_var, id, class_type){
	Meteor.call('lookup', id, class_type, function(error, result){
		if(error){
			console.log(error);
			return;
		}
		if(result == null)
			return;

		Session.set(entity_session_var, result);
		Session.set("globalLoading", false);
	});
}

Router.route('/results', function () {
	Session.set("globalLoading", true);
	this.render('Results');
	searchKeyword(this.params);
}, {
	name: 'results'
});

Router.route('/artist/:_id', function () {
	Session.set("artistResult", null);
	Session.set("globalLoading", true);
	this.render('Artist');
	lookupEntity("artistResult", this.params._id, 'artist');
}, {
	name: 'artist'
});

Router.route('/record/:_id', function () {
	Session.set("recordResult", null);
	Session.set("globalLoading", true);
	this.render('Record');
	lookupEntity("recordResult", this.params._id, 'record');
}, {
	name: 'record'
});

Router.route('/track/:_id', function () {
	Session.set("trackResult", null);
	Session.set("globalLoading", true);
	this.render('Track');
	lookupEntity("trackResult", this.params._id, 'track');
}, {
	name: 'track'
});

Router.route('/(.*)', function() {
	this.render('Page404');
}, {
	name: 'nopage'
});
