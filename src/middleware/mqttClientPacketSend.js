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

var util = require('util')
    , MqttFormat = require('../common/mqttFormat.js')
          
const constants = require('iopa').constants,
    IOPA = constants.IOPA,
    SERVER = constants.SERVER,
    MQTT = constants.MQTT
    
 const MQTTMIDDLEWARE = {CAPABILITY: "urn:io.iopa:mqtt", PROTOCOLVERSION: "OASIS 3.1.1"},
    packageVersion = require('../../package.json').version;

 /**
 * MQTT IOPA Middleware to dispatch record
 *
 * @class MQTTClientPacketSend
 * @this app.properties  the IOPA AppBuilder Properties Dictionary, used to add server.capabilities
 * @constructor
 * @public
 */
function MQTTClientPacketSend(app) { 
    app.properties[SERVER.Capabilities][MQTTMIDDLEWARE.CAPABILITY] = {};
    app.properties[SERVER.Capabilities][MQTTMIDDLEWARE.CAPABILITY][SERVER.Version] = packageVersion;
    app.properties[SERVER.Capabilities][MQTTMIDDLEWARE.CAPABILITY][IOPA.Protocol] = MQTTMIDDLEWARE.PROTOCOLVERSION;
 }
 
/**
 * Parses IOPA request into MQTT packet
 * IOPA Default App in Client Pipeline
 *
 * @method invoke
 * @param context IOPA context dictionary
 */
MQTTClientPacketSend.prototype.dispatch = function MQTTClientPacketSend_dispatch(context, next) {
    return next().then(function () {
        try {
            MqttFormat.sendRequest(context);
        }
        catch (err) {
            context[SERVER.Logger].error("[MQTT-CLIENTPACKETSEND] Unable to send MQTT packet "
                + context[IOPA.Method] + ": " + err);
            context = null;
            return new Promise(function (resolve, reject) { reject('Unable to parse IOPA Message into MQTT packet'); });
        }

        return new Promise(function (resolve, reject) {
            context[IOPA.Events].on(IOPA.EVENTS.Response, MQTTClientPacket_Response.bind(this, context, resolve));
        });
    });
};

function MQTTClientPacket_Response(context, done, response) {
    switch (response[IOPA.Method]) {
    case MQTT.METHODS.PUBLISH:
         done(response);
         break;
    default:
        done(response);
        break;
     }
}

 module.exports = MQTTClientPacketSend;