var cluster = require( 'cluster' );
var numCPUs = require( 'os' ).cpus().length;

var kluster = module.exports = {

	workers : {},

	options : {
		workers : numCPUs
	},

	set: function( key, value ) {

		this.options[ key ] = value;
	},

	fork: function() {

		var worker = cluster.fork();
    	this.workers[ worker.process.pid ] = worker;

		console.log( 'Work Fork: ' + worker.process.pid );
	},

	kill: function() {

		var self = this;

		Object.keys( this.workers ).forEach( function( pid ) {
      		self.workers[ pid ].destroy(); 
    	});
	},

	exit: function( worker ) {
	
		console.log( 'Work Exit: ' + worker.process.pid );

		delete( this.workers[ worker.process.pid ] );
    	this.fork();
	},

	start: function( server ) {

		//process.on( 'exit', this.kill.bind( this ) );
  		process.on( 'uncaughtException', this.kill.bind( this ) );

		if( cluster.isMaster ) {

  			if( this.options.workers < 2 ) {
  				this.options.workers = 2;
  			}

			for( var i = 0; i < this.options.workers; i++ ) {
				this.fork();
  			}

  			var self = this;

			cluster.on( 'exit', this.exit.bind( this ) );
		}
		else {
			server();
		}
	}
};