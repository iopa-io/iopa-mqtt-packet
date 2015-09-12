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

exports.MQTT = {
    ProtocolId: "mqtt.ProtocolId",
    ProtocolVersion: "mqtt.ProtocolVersion",
    Clean: "mqtt.Clean",
    ClientId: "mqtt.ClientId",
    KeepAlive: "mqtt.KeepAlive",
    UserName: "mqtt.UserName",
    Password: "mqtt.Password",
    Will: "mqtt.Will",
    Qos: "mqtt.Qos",
    Subscriptions: "mqtt.Subscriptions",
    Dup: "mqtt.Dup",
    Retain: "mqtt.Retain",
    SessionPresent: "mqtt.SessionPresent",
    Granted: "mqtt.Granted",

    METHODS: {
        CONNECT: "CONNECT",
        SUBSCRIBE: "SUBSCRIBE",
        UNSUBSCRIBE: "UNSUBSCRIBE",
        PUBLISH: "PUBLISH",
        PINGREQ: "PINGREQ",
        DISCONNECT: "DISCONNECT",
        CONNACK: "CONNACK",
        SUBACK: "SUBACK",
        UNSUBACK: "UNSUBACK",
        PUBACK: "PUBACK",
        PUBREC: "PUBREC",
        PUBREL: "PUBREL",
        PUBCOMP: "PUBCOMP",
        PINGRESP: "PINGRESP"
    },
    
    RETURN_CODES:
    {
    0: 'OK',
    1: 'Unacceptable protocol version',
    2: 'Identifier rejected',
    3: 'Server unavailable',
    4: 'Bad user name or password',
    5: 'Not authorized',
    }

};
