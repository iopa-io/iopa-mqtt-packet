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

const iopa = require('iopa')
    , mqtt = require('./index.js')      
    , util = require('util')
  
const iopaMessageLogger = require('iopa-logger').MessageLogger

var sessionContextDemo;

var appServer = new iopa.App();
appServer.use(iopaMessageLogger);

appServer.use(function(context, next){
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

var serverOptions = {
    "server.LocalPortReuse" : true
  , "server.IsGlobalClient" : false
};
                  
var server = mqtt.createServer(serverOptions, appServer.build());
server.connectuse(iopaMessageLogger);

if (!process.env.PORT)
  process.env.PORT = 1883;

var context;
var mqttClient;

server.listen(process.env.PORT, process.env.IP)
  .then(function(){
    server.log.info("[DEMO] Server is on port " + server.port );
    return server.connect("mqtt://127.0.0.1");
  })
  .then(function(cl){
     mqttClient = cl;
    server.log.info("[DEMO] Client is on port " + mqttClient["server.LocalPort"]);
    
   return mqttClient.send("/", 
    {"iopa.Method": "CONNECT", 
    "mqtt.Clean": false,
    "mqtt.ClientID": "CLIENTID-1" });   
  
  }).then(function(response){
       server.log.info("[DEMO] MQTT DEMO Response " + response["iopa.Method"]);
       
       return mqttClient.send("/projector", {"iopa.Method": "SUBSCRIBE"});
        }, function(err){console.log(err);})
  .then(function(response){
       server.log.info("[DEMO] MQTT DEMO Response " + response["iopa.Method"]);
       sessionContextDemo.send("/projector", "PUBLISH", new Buffer('Hello World'));
             // no PUBACK Responses so no  promise then here
       setTimeout(function(){
         server.close()}, 2000);
    })
    .catch(function(err){ console.log(err);  throw err;});
