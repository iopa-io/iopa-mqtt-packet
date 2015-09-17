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
 
const util = require('util')
   
const iopa = require('iopa')
    , tcp = require('iopa-tcp')
    , IopaServer = require('iopa-server')
    
const MQTTServerChannelParser = require('../middleware/mqttServerChannelParser.js')
    , MQTTClientChannelParser = require('../middleware/mqttClientChannelParser.js')
    , MQTTMessageCreateDefaults = require('../middleware/mqttMessageCreateDefaults.js')
    , MQTTClientPacketSend = require('../middleware/mqttClientPacketSend.js')
       
const iopaClientSend = require('iopa-common-middleware').ClientSend
    , iopaMessageCache = require('iopa-common-middleware').Cache;

const constants = require('iopa').constants,
    IOPA = constants.IOPA,
    SERVER = constants.SERVER,
    APPBUILDER = constants.APPBUILDER,
    MQTT = constants.MQTT

/* *********************************************************
 * IOPA MQTT SERVER / CLIENT WITH MIDDLEWARE CONSTRUCTED
 * ********************************************************* */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }


/**
 * MQTT IOPA Server includes MQTT Client
 * 
 * @class MQTTServer
 * @param {object} options  
 * @param {appFunc} appFunc  Server callback in IOPA AppFunc format
 * @constructor
 */
function MQTTPacketServer(options, appFuncServer) {
  _classCallCheck(this, MQTTPacketServer);
    
  if (typeof options === 'function') {
     appFuncServer = options;
    options = {};
  }
  
    /**
    * Call Parent Constructor to ensure the following are created
    *   this.serverPipeline
    *   this.clientPipeline
    */
   IopaServer.call(this, options, appFuncServer);
        
   // INIT TCP SERVER
  this._tcp = tcp.createServer(options, this.serverChannelPipeline);
}

util.inherits(MQTTPacketServer, IopaServer);

// PIPELINE SETUP METHODS OVERRIDES
/**
 * SERVER CHANNEL PIPELINE SETUP
 * @InheritDoc
 */
MQTTPacketServer.prototype._serverChannelPipelineSetup = function (serverChannelApp) {
   serverChannelApp.use(iopaClientSend);
   serverChannelApp.use(MQTTMessageCreateDefaults);
   serverChannelApp.use(MQTTServerChannelParser);
    serverChannelApp.use(iopaMessageCache.Match);
 };

/**
 * SERVER MESSAGE PIPELINE SETUP
 * @InheritDoc
 */
MQTTPacketServer.prototype._serverMessagePipelineSetup = function (app) {
   app.use(MQTTMessageCreateDefaults);  
   app.use(iopaMessageCache.Cache);
};


const iopaMessageLogger = require('iopa-common-middleware').MessageLogger

/**
 * CLIENT CHANNEL PIPELINE SETUP
 * @InheritDoc
 */
MQTTPacketServer.prototype._clientConnectPipelineSetup = function (clientConnectApp) {
  clientConnectApp.use(MQTTMessageCreateDefaults);
  clientConnectApp.use(MQTTClientChannelParser);
  clientConnectApp.use(iopaClientSend);
  clientConnectApp.use(iopaMessageCache.Match);
};

/**
 * CLIENT MESSAGE PIPELINE SETUP
 * @InheritDoc
 */
MQTTPacketServer.prototype._clientMessageSendPipelineSetup = function (clientMessageApp) {
  clientMessageApp.properties["server.Capabilities"]["iopa-mqtt.Version"] = "1.2";
  clientMessageApp.properties["server.Capabilities"]["iopa-mqtt.Support"] = {
    "mqtt.Version": "3.1.1"
  };
  clientMessageApp.use(iopaMessageCache.Cache);
  clientMessageApp.properties[APPBUILDER.DefaultApp] = MQTTClientPacketSend;
};

// OVERRIDE METHODS

/**
 * mqtt.Listen()  Begin accepting connections on the specified port and hostname. 
 * If the hostname is omitted, the server will accept connections directed to any IPv4 address (INADDR_ANY).
 * 
 * @method listen
 * @param {integer} port  
 * @param {string} address (IPV4 or IPV6)
 * @returns promise completes when listening
 * @public
 */
MQTTPacketServer.prototype._listen = function MQTTPacketServer_listen(port, address) {
    return this._tcp.listen(port, address);
};

Object.defineProperty(MQTTPacketServer.prototype, "port", { get: function () { return this._tcp.port; } });
Object.defineProperty(MQTTPacketServer.prototype, "address", { get: function () { return this._tcp.address; } });

/**
 * mqtt.connect() Create MQTT Session over TCP Channel to given Host and Port
 *
 * @method connect
 * @this MQTTServer MQTTServer instance
 * @parm {string} urlStr url representation of Request mqtt://127.0.0.1/hello
 * @returns {Promise(context)}
 * @public
 */
MQTTPacketServer.prototype._connect = function MQTTPacketServer_connect(urlStr) {
  return this._tcp.connect(urlStr);
};

/**
 * mqtt.close() Close MQTT Session 
 *
 * @method connect
 * @this MQTTServer MQTTServer instance
 * @returns {Promise()}
 * @public
 */
MQTTPacketServer.prototype._close = function MQTTPacketServer_close() {
  return this._tcp.close();
};

module.exports = MQTTPacketServer;