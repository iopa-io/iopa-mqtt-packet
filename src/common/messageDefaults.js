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

const nextMessageId = require('./util.js').nextMessageId,
   iopaStream = require('iopa-common-stream'),

  constants = require('iopa').constants,
  IOPA = constants.IOPA,
  SERVER = constants.SERVER,
  MQTT = constants.MQTT;

/**
 * Default IOPA Request for MQTT fields
 *
 * @method defaultContext

 * @object context IOPA context dictionary
 * @returns void
 * @public
 */
module.exports = function MQTTPacketClient_defaultContext(context) {  

  context[IOPA.Body] = new iopaStream.OutgoingMessageStream();

  switch (context[IOPA.Method]) {
    case MQTT.METHODS.CONNECT:
       context[MQTT.ProtocolId] = "MQTT";
       context[MQTT.ProtocolVersion] = 4;
       context[MQTT.Clean] = true;
       context[MQTT.ClientId] = context[SERVER.SessionId];
       context[MQTT.Keepalive] = 0;
       context[MQTT.UserName] = null;
       context[MQTT.Password] = null;
       context[MQTT.Will] = null;
       context[IOPA.MessageId] = "urn:io.iopa:mqtt:connect";
       break;
    case MQTT.METHODS.SUBSCRIBE:
       context[MQTT.Qos] = 0;
       context[IOPA.MessageId] = nextMessageId();
       context[MQTT.Subscriptions] = [{"topic": context[IOPA.Path], "qos": 0}];
      break;
    case MQTT.METHODS.UNSUBSCRIBE:
       context[IOPA.MessageId] = nextMessageId();
       context[MQTT.Subscriptions] = [context[IOPA.Path]];
      break; 
    case MQTT.METHODS.PUBLISH:
       context[IOPA.MessageId] = nextMessageId();
       context[MQTT.Qos] = 2;
       context[MQTT.Dup] = false;
       context[MQTT.Retain] = false;
       
       break; 
    case MQTT.METHODS.PINGREQ:
       context[IOPA.MessageId] = "urn:io.iopa:mqtt:ping";
       break;
    case MQTT.METHODS.DISCONNECT:
        context[IOPA.MessageId] = "urn:io.iopa:mqtt:disconnect";
       break;
  }
  
  return context;
};
