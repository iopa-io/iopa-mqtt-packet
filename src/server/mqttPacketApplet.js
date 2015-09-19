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
 
 const util = require('util');

const iopa = require('iopa')

const MQTTServerChannelParser = require('../middleware/mqttServerChannelParser.js')
    , MQTTClientChannelParser = require('../middleware/mqttClientChannelParser.js')
    , MQTTMessageCreateDefaults = require('../middleware/mqttMessageCreateDefaults.js')
    , MQTTClientPacketSend = require('../middleware/mqttClientPacketSend.js')
       
const iopaClientSend = require('iopa-common-middleware').ClientSend
    , iopaMessageCache = require('iopa-common-middleware').Cache;
    
const MQTTMIDDLEWARE = {CAPABILITY: "urn:io.iopa:mqtt", PROTOCOLVERSION: "OASIS 3.1.1"},
    packageVersion = require('../../package.json').version;

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
 * @class MQTTPacketApplet
 * @param app   the IOPA AppBuilder with Properties Dictionary, used to add server.capabilities
 * @constructor
 */
function MQTTPacketApplet(app) {
  _classCallCheck(this, MQTTPacketApplet);
  
    app.properties[SERVER.Capabilities][MQTTMIDDLEWARE.CAPABILITY] = {};
    app.properties[SERVER.Capabilities][MQTTMIDDLEWARE.CAPABILITY][SERVER.Version] = packageVersion;
    app.properties[SERVER.Capabilities][MQTTMIDDLEWARE.CAPABILITY][IOPA.Protocol] = MQTTMIDDLEWARE.PROTOCOLVERSION;

    app.use(MQTTServerChannelParser);
    app.use(MQTTClientChannelParser);
    app.use(iopaMessageCache.Match);
    app.use(MQTTMessageCreateDefaults);
    app.use(iopaClientSend);
    app.use(iopaMessageCache.Cache);
    app.use(MQTTClientPacketSend);
};

module.exports = MQTTPacketApplet;