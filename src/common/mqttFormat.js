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
  
  constants = require('iopa').constants,
  IOPA = constants.IOPA,
  SERVER = constants.SERVER,
  MQTT = constants.MQTT;
    
// SETUP REQUEST DEFAULTS 
const maxMessageId   = Math.pow(2, 16);
var _lastMessageId = Math.floor(Math.random() * (maxMessageId - 1));

/**
 * MQTT IOPA Utility to Convert and Send Outgoing Client Owin Request in Raw MQTT Packet (buffer)
 * 
 * @method SendRequest
 * @object context IOPA context dictionary
 * @returns void
 * @private
 */
module.exports.sendRequest = function mqttFormat_SendRequest(context) {

       if (!context[IOPA.MessageId])
        context[IOPA.MessageId] = _nextMessageId();
     
       var  packet = {
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
           packet.subscriptions =  context[MQTT.Subscriptions];
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
     }
           
     var buf = MqttPacket.generate(packet);
      context[SERVER.RawStream].write(buf);
};

/**
 * @method inboundParseMonitor
 * @object context IOPA context dictionary
  */
module.exports.inboundParseMonitor = function ResponseParser(parentContext, eventType) {
     var parser  = MqttPacket.parser();
     var parentResponse = parentContext.response;
      
      parser.on('packet', _invokePacket);
      parser.on('error', _error.bind(parentContext));
     
      if (eventType == IOPA.EVENTS.Response)
      {
          parentResponse[SERVER.RawStream].on('data', function(chunk) {
              parser.parse(chunk);
          });
      } else
      {
         parentContext[SERVER.RawStream].on('data', function(chunk) {
              parser.parse(chunk);
          });
      }
          
      var that = this;
       
      function _invokePacket(packet) {
    //    console.log(util.inspect(packet));
        var context = parentContext[SERVER.Factory].createContext();
        parentContext[SERVER.Factory].mergeCapabilities(context, parentContext);

         context[SERVER.SessionId] = parentResponse[SERVER.SessionId];
        
        var response = context.response;
        
        context[SERVER.TLS] = parentContext[SERVER.TLS];
        
        if (eventType == IOPA.EVENTS.Response)
        {
          context[SERVER.IsRequest] = false;
          context[SERVER.IsLocalOrigin] = false;
  
          context[SERVER.RemoteAddress] = parentResponse[SERVER.RemoteAddress];
          context[SERVER.RemotePort] = parentResponse[SERVER.RemotePort] ;
          context[SERVER.LocalAddress] = parentResponse[SERVER.LocalAddress];
          context[SERVER.LocalPort] = parentResponse[SERVER.LocalPort]; 
          context[SERVER.RawStream] = parentResponse[SERVER.RawStream];
          response[SERVER.RawStream] = parentContext[SERVER.RawStream];
        } else
        {
          context[SERVER.IsRequest] = true;
          context[SERVER.IsLocalOrigin] = false;
  
          context[SERVER.RemoteAddress] = parentContext[SERVER.RemoteAddress];
          context[SERVER.RemotePort] = parentContext[SERVER.RemotePort] ;
          context[SERVER.LocalAddress] = parentContext[SERVER.LocalAddress];
          context[SERVER.LocalPort] = parentContext[SERVER.LocalPort]; 
          context[SERVER.RawStream] = parentContext[SERVER.RawStream];
          response[SERVER.RawStream] = parentResponse[SERVER.RawStream];
        }
      
        response[SERVER.TLS] = context[SERVER.TLS];
        response[SERVER.RemoteAddress] = context[SERVER.RemoteAddress];
        response[SERVER.RemotePort] = context[SERVER.RemotePort] ;
        response[SERVER.LocalAddress] = context[SERVER.LocalAddress];
        response[SERVER.LocalPort] = context[SERVER.LocalPort]; 
           
        context[SERVER.Fetch] = parentContext[SERVER.Fetch];
        context[SERVER.Dispatch] = parentContext[SERVER.Dispatch];

        _parsePacket(packet, context);
        parentContext[IOPA.Events].emit(eventType, context);
     
        if (eventType == IOPA.EVENTS.Response)
           setTimeout(context.dispose, 50);
     
        that = null;
        context = null;
      }
      
      function _error(context) {
          context[SERVER.Logger].error("[MQTTFORMAT] Error parsing MQTT Packet");
      } 
};

/**
 * Default IOPA Request for MQTT fields
 *
 * @method defaultContext

 * @object context IOPA context dictionary
 * @returns void
 * @public
 */
module.exports.defaultContext = function MQTTPacketClient_defaultContext(context) {  

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
       context[IOPA.MessageId] = _nextMessageId();
       context[MQTT.Subscriptions] = [{"topic": context[IOPA.Path], "qos": 0}];
      break;
    case MQTT.METHODS.UNSUBSCRIBE:
       context[IOPA.MessageId] = _nextMessageId();
       context[MQTT.Subscriptions] = [context[IOPA.Path]];
      break; 
    case MQTT.METHODS.PUBLISH:
       context[IOPA.MessageId] = _nextMessageId();
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


// PRIVATE HELPER FUNCTIONS 

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
    var headers= {};
   
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
           break;
        case MQTT.METHODS.SUBSCRIBE:
           context[IOPA.MessageId] = packet.messageId;
           context[MQTT.Subscriptions] = packet.subscriptions;
          break;
        case MQTT.METHODS.UNSUBSCRIBE:
           context[IOPA.MessageId] = packet.messageId;
           context[MQTT.Subscriptions] = packet.unsubscriptions;
          break; 
        case MQTT.METHODS.PUBLISH:
           context[IOPA.MessageId] = packet.messageId;
           context[MQTT.Qos] = packet.qos;
           context[MQTT.Dup] =  packet.dup;
           context[MQTT.Retain] =  packet.retain;
           context[IOPA.Path] = packet.topic;
           context[IOPA.Body] = new iopaStream.BufferStream(packet.payload);
           break; 
        case MQTT.METHODS.PINGREQ:
           context[IOPA.MessageId] = "urn:io.iopa:mqtt:ping";
           break;
        case MQTT.METHODS.DISCONNECT:
           context[IOPA.MessageId] = "urn:io.iopa:mqtt:disconnect";
           break; 
         case MQTT.METHODS.CONNACK:
           context[IOPA.StatusCode] = packet.returnCode;
           context[MQTT.SessionPresent] = packet.sessionPresent;
           context[IOPA.MessageId] = "urn:io.iopa:mqtt:connect";
           break;
         case MQTT.METHODS.SUBACK:
          context[IOPA.MessageId] = packet.messageId;
          context[MQTT.Granted] = packet.granted;
          break;
        case MQTT.METHODS.UNSUBACK:
          context[IOPA.MessageId] = packet.messageId;
          break; 
        case MQTT.METHODS.PUBACK:
         context[IOPA.MessageId] = packet.messageId;
             break; 
        case MQTT.METHODS.PUBREC:
         context[IOPA.MessageId] = packet.messageId;
            break; 
        case MQTT.METHODS.PUBREL:
          context[IOPA.MessageId] = packet.messageId;
            break; 
       case MQTT.METHODS.PUBCOMP:
           context[IOPA.MessageId] = packet.messageId;
         break; 
        case MQTT.METHODS.PINGRESP:
           context[IOPA.MessageId] = "ping";
           break;     
     }
     
    context[IOPA.ReasonPhrase] = MQTT.RETURN_CODES[context[IOPA.StatusCode]];
     
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
          response[IOPA.Body] = new iopaStream.OutgoingMultiSendStream();
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
           
    if (response[IOPA.Body])
    {
      response[IOPA.Body].on("finish", _mqttSendResponse.bind(this, context));
      response[IOPA.Body].on("data", _mqttSendResponse.bind(this, context));
    }
}

/**
 * Private method to send response packet
 * Triggered on data or finish events
 * 
 * @method _requestFromPacket
 * @object packet MQTT Raw Packet
 * @object ctx IOPA context dictionary
 * @private
 */
function _mqttSendResponse(context, payload) { 
    var response = context.response;
     
        if (!response[IOPA.MessageId])
          response[IOPA.MessageId] = _nextMessageId();
    
     var  packet = { cmd: response[IOPA.Method].toLowerCase() };
   
     switch (response[IOPA.Method]) {
      case MQTT.METHODS.CONNACK:
         packet.returnCode = response[IOPA.StatusCode];
         response[IOPA.ReasonPhrase] = MQTT.RETURN_CODES[response[IOPA.StatusCode]];
         packet.sessionPresent = response[MQTT.SessionPresent];
         break;
      case MQTT.METHODS.SUBACK:
         packet.messageId = response[IOPA.MessageId];
         packet.granted = response[MQTT.Granted];
        break;
      case MQTT.METHODS.UNSUBACK:
         packet.messageId = response[IOPA.MessageId];
        break; 
      case MQTT.METHODS.PUBACK:
         packet.messageId = response[IOPA.MessageId];
          break; 
      case MQTT.METHODS.PUBREC:
         packet.messageId = response[IOPA.MessageId];
          break; 
      case MQTT.METHODS.PUBREL:
         packet.messageId = response[IOPA.MessageId];
          break; 
     case MQTT.METHODS.PUBCOMP:
         packet.messageId = response[IOPA.MessageId];
        break; 
      case MQTT.METHODS.PINGRESP:
         break;
     }
     
     var buf = MqttPacket.generate(packet);
     response[SERVER.RawStream].write(buf);
}

/**
 * MQTT  Utility for sequential message id
 * 
 * @function _nextMessageId
 * @returns number
 * @private
 */function _nextMessageId() {
  if (++_lastMessageId === maxMessageId)
    _lastMessageId = 1;

  return _lastMessageId;
};