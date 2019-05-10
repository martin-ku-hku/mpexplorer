function load_test_device(){
  var ip = "192.168.0.12";
  bootbox.prompt({
    title: "IP address",
    value: "192.168.0.12",
    callback: function(ip_addr){ 
     if (ip_addr){
        // ip = ip_addr;
        bootbox.prompt({
        title: "WebRepl password",
        inputType: 'password',
        value: "1234",
        callback: function (pwd) {
              var mac = 'PROFILE' + Math.floor(Math.random() * 1000000);
              var sys = "esp8266";
            
              var new_profile = new DeviceProfile(mac, mac, ip_addr, sys, pwd);
              device_profiles.push(new_profile);
              refresh_device_list();
              load_device_profile(mac);
      
              // For iOS 
              if (is_ios){
                webkit.messageHandlers.save_device_profile.postMessage({device_profiles: device_profiles});
              }
              
              // For Electron
              if (is_electron){
                ipcRenderer.send('save_device_profile',{device_profiles: device_profiles});
              }

              // For Web
              if (is_web){
                eventHandlers['save_device_profile']({device_profiles: device_profiles});
              }
          }
      });
        
     }
   
  }});
  
}