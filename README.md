# [![IOPA](http://iopa.io/iopa.png)](http://iopa.io)<br> iopa-mqtt-packet

[![Build Status](https://api.shippable.com/projects/55f4870c1895ca447414dd90/badge?branchName=master)](https://app.shippable.com/projects/55f4870c1895ca447414dd90) 
[![IOPA](https://img.shields.io/badge/iopa-middleware-99cc33.svg?style=flat-square)](http://iopa.io)
[![limerun](https://img.shields.io/badge/limerun-certified-3399cc.svg?style=flat-square)](https://nodei.co/npm/limerun/)

[![NPM](https://nodei.co/npm/iopa-mqtt-packet.png?downloads=true)](https://nodei.co/npm/iopa-mqtt-packet/)

## About
`iopa-mqtt-packet` is a standards-based OASIS Message Queuing Telemetry Transport (MQTT) packet transport, based on the Internet of Protocols Alliance (IOPA) open specification  

It servers MQTT messages in standard IOPA format.

It is not intended as a standalone MQTT server/broker, as it does not contain the standard protocol logic for acknowledges, subscribes etc., but can form the basis for one.  See [`iopa-mqtt`](https://github.com/iopa-io/iopa-mqtt) for an open-source, standards-based, drop-in replacement for MQTT clients and brokers such as [`mqtt.js`](https://github.com/mqttjs/MQTT.js) [`mosca`](https://github.com/mcollina/mosca) and [`aedes`](https://github.com/mcollina/aedes).

`iopa-mqtt-packet` uses the widely used library ['mqtt-packet'](https://github.com/mqttjs/mqtt-packet) for protocol formatting to assure interoperability.

Written in plain javascript for maximum portability to constrained devices

Makes MQTT messages look to an application just like an HTTP message so little or no application changes required to support multiple REST protocols

## Status

Fully working prototype include server and client.

Includes:

### Server/Broker Functions

  * Layered protocol based on native TCP sockets and websockets over HTTP upgrade
  * Translation from RCP Raw Message to MQTT Packet in standard IOPA format, compatible with HTTP, COAP and MQTT applications including those written for Express, Connect, etc!
    
### Client Functions
  * Layered protocol based on native TCP sockets and websockets over HTTP upgrade
  * Translation from MQTT Packet in standard IOPA format to MQTT Raw Message
 
## Installation

    npm install iopa-mqtt-packet

## Usage
    
### Simple Hello World Server and Client
``` js
const iopa = require('iopa')
    , mqtt = require('iopa-mqtt-packet')      

var app = new iopa.App();

app.use(function(context, next){
   context.response.end('Hello World from ' + context["iopa.Path"]);
   return next();
    });

var server = mqtt.createServer(serverOptions, app.build());

server.listen(mqtt.constants.mqttPort).then(function(){
   var context = server.fetch('mqtt://127.0.0.1/device', {"iopa.Methd": "CONNECT"});
   context.response.pipe(process.stdout);
   context["iopa.Events"].on("response", function() {
   context.response["iopa.Body"].on('end', function() {
       process.exit(0)
    });
  });
  
  context.end();

 });

``` 

### Multicast and UniCast Server Client Example
``` js
const iopa = require('iopa')
    , mqtt = require('iopa-mqtt')      
    , Promise = require('bluebird')

var app = new iopa.App();
app.use(function(context, next){
  context.response["iopa.Body"].end('Hello World from ' + context["iopa.Path"]);
   return next();
    });
    
var serverOptions = {
    "server.LocalPortMulticast" : MQTT.constants.mqttMulticastIPV4
  , "server.LocalPortReuse" : true
  , "server.IsGlobalClient" : false
}

var server = mqtt.createServer(serverOptions, app.build());

Promise.join( server.listen(process.env.PORT, process.env.IP)).then(function(){
   server.log.info("Server is on port " + server.port );
  
   server.fetch('mqtt://127.0.0.1:' + server.port + '/projector', function(context) {
    context.response["iopa.Body"].pipe(process.stdout);
    context["iopa.Body"].end("CONNECT");
   });
});
``` 
  
## Roadmap

Next steps are to build a reference framework to link together server, client, discovery and other protocol functions.

Adding additional features of the protocol such as QOS1 and QOS2, is as simple as adding a new middleware function 
  

 