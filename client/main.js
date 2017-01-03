import { Template } from 'meteor/templating';
import { Session } from 'meteor/session'

import './main.html';

var no_results = 0;
var hasFoundResults = false;


var combo = "semantic_search";
var setComboValue = function(){
	if(combo == null || combo == "")
		combo = "semantic_search";

	$("#search-type").val(combo);
}

var callID = 0;
var getNewID = function(){
	var newID = callID;
	callID += 1;
	return newID;
}

Session.setDefault("mainTrackResults", null);
Session.setDefault("mainRecordResults", null);
Session.setDefault("mainArtistResults", null);

var clearMainResults = function(){
	Session.set("mainTrackResults", null);
	Session.set("mainRecordResults", null);
	Session.set("mainArtistResults", null);
}

Session.setDefault("resultsType", null);
Session.setDefault("numberResults", "");
Session.setDefault("recordResult", null);
Session.setDefault("artistResult", null);
Session.setDefault("trackResult", null);
Session.setDefault("resultsLabel", "");
Session.setDefault("recommendationResults", []);

Session.setDefault("message", "");
Template.registerHelper("onMessage", function (){
	return Session.get("message") != null;
});
Template.registerHelper("getMessage", function (){
	return Session.get("message");
});

// NOTE: inner html rendering is not safe
var enable_inner_html_rendering = false;
Template.registerHelper("inner_html_renderization_enabled", function (){
	return enable_inner_html_rendering;
});

var handleSearch = function(event, isClick){
	if(isClick || event.which === 13){
		var type = $('#search-type').val();
		var text = $('#search-input').val();
		combo = type;

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
Template.Results.onRendered(function ResultsOnRendered() {
	setComboValue();
});
Template.Results.helpers({
	getTrackResults: function(){ return Session.get("mainTrackResults"); },
	getRecordResults: function(){ return Session.get("mainRecordResults"); },
	getArtistResults: function(){ return Session.get("mainArtistResults"); },
	getNumberOfResults: function(){ return Session.get("numberResults"); },

});
Template.Results.events({
	'keypress #search-input'(event, instance){
		handleSearch(event, false);
	},
	'click #search-btn'(event, instance){
		handleSearch(event, true);
	},

	'click #btn-hide-artists'(event, instance){
		if($('#table-artists').is(':visible'))
			$('#table-artists').hide();
		else
			$('#table-artists').show();
	},
	'click #btn-hide-tracks'(event, instance){
		if($('#table-tracks').is(':visible'))
			$('#table-tracks').hide();
		else
			$('#table-tracks').show();
	},
	'click #btn-hide-records'(event, instance){
		if($('#table-records').is(':visible'))
			$('#table-records').hide();
		else
			$('#table-records').show()
	}
});

//
// template Artist
Template.Artist.onCreated(function ArtistOnCreated() {});
Template.Artist.onRendered(function ArtistOnRendered() {
	setComboValue();
});
Template.Artist.helpers({
	getArtist: function(){ return Session.get("artistResult"); },
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
Template.Record.onRendered(function RecordOnRendered() {
	setComboValue();
});
Template.Record.helpers({
	getRecord: function(){ return Session.get("recordResult"); },
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
Template.Track.onRendered(function TrackOnRendered() {
	setComboValue();
});
Template.Track.helpers({
	getTrack: function(){ return Session.get("trackResult"); },
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
// template Recommendation
Template.Recommendation.onCreated(function RecommendationOnCreated() {});
Template.Recommendation.helpers({
	rec: function(){ return Session.get("recommendationResults"); }
});
Template.Recommendation.events({});

//
// Routers
// TODO: remove meteor calls from routers
Router.route('/', function () {
	this.render('Home');
}, {
	name: 'home'
});

var semanticSearch = function(route_params){
	var all = ["artist", "record", "track"];
	var newID = getNewID();

	for(var i = 0; i < all.length; i++){
		Meteor.call('semantic_search', route_params.query.keyword.toLowerCase(), all[i], function(error, result) {
			if(result != null){
				// genres like pop-rock are stored in dbpedia as "pop rock", with spaces
				// while in jamendo all genres have no spaces like "poprock". to fix this
				// issue, the whitespaces are removed in the genres keywords
				if(result === "genre")
					route_params.query.keyword = route_params.query.keyword.replace(/\s/g, '');

				searchKeyword(route_params, result, newID, false);
			}
			else {
				no_results += 1;

				// if the semantic_search failed for all entities
				// start a normal keyword search for all entities
				if(no_results == 3){
					searchKeyword(route_params, "artist", newID, false);
					searchKeyword(route_params, "record", newID, false);
					searchKeyword(route_params, "track", newID, false);
				}
			}
		});
	}
}

var searchKeyword = function(route_params, hasType, newID, showElapsedTime){
	var query = route_params.query;
	var hash = route_params.hash;
	var type = hasType ? hasType : query.type;
	var class_type = getClassType(type);

	var t0 = performance.now();
	Meteor.call('search', query.keyword.toLowerCase(), type, class_type, function(error, result){
		if(error){
			console.log(error);
			Session.set("message", "Sorry! Some sort of error happened.");
			return;
		}
		if(result == null){
			Session.set("message", "Sorry! Some sort of error happened.");
			return;
		}
		if(callID != newID+1)
			return;

		if(result.length == 0){
			if(!hasFoundResults){
				Session.set("message", "Sorry! No results found.");
			}
		}
		else{
			hasFoundResults = true;
			Session.set("message", null);
		}

		var t1 = performance.now();
		var elapsed = (t1 - t0) / 1000;

		if(showElapsedTime)
			Session.set("numberResults", "Got " + result.length + " results in " + elapsed.toFixed(2) + " seconds");
		else
			Session.set("numberResults", "");

		if(class_type === "artist")
			Session.set("mainArtistResults", result);
		if(class_type === "record")
			Session.set("mainRecordResults", result);
		if(class_type === "track")
			Session.set("mainTrackResults", result);
	});
}

var lookupEntity = function(entity_session_var, id, class_type){
	var uri = "http://dbtune.org/jamendo/" + class_type + "/" + id;

	Meteor.call('lookup', uri, class_type, function(error, result){
		if(error){
			console.log(error);
			Session.set("message", "Sorry! Some sort of error happened.");
			return;
		}
		if(result == null){
			Session.set("message", "Sorry! Some sort of error happened.");
			return;
		}

		Session.set(entity_session_var, result);
		Session.set("message", null);
	});

	Meteor.call('recommendation', uri, class_type, function(error, result){
		if(error){
			console.log(error);
			return;
		}
		if(result == null)
			return;

		Session.set("recommendationResults", result);
	});
}

Router.route('/results', function () {
	hasFoundResults = false;
	Session.set("message", "Searching..");
	clearMainResults();
	this.render('Results');

	if(this.params.query.type === "semantic_search"){
		no_results = 0;
		semanticSearch(this.params);
	} else {
		var newID = getNewID();
		searchKeyword(this.params, null, newID, true);
	}
}, {
	name: 'results'
});

Router.route('/artist/:_id', function () {
	Session.set("message", "Loading..");
	Session.set("recommendationResults", []);

	this.render('Artist');
	lookupEntity("artistResult", this.params._id, 'artist');
}, {
	name: 'artist'
});

Router.route('/record/:_id', function () {
	Session.set("message", "Loading..");
	Session.set("recommendationResults", []);

	this.render('Record');
	lookupEntity("recordResult", this.params._id, 'record');
}, {
	name: 'record'
});

Router.route('/track/:_id', function () {
	Session.set("message", "Loading..");
	Session.set("recommendationResults", []);

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
