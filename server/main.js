import { Meteor } from 'meteor/meteor';

Meteor.methods({
	'test': function(){
		// simulate long search
		Meteor._sleepForMs(1000);
		return 5;
	},
});

Meteor.startup(() => {
	// code to run on server at startup
});
