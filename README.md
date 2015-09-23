# [![IOPA](http://iopa.io/iopa.png)](http://iopa.io)<br> iopa-mqtt-packet

[![Build Status](https://api.shippable.com/projects/55f4870c1895ca447414dd90/badge?branchName=master)](https://app.shippable.com/projects/55f4870c1895ca447414dd90) 
[![IOPA](https://img.shields.io/badge/iopa-middleware-99cc33.svg?style=flat-square)](http://iopa.io)
[![limerun](https://img.shields.io/badge/limerun-certified-3399cc.svg?style=flat-square)](https://nodei.co/npm/limerun/)

[![NPM](https://nodei.co/npm/iopa-mqtt-packet.png?downloads=true)](https://nodei.co/npm/iopa-mqtt-packet/)

## About
`iopa-mqtt-packet` is an API-first OASIS Message Queuing Telemetry Transport (MQTT) packet transport for the Internet of Things (IoT), based on the Internet of Protocols Alliance (IOPA) specification  

It servers MQTT messages in standard IOPA format.  It is a lower level utility package that is not required directly if you are using the recommended [`iopa-mqtt`](htttps://github.com/iopa-io/iopa-mqtt) package.

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
    
### Simple Hello World server with raw protocol (use [`iopa-mqtt`](htttps://github.com/iopa-io/iopa-mqtt) for simplified version)
``` js
const iopa = require('iopa')
    , mqtt = require('iopa-mqtt-packet')      
    , tcp = require('iopa-tcp')
  
var app = new iopa.App();
app.use(mqtt);

var sessionContextDemo;

app.use(function(context, next){
   if (["CONNACK", "PINGRESP"].indexOf(context.response["iopa.Method"]) >=0)
     context.response["iopa.Body"].end();

    
  if (["SUBACK"].indexOf(context.response["iopa.Method"]) >=0)
    {
       context.response["mqtt.Granted"] =[0,1,2,128];
       context.response["iopa.Body"].write("");
    }
    
   if (["CONNECT"].indexOf(context["iopa.Method"]) >=0)
        sessionContextDemo = context["server.ParentContext"];
       return next();

});
                  
var server = tcp.createServer(app.build());

if (!process.env.PORT)
  process.env.PORT = 1883;

var mqttClient;

server.listen(process.env.PORT, process.env.IP)
  .then(function(){
    return server.connect("mqtt://127.0.0.1");
  })
  .then(function(cl){
     mqttClient = cl;
     return mqttClient.send("/", "CONNECT");   
  }).then(function(response){
         return mqttClient.send("/projector", "SUBSCRIBE");
        })
  .then(function(response){
        sessionContextDemo.send("/projector", "PUBLISH", new Buffer('Hello World'));
       setTimeout(function(){
         server.close()}, 2000);
    })

``` 
  
## Roadmap

Adding additional features of the protocol such as QOS1 and QOS2, is as simple as adding a new middleware function 
  

 