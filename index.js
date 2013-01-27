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
	},

	kill: function() {

		var self = this;

		Object.keys( this.workers ).forEach( function( pid ) {
      		self.workers[ pid ].destroy(); 
    	});
	},

	exit: function() {
	
		var self = this;

		cluster.on( 'exit', function( worker ) {
			delete( self.workers[ worker.process.pid ] );
    		self.fork();
  		});
	},

	start: function( server ) {

		process.on( 'exit', this.kill.bind( this ) );
  		process.on( 'uncaughtException', this.kill.bind( this ) );

		if( cluster.isMaster ) {

  			if( this.options.workers < 2 ) {
  				this.options.workers = 2;
  			}

			for( var i = 0; i < this.options.workers; i++ ) {
				this.fork();
  			}
		}
		else {
			server();
		}
	}
};