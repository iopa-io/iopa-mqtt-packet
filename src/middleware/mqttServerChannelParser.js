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

// DEPENDENCIES

var util = require('util')
  , MqttFormat = require('../common/mqttFormat.js');
  
const MQTT = require('../common/constants.js').MQTT
        
const constants = require('iopa').constants,
    IOPA = constants.IOPA,
    SERVER = constants.SERVER
  
/**
 * IOPA Middleware: Translates IOPA Stream Connections to IOPA Multi-Packet Connection 
 *
 * @class MQTTServerChannelParser
 * @this app.properties  the IOPA AppBuilder Properties Dictionary
 * @constructor
 */
function MQTTServerChannelParser(app) {
    app.properties[SERVER.Capabilities]["iopa-mqtt.Version"] = "1.2";
    app.properties[SERVER.Capabilities]["iopa-mqtt.Support"] = {
        "mqtt.Version": "3.1.1"
    };
}

/**
 * @method invoke
 * @this context IOPA channelContext dictionary
 * @param next   IOPA application delegate for the remainder of the pipeline
 */
MQTTServerChannelParser.prototype.invoke = function MQTTServerChannelParser_invoke(channelContext, next) {
    channelContext[IOPA.Scheme] = IOPA.SCHEMES.MQTT;
    
    channelContext[IOPA.Events].on(IOPA.EVENTS.Disconnect, function(){
        channelContext["MQTTServerChannelParser.SessionClose"]();
   });
 
    MqttFormat.inboundParseMonitor(channelContext, IOPA.EVENTS.Request);
    
    return next().then(function(){ return new Promise(function(resolve, reject){
           channelContext["MQTTServerChannelParser.SessionClose"] = resolve;
           channelContext["MQTTServerChannelParser.SessionError"] = reject;
        }); 
    });
};

module.exports = MQTTServerChannelParser;