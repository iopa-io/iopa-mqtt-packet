/*
 * Copyright (c) 2015 Limerun Project Contributors
 * Portions Copyright (c) 2015 Internet of Protocols Assocation (IOPA)
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
    , Promise = require('bluebird')
    , util = require('util')
    , iopaStream = require('iopa-common-stream');

const iopaMessageLogger = require('iopa-common-middleware').MessageLogger

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
        sessionContextDemo = context["server.ChannelContext"];
       return next();

});

var appClient = new iopa.App();
appClient.use(iopaMessageLogger);

appClient.use(function(context, next){
   return next();
    });
    
var serverOptions = {
    "server.LocalPortReuse" : true
  , "server.IsGlobalClient" : false
};

var clientOptions = { "server.IsGlobalClient" : true
                    , "server.LocalPortReuse" : false};
                    
var server = mqtt.createServer(serverOptions, appServer.build(), appClient.build());

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
    
    var context = mqttClient["server.CreateRequest"]("/", "CONNECT"); 
    context["mqtt.Clean"] = false;
    context["mqtt.ClientID"] = "CLIENTID-1";
    return context.send();
  })
  .then(function(response){
       server.log.info("[DEMO] MQTT DEMO Response " + response["iopa.Method"]);
         var context = mqttClient["server.CreateRequest"]("/projector", "SUBSCRIBE");
         return context.send()
        })
  .then(function(response){
       server.log.info("[DEMO] MQTT DEMO Response " + response["iopa.Method"]);
         var context = sessionContextDemo["server.CreateRequest"]("/projector", "PUBLISH");
            // no PUBACK Responses so no promises here
            context["iopa.Body"].end(new Buffer("Hello World"));
            setTimeout(function(){server.close()}, 2000);
    })
    
    
    
    