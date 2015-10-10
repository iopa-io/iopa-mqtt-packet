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

const messageDefaults = require('../common/messageDefaults.js'),
      messageInboundParser = require('../common/messageInboundParser.js'),
      messageOutboundWrite = require('../common/messageOutboundWrite.js')
              
const constants = require('iopa').constants,
    IOPA = constants.IOPA,
    SERVER = constants.SERVER,
    MQTT = constants.MQTT
    
const iopaClientSend = require('iopa-common-middleware').ClientSend
    , iopaMessageCache = require('iopa-common-middleware').Cache;
    
const MQTTMIDDLEWARE = {CAPABILITY: "urn:io.iopa:mqtt", PROTOCOLVERSION: "OASIS 3.1.1"},
       packageVersion = require('../../package.json').version;
  
/**
 * IOPA Middleware: Translates IOPA TCP Stream Connections to MQTT Multi-Packet Connection 
 *
 * @class IopaMQTT
 * @this app.properties  the IOPA AppBuilder Properties Dictionary
 * @constructor
 */
function IopaMQTT(app) {
    app.properties[SERVER.Capabilities][MQTTMIDDLEWARE.CAPABILITY] = {};
    app.properties[SERVER.Capabilities][MQTTMIDDLEWARE.CAPABILITY][SERVER.Version] = packageVersion;
    app.properties[SERVER.Capabilities][MQTTMIDDLEWARE.CAPABILITY][IOPA.Protocol] = MQTTMIDDLEWARE.PROTOCOLVERSION;
    
    app.use(iopaMessageCache.Match);
    app.use(iopaClientSend);
    app.use(iopaMessageCache.Cache);
 }

/**
 * CHANNEL method called for each inbound session
 *
 * @method channel
 * @this IopaMQTT 
 * @param channelContext IOPA context properties dictionary
 * @param next the next IOPA AppFunc in pipeline 
 * @returns Promise
 */
IopaMQTT.prototype.channel = function IopaMQTT_channel(channelContext, next) {
    
    channelContext[IOPA.Scheme] = IOPA.SCHEMES.MQTT;
    
    var p = new Promise(function(resolve, reject){ channelContext[SERVER.RawStream].once("finish", resolve); }); 
       
    channelContext[IOPA.Events].on(IOPA.EVENTS.Request, function(context){
         context.using(next.invoke);
     })
     
    return next().then(function(){
        messageInboundParser(channelContext, channelContext);  
        return p 
        });
};

/**
 * INVOKE method called for each inbound request
 *
 * @method invoke
 * @this IopaMQTT 
 * @param channelContext IOPA context properties dictionary
 * @param next the next IOPA AppFunc in pipeline 
 * @returns Promise
 */
IopaMQTT.prototype.invoke = function IopaMQTT_invoke(context, next) {
   //  context[SERVER.Capabilities][MQTTMIDDLEWARE.CAPABILITY].observation = IopaMQTT_observation.bind(this, context);
    context.response[IOPA.Body].once("finish", context.dispatch.bind(this, context.response));  
    return next()
};

/**
 * CONNECT method called for each outbound session
 *
 * @method connect
 * @this IopaMQTT 
 * @param channelContext IOPA context properties dictionary
 * @param next the next IOPA AppFunc in pipeline 
 * @returns Promise
 */
IopaMQTT.prototype.connect = function IopaMQTT_connect(channelContext, next){
     messageInboundParser(channelContext, channelContext.response);
     return next();
};

/**
 * CREATE method called to create a new context request
 *
 * @method create
 * @this IopaMQTT 
 * @param context IOPA context properties dictionary
 * @param next the next IOPA AppFunc in pipeline 
 * @returns context
 */
IopaMQTT.prototype.create = function IopaMQTT_create(context, next){
     messageDefaults(context);
     return next();
};

/**
 * DISPATCH method called to translate each outbound request to transport
 *
 * @method dispatch
 * @this IopaMQTT 
 * @param context IOPA context properties dictionary
 * @param next the next IOPA AppFunc in pipeline 
 * @returns Promise
 */
IopaMQTT.prototype.dispatch = function IopaMQTT_dispatch(context, next) {
    return next().then(function () {
        messageOutboundWrite(context);

        return new Promise(function (resolve, reject) {
            context[IOPA.Events].on(IOPA.EVENTS.Response, _invokeOnResponse.bind(this, context, resolve));
        });
    });
};

function _invokeOnResponse(context, resolve, response) {
    switch (response[IOPA.Method]) {
    case MQTT.METHODS.PUBLISH:
         resolve(response);
         break;
    default:
        resolve(response);
        break;
     }
}

module.exports = IopaMQTT;