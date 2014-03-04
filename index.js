var cluster     = require( 'cluster' );
var domain      = require( 'domain' );
var fs          = require( 'fs' );
var path        = require( 'path' );
var numCPUs     = require( 'os' ).cpus().length;

var kluster = module.exports = {

  workers : {},

  options : {
    workers    : numCPUs,
      extensions : [ '.js' ],
      ignoreDirectories : [],
      watchDirectory : [],
      interval : 100,
  },

  set: function( key, value ) {

    this.options[ key ] = value;
  },

  fork: function() {

    var worker = cluster.fork();
      var self = this;
      this.workers[ worker.process.pid ] = worker;

      worker.on( 'message', function( msg ) {
        if( msg ) {
          console.log( 'broadcasting to all workers', msg );
          self.broadcastMsg( msg );    
        }  
      });

    console.log( 'Work Fork: ' + worker.process.pid );
  },

  exit: function( worker ) {
  
    console.log( 'Work Exit: ' + worker.process.pid );

    delete( this.workers[ worker.process.pid ] );
    this.fork();
  },

  // Code from: https://github.com/learnboost/cluster
  reload: function() {

    this.options.ignoreDirectories.forEach( 
      function( file, index, dirs ) { 
        dirs[ index ] = path.resolve( file );
      }
    );

    this.options.watchDirectory.forEach( traverse );

    var self = this;

    function traverse( file ) {

      file = path.resolve( file );

      fs.stat( file, function( err, stat ) {
      
        if( ! err ) {

          if( stat.isDirectory() ) {

            if( ~self.options.ignoreDirectories.indexOf( file ) ) return;

            fs.readdir( file, function( err, files ) {

              files.map( function( f ) {
                return file + '/' + f;
              }).forEach( traverse );
            });
          }
          else {
            watch( file );
          }
        }
      });
    }

    function watch( file ) {

      if( !~self.options.extensions.indexOf( path.extname( file ) ) )
        return;

      fs.watchFile( file, { interval: self.options.interval }, function( curr, prev ) {
  
        if( curr.mtime > prev.mtime ) {
          console.log( '\033[36mchanged\033[0m \033[90m- %s\033[0m', file );
          self.restartWorkers();
        }
      });
    }
  },

  restartWorkers: function() {

    for( var index in this.workers ) {

      console.log( 'Restart Worker:' + index );
      this.workers[ index ].disconnect();
    }
  },

  broadcastMsg: function( msg ) {
    
    for( var i in this.workers ) {
        var worker = this.workers[ i ];
        worker.send( msg );
    }
  },

  start: function( server ) {

    if( cluster.isMaster ) {

      if( this.options.workers < 2 ) {
        this.options.workers = 2;
      }

      for( var i = 0; i < this.options.workers; i++ ) {
        this.fork();
      }

      cluster.on( 'exit', this.exit.bind( this ) );

      //this.reload();
    }
    else {
      var serverDomain = domain.create();

      serverDomain.on( 'error', function( err ) { 
        console.log( 'uncaughtException: ', err ); 
      });

      serverDomain.run( server );
    }
  }
};
