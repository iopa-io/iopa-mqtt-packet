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
 global.Promise = require('bluebird');

const iopa = require('iopa')
    , util = require('util')
    , Events = require('events')
    , mqtt = require('../index.js')
    , iopaStream = require('iopa-common-stream')
        , tcp = require('iopa-tcp')
        
    const iopaMessageLogger = require('iopa-logger').MessageLogger

var should = require('should');

var numberConnections = 0;

describe('#MQTT Server()', function() {
  
  var server, mqttClient;
  var events = new Events.EventEmitter();
  var sessionContextDemo;
  
  before(function(done){
     var app = new iopa.App();
     app.use(mqtt);
     app.use(iopaMessageLogger);
      
      app.use(function(context, next){
       
        if (["CONNACK", "PINGRESP"].indexOf(context.response["iopa.Method"]) >=0)
          context.response["iopa.Body"].end();
 
          if (["SUBACK"].indexOf(context.response["iopa.Method"]) >=0)
            {
              context.response["mqtt.Granted"] =[0,1,2,128];
              context.response["iopa.Body"].write("");
            }
    
          if (["CONNECT"].indexOf(context["iopa.Method"]) >=0)
                sessionContextDemo = context["server.ParentContext"];
               
         events.emit("data", context);  
         
         return next();
          });
          
             
       server = tcp.createServer(app.build());
      
      if (!process.env.PORT)
        process.env.PORT = 1883;
      
       server.listen(process.env.PORT, process.env.IP).then(function(){
            done();
            setTimeout(function(){ events.emit("SERVER-TCP");}, 50);
             });
    });
    
   it('should listen via TCP', function(done) {   
           server.port.should.equal(1883);
           done();
    });
    
         
   it('should connect via TCP', function (done) {
     server.connect("mqtt://127.0.0.1")
       .then(function (cl) {
         mqttClient = cl;
         mqttClient["server.RemotePort"].should.equal(1883);
         done();
       });
   });
    
    it('should connect via MQTT', function(done) {
      
         mqttClient.send("/", 
            {"iopa.Method": "CONNECT", 
            "mqtt.Clean": false,
            "mqtt.ClientId": "CLIENTID-1" }   
          ).then(function(response){
            numberConnections ++;
              response["iopa.Method"].should.equal('CONNACK');
            events.emit("CLIENT-CONNACK");
            done();
           });
    });
    
    it('should subscribe via MQTT', function(done) {
      
       mqttClient.send("/projector", 
          {"iopa.Method": "SUBSCRIBE"})
          .then(function(response){
             response["iopa.Method"].should.equal('SUBACK');
             
             sessionContextDemo.fetch("/projector", 
             {
               "iopa.Method": "PUBLISH", 
               "iopa.Body": new iopaStream.OutgoingStream('Hello World')
               }
               , function(){   
                         done();
                  });
          });
    });
            
    it('should close', function(done) {
       server.close().then(function(){
         console.log("[TEST] MQTT DEMO Closed");
         done();});
    });
    
});
