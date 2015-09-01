/*
 * Copyright (c) 2015 Limerun Project Contributors
 * Portions Copyright (c) 2015 Internet of Protocols Assocation (IOPA)
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
 
const iopa = require('iopa')
    , Promise = require('bluebird')
    , util = require('util')
    , Events = require('events')
    , mqtt = require('../index.js');
    
var should = require('should');

var numberConnections = 0;

describe('#MQTT Server()', function() {
  
  var server, mqttClient;
  var events = new Events.EventEmitter();
  var sessionContextDemo;
  
  before(function(done){
     var appServer = new iopa.App();
      
      appServer.use(function(context, next){
       
        if (["CONNACK", "PINGRESP"].indexOf(context.response["iopa.Method"]) >=0)
          context.response["iopa.Body"].end();

    
          if (["SUBACK"].indexOf(context.response["iopa.Method"]) >=0)
            {
              context.response["mqtt.Granted"] =[0,1,2,128];
              context.response["iopa.Body"].write("");
            }
    
          if (["CONNECT"].indexOf(context["iopa.Method"]) >=0)
                sessionContextDemo = context["server.ChannelContext"];
               
         events.emit("data", context);  
         return next();
          });
          
        var appClient = new iopa.App();
        
        appClient.use(function(context, next){
          return next();
            });
          
      var serverOptions = {};
      server = mqtt.createServer(serverOptions,appServer.build(), appClient.build());
      
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
        var context = mqttClient["server.CreateRequest"]("/", "CONNECT"); 
        context["mqtt.Clean"] = false;
        context["mqtt.ClientID"] = "CLIENTID-1";
        return context.send().then(function(response){
           numberConnections ++;
            response["iopa.Method"].should.equal('CONNACK');
           events.emit("CLIENT-CONNACK");
           done();
           });
    });
    
    it('should subscribe via MQTT', function(done) {
          var context = mqttClient["server.CreateRequest"]("/projector", "SUBSCRIBE");
          context.send().then(function(response){
             response["iopa.Method"].should.equal('SUBACK');
             var context = sessionContextDemo["server.CreateRequest"]("/projector", "PUBLISH");
             context["iopa.Body"].end(new Buffer("Hello World"));
             done();
           });
    });
            
    it('should close', function(done) {
       server.close().then(function(){
         server.log.info("[TEST] MQTT DEMO Closed");
         done();});
    });
    
});
