# Kluster

## Installation

```bash
$ npm install kluster
```

### Example

server.js

```javascript
var kluster = require( './kluster' );

kluster.start( function() {
  console.log( 'test' );
  var app = require( './app' );
  app.listen( 80 );
});
```