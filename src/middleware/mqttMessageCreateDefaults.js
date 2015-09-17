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
    SERVER = constants.SERVER,
    MQTT = constants.MQTT
    
const MQTTMIDDLEWARE = {CAPABILITY: "urn:io.iopa:mqtt", PROTOCOLVERSION: "OASIS 3.1.1"},
    packageVersion = require('../../package.json').version;

    
  /**
 * MQTT IOPA Middleware for Client Connection Defaults
 *
 * @class MQTTMessageCreateDefaults
 * @this app.properties  the IOPA AppBuilder Properties Dictionary, used to add server.capabilities
 * @constructor
 * @public
 */
function MQTTMessageCreateDefaults(app) {
    app.properties[SERVER.Capabilities][MQTTMIDDLEWARE.CAPABILITY] = {};
    app.properties[SERVER.Capabilities][MQTTMIDDLEWARE.CAPABILITY][SERVER.Version] = packageVersion;
    app.properties[SERVER.Capabilities][MQTTMIDDLEWARE.CAPABILITY][IOPA.Protocol] = MQTTMIDDLEWARE.PROTOCOLVERSION;
 }

MQTTMessageCreateDefaults.prototype.invoke = function MQTTMessageCreateDefaults_invoke(context, next){
     context[SERVER.Fetch] = MQTTMessageCreateDefaults_fetch.bind(this, context[IOPA.Seq], context[SERVER.Fetch]);
     return next();
};

 /**
 * MQTT IOPA Middleware for Client Message Request Defaults
 *
 * @method fetch
 * @private
 */
function MQTTMessageCreateDefaults_fetch(id, nextFetch, urlStr, options, pipeline){
    return nextFetch(urlStr, options, function(context){
           MqttFormat.defaultContext(context);
           return pipeline(context);
    });
};

module.exports = MQTTMessageCreateDefaults;