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

var  util = require('util')
    , MqttFormat = require('../common/mqttFormat.js')
    
const constants = require('iopa').constants,
    IOPA = constants.IOPA,
    SERVER = constants.SERVER
    
const THISMIDDLEWARE = {CAPABILITY: "urn:io.iopa:mqtt:clientchannel"},
      MQTTMIDDLEWARE = {CAPABILITY: "urn:io.iopa:mqtt"},
       packageVersion = require('../../package.json').version;
  
  /**
 * MQTT IOPA Middleware for Client Connection Defaults
 *
 * @class MQTTClientChannelParser
 * @this app.properties  the IOPA AppBuilder Properties Dictionary, used to add server.capabilities
 * @constructor
 * @public
 */
function MQTTClientChannelParser(app) {
  if (!app.properties[SERVER.Capabilities][MQTTMIDDLEWARE.CAPABILITY])
        throw ("Missing Dependency: IOPA MQTT Server/Middleware in Pipeline");
     
    app.properties[SERVER.Capabilities][THISMIDDLEWARE.CAPABILITY] = {};
    app.properties[SERVER.Capabilities][THISMIDDLEWARE.CAPABILITY][SERVER.Version] = packageVersion;
}

MQTTClientChannelParser.prototype.invoke = function MQTTClientChannelParser_invoke(channelContext, next){
     MqttFormat.inboundParseMonitor(channelContext, IOPA.EVENTS.Response);
     return next();
};

module.exports = MQTTClientChannelParser;
