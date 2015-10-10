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
  iopaStream = require('iopa-common-stream'),
  nextMessageId = require('./util.js').nextMessageId,
  
  constants = require('iopa').constants,
  IOPA = constants.IOPA,
  SERVER = constants.SERVER,
  MQTT = constants.MQTT;
    
/**
 * @method inboundParseMonitor
 * @object context IOPA context dictionary
  */
module.exports = function messageInboundParser(eventsContext, transportContext) {
  var parser = MqttPacket.parser();

  parser.on('packet', _invokePacket);
  parser.on('error', _error.bind(eventsContext));

  transportContext[SERVER.RawStream].on('data', function (chunk) {
    parser.parse(chunk);
  });

  function _invokePacket(packet) {
 //   console.log(util.inspect(packet));
    
    var context = _createNewRequest(eventsContext);
    _parsePacket(packet, context);

    if (context[SERVER.IsRequest])
      eventsContext[IOPA.Events].emit(IOPA.EVENTS.Request, context)
    else {
      eventsContext[IOPA.Events].emit(IOPA.EVENTS.Response, context)
      setTimeout(context.dispose, 50);
    }

    context = null;
  }

  function _error(channelContext) {
    channelContext[SERVER.Logger].error("[MQTTFORMAT] Error parsing MQTT Packet");
  }
};

 /**
 * Helper to Create Blank New Request Context
 * 
 * @method _createNewRequest
 * @object parentContext MQTT Session Context
 * @private
 */
function _createNewRequest(parentContext) {
   var parentResponse = parentContext.response;
  
  var context = parentContext[SERVER.Factory].createContext();
  var response = context.response;

  parentContext[SERVER.Factory].mergeCapabilities(context, parentContext);

  context[SERVER.SessionId] = parentContext[SERVER.SessionId];
  context[SERVER.TLS] = parentContext[SERVER.TLS];

  context[SERVER.IsLocalOrigin] = false;

  context[SERVER.RemoteAddress] = parentContext[SERVER.RemoteAddress];
  context[SERVER.RemotePort] = parentContext[SERVER.RemotePort];
  context[SERVER.LocalAddress] = parentContext[SERVER.LocalAddress];
  context[SERVER.LocalPort] = parentContext[SERVER.LocalPort];
  context[SERVER.RawStream] = parentContext[SERVER.RawStream];
  response[SERVER.RawStream] = parentResponse[SERVER.RawStream];
 
  response[SERVER.TLS] = context[SERVER.TLS];
  response[SERVER.RemoteAddress] = context[SERVER.RemoteAddress];
  response[SERVER.RemotePort] = context[SERVER.RemotePort];
  response[SERVER.LocalAddress] = context[SERVER.LocalAddress];
  response[SERVER.LocalPort] = context[SERVER.LocalPort];

  context.create = parentContext.create;
  context.dispatch = parentContext.dispatch;
 
  return context;
}

/**
 * Helper to Convert Incoming MQTT Packet to IOPA Format
 * 
 * @method _requestFromPacket
 * @object packet MQTT Raw Packet
 * @object ctx IOPA context dictionary
 * @private
 */
function _parsePacket(packet, context) { 
    
  // PARSE PACKET
  var headers = {};

  headers["Content-Length"] = packet.length;

  context[IOPA.Headers] = headers;
  context[IOPA.Path] = packet.topic || "";
  context[IOPA.PathBase] = "";
  context[IOPA.QueryString] = "";
  context[IOPA.Method] = packet.cmd.toUpperCase();
  context[IOPA.Protocol] = IOPA.PROTOCOLS.MQTT;
  context[IOPA.Body] = iopaStream.EmptyStream;
  context[IOPA.StatusCode] = 0;

  if (context[SERVER.TLS])
    context[IOPA.Scheme] = IOPA.SCHEMES.MQTTS;
  else
    context[IOPA.Scheme] = IOPA.SCHEMES.MQTT;

  switch (context[IOPA.Method]) {
    case MQTT.METHODS.CONNECT:
      context[MQTT.ProtocolId] = packet.protocolId;
      context[MQTT.ProtocolVersion] = packet.protocolVersion;
      context[MQTT.Clean] = packet.clean;
      context[MQTT.ClientId] = packet.clientId;
      context[MQTT.KeepAlive] = packet.keepalive;
      context[MQTT.UserName] = packet.username;
      context[MQTT.Password] = packet.password;
      context[MQTT.Will] = packet.will;
      context[IOPA.MessageId] = "connect";
      context[SERVER.IsRequest] = true;
      break;
    case MQTT.METHODS.SUBSCRIBE:
      context[IOPA.MessageId] = packet.messageId;
      context[MQTT.Subscriptions] = packet.subscriptions;
      context[SERVER.IsRequest] = true;
      break;
    case MQTT.METHODS.UNSUBSCRIBE:
      context[IOPA.MessageId] = packet.messageId;
      context[MQTT.Subscriptions] = packet.unsubscriptions;
      context[SERVER.IsRequest] = true;
      break;
    case MQTT.METHODS.PUBLISH:
      context[IOPA.MessageId] = packet.messageId;
      context[MQTT.Qos] = packet.qos;
      context[MQTT.Dup] = packet.dup;
      context[MQTT.Retain] = packet.retain;
      context[IOPA.Path] = packet.topic;
      context[IOPA.Body] = new iopaStream.BufferStream(packet.payload);
      context[SERVER.IsRequest] = false;
      break;
    case MQTT.METHODS.PINGREQ:
      context[IOPA.MessageId] = "urn:io.iopa:mqtt:ping";
      context[SERVER.IsRequest] = true;
      break;
    case MQTT.METHODS.DISCONNECT:
      context[IOPA.MessageId] = "urn:io.iopa:mqtt:disconnect";
      context[SERVER.IsRequest] = true;
      break;
    case MQTT.METHODS.CONNACK:
      context[IOPA.StatusCode] = packet.returnCode;
      context[MQTT.SessionPresent] = packet.sessionPresent;
      context[IOPA.MessageId] = "urn:io.iopa:mqtt:connect";
      context[SERVER.IsRequest] = false;
      break;
    case MQTT.METHODS.SUBACK:
      context[IOPA.MessageId] = packet.messageId;
      context[MQTT.Granted] = packet.granted;
      context[SERVER.IsRequest] = false;
      break;
    case MQTT.METHODS.UNSUBACK:
      context[IOPA.MessageId] = packet.messageId;
      context[SERVER.IsRequest] = false;
      break;
    case MQTT.METHODS.PUBACK:
      context[IOPA.MessageId] = packet.messageId;
      context[SERVER.IsRequest] = false;
      break;
    case MQTT.METHODS.PUBREC:
      context[IOPA.MessageId] = packet.messageId;
      context[SERVER.IsRequest] = false;
      break;
    case MQTT.METHODS.PUBREL:
      context[IOPA.MessageId] = packet.messageId;
      context[SERVER.IsRequest] = false;
      break;
    case MQTT.METHODS.PUBCOMP:
      context[IOPA.MessageId] = packet.messageId;
      context[SERVER.IsRequest] = false;
      break;
    case MQTT.METHODS.PINGRESP:
      context[IOPA.MessageId] = "ping";
      context[SERVER.IsRequest] = false;
      break;
  }

  if (!context[SERVER.IsRequest])
  {
    context[IOPA.ReasonPhrase] = MQTT.RETURN_CODES[context[IOPA.StatusCode]];
    context.response.dispose();
    context.response = null;
  }
  else
  {
    // SETUP RESPONSE DEFAULTS
    var response = context.response;
  
    response[IOPA.StatusCode] = 0;
    response[IOPA.Headers] = {};
    response[IOPA.Protocol] = context[IOPA.Protocol];
    response[IOPA.MessageId] = context[IOPA.MessageId];
  
    switch (context[IOPA.Method]) {
      case MQTT.METHODS.CONNECT:
        response[IOPA.Method] = MQTT.METHODS.CONNACK;
        response[IOPA.Body] = new iopaStream.OutgoingNoPayloadStream();
        response[IOPA.StatusCode] = 0;
        response[MQTT.SessionPresent] = false;
        break;
      case MQTT.METHODS.SUBSCRIBE:
        response[IOPA.Method] = MQTT.METHODS.SUBACK;
        response[IOPA.Body] =  new iopaStream.OutgoingStream(); 
        response[MQTT.Granted] = [];
        break;
      case MQTT.METHODS.UNSUBSCRIBE:
        response[IOPA.Method] = MQTT.METHODS.UNSUBACK;
        response[IOPA.Body] = new iopaStream.OutgoingNoPayloadStream();
        break;
      case MQTT.METHODS.PUBLISH:
        response[IOPA.Method] = MQTT.METHODS.PUBACK;
        response[IOPA.Body] = new iopaStream.OutgoingNoPayloadStream();
        break;
      case MQTT.METHODS.PINGREQ:
        response[IOPA.Method] = MQTT.METHODS.PINGRESP;
        response[IOPA.Body] = new iopaStream.OutgoingNoPayloadStream();
        break;
      case MQTT.METHODS.DISCONNECT:
        response[IOPA.Method] = null;
        response[IOPA.Body] = null;
        break;
    }
    response[IOPA.ReasonPhrase] = MQTT.RETURN_CODES[response[IOPA.StatusCode]];
  }
}

