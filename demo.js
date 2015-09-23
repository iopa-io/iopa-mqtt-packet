/*
 * Copyright (c) 2015 Internet of Protocols Alliance (IOPA)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
global.Promise = require('bluebird');

const iopa = require('iopa')
    , mqtt = require('./index.js')      
    , util = require('util')
    , tcp = require('iopa-tcp')
  
const iopaMessageLogger = require('iopa-logger').MessageLogger

var sessionContextDemo;

var app = new iopa.App();
app.use(mqtt);
app.use(iopaMessageLogger);

app.use(function(context, next){
     context.log.info("[DEMO] SERVER MQTT DEMO " + context["iopa.Method"] + " " + context["iopa.Path"]);
   
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
    app.log.info("[DEMO] Server is on port " + server.port );
    return server.connect("mqtt://127.0.0.1");
  })
  .then(function(cl){
     mqttClient = cl;
    app.log.info("[DEMO] Client is on port " + mqttClient["server.LocalPort"]);
    return mqttClient.send("/", "CONNECT");   
  
  }).then(function(response){
       app.log.info("[DEMO] MQTT DEMO Response " + response["iopa.Method"]);  
       return mqttClient.send("/projector", "SUBSCRIBE");
    })
  .then(function(response){
       app.log.info("[DEMO] MQTT DEMO Response " + response["iopa.Method"]);
       sessionContextDemo.send("/projector", "PUBLISH", new Buffer('Hello World'));
       setTimeout(function(){
         server.close()}, 200);
    })
