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
        
const constants = require('iopa').constants,
    IOPA = constants.IOPA,
    SERVER = constants.SERVER,
    MQTT = constants.MQTT
    
const THISMIDDLEWARE = {CAPABILITY: "urn:io.iopa:mqtt:serverchannel", SESSIONCLOSE: "serverchannel.SessionClose"},
       MQTTMIDDLEWARE = {CAPABILITY: "urn:io.iopa:mqtt", PROTOCOLVERSION: "OASIS 3.1.1"},
       packageVersion = require('../../package.json').version;
  
/**
 * IOPA Middleware: Translates IOPA Stream Connections to IOPA Multi-Packet Connection 
 *
 * @class MQTTServerChannelParser
 * @this app.properties  the IOPA AppBuilder Properties Dictionary
 * @constructor
 */
function MQTTServerChannelParser(app) {
    app.properties[SERVER.Capabilities][MQTTMIDDLEWARE.CAPABILITY] = {};
    app.properties[SERVER.Capabilities][MQTTMIDDLEWARE.CAPABILITY][SERVER.Version] = packageVersion;
    app.properties[SERVER.Capabilities][MQTTMIDDLEWARE.CAPABILITY][IOPA.Protocol] = MQTTMIDDLEWARE.PROTOCOLVERSION;
    
    app.properties[SERVER.Capabilities][THISMIDDLEWARE.CAPABILITY] = {};
    app.properties[SERVER.Capabilities][THISMIDDLEWARE.CAPABILITY][SERVER.Version] = packageVersion;
}

/**
 * @method invoke
 * @this context IOPA channelContext dictionary
 * @param next   IOPA application delegate for the remainder of the pipeline
 */
MQTTServerChannelParser.prototype.channel = function MQTTServerChannelParser_channel(channelContext, next) {
    channelContext[IOPA.Scheme] = IOPA.SCHEMES.MQTT;
    
    var p = new Promise(function(resolve, reject){
        channelContext[SERVER.Capabilities][THISMIDDLEWARE.CAPABILITY][THISMIDDLEWARE.SESSIONCLOSE] = resolve;
    }); 
    
    channelContext[IOPA.Events].on(IOPA.EVENTS.Disconnect, function(){
        channelContext[SERVER.Capabilities][THISMIDDLEWARE.CAPABILITY][THISMIDDLEWARE.SESSIONCLOSE]();
    });
    
    channelContext[IOPA.Events].on(IOPA.EVENTS.Request, function(context){
         context.using(next.invoke);
     })
  
     MqttFormat.inboundParseMonitor(channelContext, IOPA.EVENTS.Request);
    
    return next().then(function(){ return p });
};

module.exports = MQTTServerChannelParser;