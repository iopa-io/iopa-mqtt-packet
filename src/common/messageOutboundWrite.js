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

const MqttPacket = require('mqtt-packet'),
  util = require('util'),
  nextMessageId = require('./util.js').nextMessageId,

  constants = require('iopa').constants,
  IOPA = constants.IOPA,
  SERVER = constants.SERVER,
  MQTT = constants.MQTT;

/**
 * MQTT IOPA Utility to Convert and Send Outgoing Client Owin Request in Raw MQTT Packet (buffer)
 * 
 * @method SendRequest
 * @object context IOPA context dictionary
 * @returns void
 * @private
 */
module.exports = function messageOutboundWrite(context) {

  if (!context[IOPA.MessageId])
    context[IOPA.MessageId] = nextMessageId();

  var packet = {
    cmd: context[IOPA.Method].toLowerCase()
  };

  switch (context[IOPA.Method]) {
    case MQTT.METHODS.CONNECT:
      packet.protocolId = context[MQTT.ProtocolId];
      packet.protocolVersion = context[MQTT.ProtocolVersion];
      packet.clean = context[MQTT.Clean];
      packet.clientId = context[MQTT.ClientId];
      packet.keepalive = context[MQTT.KeepAlive];
      packet.username = context[MQTT.Username];
      packet.password = context[MQTT.Password];
      packet.will = context[MQTT.Will];
      break;
    case MQTT.METHODS.SUBSCRIBE:
      packet.messageId = context[IOPA.MessageId];
      packet.qos = context[MQTT.Qos];
      packet.subscriptions = context[MQTT.Subscriptions];
      break;
    case MQTT.METHODS.UNSUBSCRIBE:
      packet.messageId = context[IOPA.MessageId];
      packet.unsubscriptions = context[MQTT.Subscriptions];
      break;
    case MQTT.METHODS.PUBLISH:
      packet.messageId = context[IOPA.MessageId];
      packet.qos = context[MQTT.Qos];
      packet.dup = context[MQTT.Dup];
      packet.retain = context[MQTT.Retain];
      packet.topic = context[IOPA.Path];
      packet.payload = context[IOPA.Body].toBuffer();
      packet.length = packet.payload.length;
      break;
    case MQTT.METHODS.PINGREQ:
      break;
    case MQTT.METHODS.DISCONNECT:
      break;
    case MQTT.METHODS.CONNACK:
      packet.returnCode = context[IOPA.StatusCode];
      context[IOPA.ReasonPhrase] = MQTT.RETURN_CODES[context[IOPA.StatusCode]];
      packet.sessionPresent = context[MQTT.SessionPresent];
      break;
    case MQTT.METHODS.SUBACK:
      packet.messageId = context[IOPA.MessageId];
      packet.granted = context[MQTT.Granted];
      packet.payload = context[IOPA.Body].read();
      break;
    case MQTT.METHODS.UNSUBACK:
      packet.messageId = context[IOPA.MessageId];
      break;
    case MQTT.METHODS.PUBACK:
      packet.messageId = context[IOPA.MessageId];
      break;
    case MQTT.METHODS.PUBREC:
      packet.messageId = context[IOPA.MessageId];
      break;
    case MQTT.METHODS.PUBREL:
      packet.messageId = context[IOPA.MessageId];
      break;
    case MQTT.METHODS.PUBCOMP:
      packet.messageId = context[IOPA.MessageId];
      break;
    case MQTT.METHODS.PINGRESP:
      break;
    default:
      break;
  }

  var buf = MqttPacket.generate(packet);
  context[SERVER.RawStream].write(buf);
};
