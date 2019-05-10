let is_web = true;
let is_electron = false;
let is_ios = false;

// For Electron
var ipcRenderer = null;
if (is_electron){
    ipcRenderer = require('electron').ipcRenderer;
}

// webrepl
var term;
var ws;
var webrepl_pwd = '';
var connected = false;
var binary_state = 0;
var put_file_name = 'mpcode.py';
var put_file_data = null;
var get_file_name = null;
var get_file_data = null;

// upload mode
var upload_mode;
var upload_file_name;


// Device profiles
const SYSTEM_ESP8266 = "esp8266";
const SYSTEM_ESP32 = "esp32";
var currentSystem = SYSTEM_ESP8266;

function DeviceProfile(name, mac, ip, system, repl_pass){
    this.name = name;
    this.mac = mac;
    this.ip = ip;
    this.system = system;
    this.repl_pass = repl_pass;
}
var device_profiles;
var current_device_mac;


// Server ip address
const DEFAULT_IP_ADDRESS = '192.168.4.1';
var ip_address = '192.168.0.12'; 
var setup_mode = false;
var codeIsRunning = false;


web_repl_addr = ()=>{ // should allow users to set domain name as well
    var addr = "ws:" + (setup_mode ? DEFAULT_IP_ADDRESS : ip_address) + ":8266";
    return addr;
}

var webreplpwd = "";

// Blockly-editor related
var workingCode;
var workingCode_cm;
var workspace;
var xml_str;
var setup_exec_code;
var current_xml_file;
var current_py_file;


const EDITOR_BLOCKLY = "blockly";
const EDITOR_CODEMIRROR = "codemirror";

var currentEditor;
var python_editing = false;

var blockly_cat_border_width = '8px';
if (is_ios){
    blockly_cat_border_width = '9px';
}


// The function called whenever there are changes in the Blockly Editor
function myUpdateFunction(event) {
        Blockly.Python.addReservedWords(['code', 'headers']);
        workingCode = Blockly.Python.workspaceToCode(workspace);
        var code = document.createTextNode(workingCode);
        exportXML();
        // For iOS
        if (is_ios){
            webkit.messageHandlers.save_xml.postMessage({xml: xml_str});
        }
        // For Electron
        if (is_electron){
            ipcRenderer.send('save_xml',{xml: xml_str});
        }

        // For Web
        if (is_web){
            eventHandlers['save_xml']({xml: xml_str});
        }

        if (!python_editing){
            workingCode_cm = workingCode;
            loadBlockToCode();
        }        
}



function inject_blockly(){
    Blockly.inject('blocklyInDiv', {
        media: 'media/',
        css: true,
        toolbox: document.getElementById('toolbox'),
        zoom: {controls: true},
        horizontalLayout: true
      });

    Blockly.HSV_SATURATION = 1;
    Blockly.HSV_VALUE = 0.65;

    workspace = Blockly.getMainWorkspace();

       
    workspace.addChangeListener(myUpdateFunction);

    $(".blocklyTreeRow.blocklyHorizontalTree").each((index, element)=>{
        element.style.borderLeftWidth = blockly_cat_border_width;
    });

}


(function() {
    inject_blockly();
    

    // Add the terminal
    window.onload = function() {
        term = new Terminal({
          cols: 90,
          rows: 25,
          useStyle: true,
          screenKeys: true,
          cursorBlink: false
        });
        term.open(document.getElementById("term"));
      };

    document.getElementById('codeMirrorDiv').style.display = "none";
    $("#import_proj_file").change((e)=>{
        handle_import_external_file(e);
    });
    
    $("#blocktopybtn").hide();
    $("#uploadcodebtn").hide();
    workingCode_cm = "";
    current_xml_file = "";
    current_py_file = "";
    myUpdateFunction();
    currentEditor = EDITOR_BLOCKLY;
    upload_mode = false;
    device_profiles = [];
    current_device_mac = "";
    
    // For Electron
    if (is_electron){
        $("#sharebtn").hide();
    }

    // For Web
    if (is_web){
        $("#share-btn-text").html(" Download");
        restore_webapp_data();
    }

    // For iOS and Electron
    if (is_ios || is_electron){
        $("#delete-btn-li").hide();
        $("#import-btn-li").hide();
    }


})();


function button_click() {
    if (connected) {
        goodbyeworld();
        ws.close();
        connected = false;
        $("#connect_button").attr("class", "btn btn-default");
        $("#runbtnicon").attr("class", "fa fa-terminal");
        codeIsRunning = false; 
    } else {
        if (current_device_mac === "" && !setup_mode){
            upload_mode = false;
            bootbox.alert("No device is selected. Please change the configuration.");
        } else{
            connect(web_repl_addr());
            
        }
    }
}

function upload_code_to_device(){
    bootbox.prompt("Enter the name of the Python file. If it's called 'main', it will be executed automatically", function(name){ 
        if (name && name != ""){
            upload_file_name = name;
            upload_mode = true;
            button_click();
        }
    });
    

}

function prepare_for_connect() {
    // document.getElementById('url').disabled = false;
    // document.getElementById('button').value = "Connect";
}

function update_file_status(s) {
    // document.getElementById('file-status').innerHTML = s;
}

function connect(url) {
    ws = new WebSocket(url);
    ws.binaryType = 'arraybuffer';
    ws.onopen = function() {


        ws.onmessage = function(event) {
            if (event.data === "Password: "){
                console.log("You need to enter password");
                var enc = new TextEncoder()
                password = enc.encode(webrepl_pwd + "\n");
                ws.send(password);
            }

            if (!(event.data instanceof ArrayBuffer) && event.data.includes("Access denied")){
                bootbox.alert("Access denied");
            }

            if (!(event.data instanceof ArrayBuffer) && event.data.includes("WebREPL connected")){
                if (!upload_mode) $("#runbtnicon").attr("class", "fa fa-exchange");
                connected = true;
                ws.send('\r\x02'); // ctrl-B: enter friendly REPL
                ws.send('\x0D');
                // send_code();
                var sendingCode = proModeInUse()? workingCode_cm : workingCode;
                if (setup_mode) sendingCode = setup_exec_code;
                if (!upload_mode && sendingCode === ""){
                    button_click();
                } else{
                    send_code(sendingCode);
                }
            }


            if (event.data instanceof ArrayBuffer) {
                var data = new Uint8Array(event.data);
                switch (binary_state) {
                    case 11:
                        // first response for put
                        if (decode_resp(data) == 0) {
                            // send file data in chunks
                            for (var offset = 0; offset < put_file_data.length; offset += 1024) {
                                ws.send(put_file_data.slice(offset, offset + 1024));
                            }
                            binary_state = 12;
                        }
                        break;
                    case 12:
                        // final response for put
                        if (decode_resp(data) == 0) {
                            update_file_status('Sent ' + put_file_name + ', ' + put_file_data.length + ' bytes');
                            if (upload_mode){
                                upload_mode = false;
                                button_click();
                                alert( upload_file_name + ".py " + "is uploaded.");
                                upload_file_name = "";
                            } else{
                                execute_code();
                            }
                        } else {
                            update_file_status('Failed sending ' + put_file_name);
                        }
                        binary_state = 0;
                        break;

                    case 21:
                        // first response for get
                        if (decode_resp(data) == 0) {
                            binary_state = 22;
                            var rec = new Uint8Array(1);
                            rec[0] = 0;
                            ws.send(rec);
                        }
                        break;
                    case 22: {
                        // file data
                        var sz = data[0] | (data[1] << 8);
                        if (data.length == 2 + sz) {
                            // we assume that the data comes in single chunks
                            if (sz == 0) {
                                // end of file
                                binary_state = 23;
                            } else {
                                // accumulate incoming data to get_file_data
                                var new_buf = new Uint8Array(get_file_data.length + sz);
                                new_buf.set(get_file_data);
                                new_buf.set(data.slice(2), get_file_data.length);
                                get_file_data = new_buf;
                                update_file_status('Getting ' + get_file_name + ', ' + get_file_data.length + ' bytes');

                                var rec = new Uint8Array(1);
                                rec[0] = 0;
                                ws.send(rec);
                            }
                        } else {
                            binary_state = 0;
                        }
                        break;
                    }
                    case 23:
                        // final response
                        if (decode_resp(data) == 0) {
                            update_file_status('Got ' + get_file_name + ', ' + get_file_data.length + ' bytes');
                            saveAs(new Blob([get_file_data], {type: "application/octet-stream"}), get_file_name);
                        } else {
                            update_file_status('Failed getting ' + get_file_name);
                        }
                        binary_state = 0;
                        break;
                    case 31:
                        // first (and last) response for GET_VER
                        console.log('GET_VER', data);
                        binary_state = 0;
                        break;
                }
            }
            if (!(event.data instanceof ArrayBuffer)){
                term.write(event.data);
            }
            console.log(event.data);
        };
    };

    ws.onclose = function() {
        connected = false;
        prepare_for_connect();
    };
}

function decode_resp(data) {
    if (data[0] == 'W'.charCodeAt(0) && data[1] == 'B'.charCodeAt(0)) {
        var code = data[2] | (data[3] << 8);
        return code;
    } else {
        return -1;
    }
}

function switch_setup_mode(){
    setup_mode = $("#setupmodecheckbox").is(':checked');
}




function goodbyeworld(){
    ws.send('\r\x03'); // Ctrl + C, keyboard interrupt
    // ws.send('\r\x03\x03'); // Ctrl + C, keyboard interrupt twice
    // ws.send('\r\x01'); // Ctrl + A, raw repl
    ws.send('\x04'); // Ctrl + D, soft reset
    // ws.send('\r\x02'); // ctrl-B: enter friendly REPL
    console.log("Goodbye, World!");
    // ws.send('\r\x05'); // Ctrl + E, paste mode
    // var cmd = 'print("Goodbye, World!")\x0D';
    
    /** Work in paste mode */
    // var cmd1 = 'print("Goodbye, World!")\n';
    // var cmd2 = 'print("Hello, World!")\n';
    // var cmd = cmd1 + cmd2;
    // ws.send(cmd);
    /** Work in paste mode */
 
   
    // ws.send('\x04'); // End the paste mode
    // term.focus();
    // term.element.focus();
}



function proModeInUse(){
    return $("#editorcheckbox").is(":checked");
}

function toggleEditorWithButton(){
    var current = $("#editorcheckbox").prop('checked'); 
    $("#editorcheckbox").prop('checked', !current);
    toggleEditor();
}

function toggleEditor(){
    var x = document.getElementsByClassName("injectionDiv")[0];
    var y = document.getElementById("codeMirrorDiv");

    var q = document.getElementById("codePreview");

    if(!proModeInUse()){
        x.style.display = "block";
        y.style.display = "none";
        currentEditor = EDITOR_BLOCKLY;

        if (q) q.style.display = "block";
        $("#codeDiv").css("background-color","#f7f7f7");
        // $("#blocklyDiv").css("background-color", "#d1e0e0");
        $("#blocktopybtn").hide();
        $("#uploadcodebtn").hide();

        $("#editorbtntext").html('  Python');
        $("#codeprebtn").show();
        $("#blocklyInDiv").show();
        $("#dropdownfilemenubtn").show();
        
    } else{
        x.style.display = "none";
        y.style.display = "block";
        currentEditor = EDITOR_CODEMIRROR;
        if (q) q.style.display = "none";
        $("#codeDiv").css("background-color","#272822");
        $("#blocklyDiv").css("background-color", "#272822");
        $("#blocktopybtn").show();
        $("#uploadcodebtn").show();
        editor.refresh();
        $("#editorbtntext").html('  Block');
        $("#codeprebtn").hide();
        $("#blocklyInDiv").hide();
        if (python_editing){
            $("#dropdownfilemenubtn").show();
            $("#synceditorbtntext").html(' Start Sync');
        } else{
            $("#dropdownfilemenubtn").hide();
            $("#synceditorbtntext").html(' Stop Sync');
        }
    }
    
    // For iOS
    if (is_ios){
        webkit.messageHandlers.save_editorPref.postMessage({editor: currentEditor});
    }

    // For Electron
    if (is_electron){
        ipcRenderer.send('save_editorPref',{editor: currentEditor});
    }

    // For Web
    if (is_web){
        eventHandlers['save_editorPref']({editor: currentEditor});
    }
}


function exportXML(){
    var xml = Blockly.Xml.workspaceToDom(workspace);
    xml_str = Blockly.Xml.domToText(xml);
    // console.log(xml_str);
}

function importXML(){
    workspace.clear();
    if (xml_str != ''){
        var xml = Blockly.Xml.textToDom(xml_str);
        Blockly.Xml.domToWorkspace(xml, workspace);
    }
}


function put_file() {
    var dest_fname = upload_mode ? upload_file_name + '.py' : put_file_name;
    var dest_fsize = put_file_data.length;

    // WEBREPL_FILE = "<2sBBQLH64s"
    var rec = new Uint8Array(2 + 1 + 1 + 8 + 4 + 2 + 64);
    rec[0] = 'W'.charCodeAt(0);
    rec[1] = 'A'.charCodeAt(0);
    rec[2] = 1; // put
    rec[3] = 0;
    rec[4] = 0; rec[5] = 0; rec[6] = 0; rec[7] = 0; rec[8] = 0; rec[9] = 0; rec[10] = 0; rec[11] = 0;
    rec[12] = dest_fsize & 0xff; rec[13] = (dest_fsize >> 8) & 0xff; rec[14] = (dest_fsize >> 16) & 0xff; rec[15] = (dest_fsize >> 24) & 0xff;
    rec[16] = dest_fname.length & 0xff; rec[17] = (dest_fname.length >> 8) & 0xff;
    for (var i = 0; i < 64; ++i) {
        if (i < dest_fname.length) {
            rec[18 + i] = dest_fname.charCodeAt(i);
        } else {
            rec[18 + i] = 0;
        }
    }

    // initiate put
    binary_state = 11;
    update_file_status('Sending ' + dest_fname + '...');
    ws.send(rec);
}

function get_file() {
    var src_fname = document.getElementById('get_filename').value;

    // WEBREPL_FILE = "<2sBBQLH64s"
    var rec = new Uint8Array(2 + 1 + 1 + 8 + 4 + 2 + 64);
    rec[0] = 'W'.charCodeAt(0);
    rec[1] = 'A'.charCodeAt(0);
    rec[2] = 2; // get
    rec[3] = 0;
    rec[4] = 0; rec[5] = 0; rec[6] = 0; rec[7] = 0; rec[8] = 0; rec[9] = 0; rec[10] = 0; rec[11] = 0;
    rec[12] = 0; rec[13] = 0; rec[14] = 0; rec[15] = 0;
    rec[16] = src_fname.length & 0xff; rec[17] = (src_fname.length >> 8) & 0xff;
    for (var i = 0; i < 64; ++i) {
        if (i < src_fname.length) {
            rec[18 + i] = src_fname.charCodeAt(i);
        } else {
            rec[18 + i] = 0;
        }
    }

    // initiate get
    binary_state = 21;
    get_file_name = src_fname;
    get_file_data = new Uint8Array(0);
    update_file_status('Getting ' + get_file_name + '...');
    ws.send(rec);
}

function get_ver() {
    // WEBREPL_REQ_S = "<2sBBQLH64s"
    var rec = new Uint8Array(2 + 1 + 1 + 8 + 4 + 2 + 64);
    rec[0] = 'W'.charCodeAt(0);
    rec[1] = 'A'.charCodeAt(0);
    rec[2] = 3; // GET_VER
    // rest of "rec" is zero

    // initiate GET_VER
    binary_state = 31;
    ws.send(rec);
}


function send_code(code) {
        var enc = new TextEncoder();
        if (code === "") code = " ";
        put_file_data = enc.encode(code);
        put_file();
}

function execute_code(){
    if (!upload_mode){
        ws.send('\r\x03\x03'); // Ctrl + C, keyboard interrupt
        ws.send("try:");
        ws.send('\x0D');
        ws.send("import mpcode");
        ws.send('\x0D');
        ws.send('\x08');
        ws.send('except Exception as e:');
        ws.send('\x0D');
        // ws.send('import pinmap');
        ws.send('print(e)');
        ws.send('\x0D');
        ws.send('\x08');
        ws.send('\x0D');
        $("#runbtnicon").attr("class", "fa fa-exclamation-triangle");
        $("#connect_button").attr("class", "btn btn-warning");
        codeIsRunning = true; 
        
        if (!setup_mode){
            $("#runningModal").modal('show');
        }
    }
}



function restore_session(data){ // a dictionary containing all the information to be restored
    // Settings (Wifi (including current SSID for easy setup), ESP systems, preferences, IP address (i.e. call load_ip_address))
    // blockly xml (i.e. call load_block_file from the last session)
    // codemirror python code (i.e. call load_code_file from the last session)

    // For Electron
    if (is_electron){
        data = JSON.parse(data);
    }

    try{
        if("cached_xml" in data) xml_str = data.cached_xml;
        if("cached_python" in data) workingCode_cm = data.cached_python;
        if("ip_address" in data) ip_address = data.ip_address;
        if("ssid" in data) $("#ssid_input").val(data.ssid);
        if("editor_pref" in data) currentEditor = data.editor_pref;
        if("system_pref" in data) currentSystem = data.system_pref;
        if("current_xml_file" in data) current_xml_file = data.current_xml_file;
        if("current_py_file" in data) current_py_file = data.current_py_file;
        if("device_profiles" in data) device_profiles = data.device_profiles;
        if("current_device_mac" in data) current_device_mac = data.current_device_mac;
        if("python_editing" in data) python_editing = data.python_editing;

        // reload some components, like editors and device lists
        importXML();
        editor.setValue(workingCode_cm);
        load_device_profile(current_device_mac);
        refresh_device_list();

    } catch(err){
        console.log(err);
    }
}


function load_ip_address(ip){
    ip_address = ip;
    // For iOS
    if (is_ios){
        webkit.messageHandlers.save_ip_address.postMessage({ip: ip_address});
    }

    // For Electron
    if (is_electron){
        ipcRenderer.send('save_ip_address',{ip: ip_address});
    }

    // For Web
    if (is_web){
        eventHandlers['save_ip_address']({ip: ip_address});
    }
}

function load_device_profile(mac){
    if (mac != ""){
        var profile = null;
        for (var i = 0; i < device_profiles.length; i++){
            if (device_profiles[i].mac === mac){
                profile = device_profiles[i];
                break;
            }
        }
        
        if (profile){
            load_ip_address(profile.ip);
            change_system(profile.system);
            webrepl_pwd = profile.repl_pass;
            current_device_mac = profile.mac;
            $("#current_device_identity").html('Current device: ' + profile.name + ' (' + device_ssid_name(profile.mac) + ')');
            // For iOS
            if (is_ios){
                webkit.messageHandlers.change_device_profile.postMessage({current_device_mac: current_device_mac});
            }
            
            // For Electron
            if (is_electron){
                ipcRenderer.send('change_device_profile',{current_device_mac: current_device_mac});
            }

            // For Web
            if (is_web){
                eventHandlers['change_device_profile']({current_device_mac: current_device_mac});
            }
        }
    }
}


function remove_device_profile(mac){
    bootbox.confirm("Do you really want to remove this profile?", (r)=>{
        if(r){
            var d_index = device_profiles.findIndex(x=>x.mac === mac);
            if (d_index > -1){
                device_profiles.splice(d_index,1);
                if (mac === current_device_mac){
                    current_device_mac = "";
                    $("#current_device_identity").html('');
                }
                refresh_device_list();
                // For iOS
                if (is_ios){
                    webkit.messageHandlers.save_device_profile.postMessage({device_profiles: device_profiles});   
                    webkit.messageHandlers.change_device_profile.postMessage({current_device_mac: current_device_mac});
                }            
                // For Electron
                if (is_electron){
                    ipcRenderer.send('save_device_profile',{device_profiles: device_profiles});
                    ipcRenderer.send('change_device_profile',{current_device_mac: current_device_mac});
                }
    
                // For Web
                if (is_web){
                    eventHandlers['save_device_profile']({device_profiles: device_profiles});
                    eventHandlers['change_device_profile']({current_device_mac: current_device_mac});
                }
            }
        }
    });
    
}

function device_ssid_name(mac){
    var device_ssid = "micropython-";
        var device_mac_array = mac.split(':');
        for (var k = 3; k < device_mac_array.length; k++){
            device_ssid += device_mac_array[k];
        }
    return device_ssid;
}

function refresh_device_list(){
    $("#devicemenu").html('');
    for (var i = 0; i < device_profiles.length; i++){
        var device_ssid = device_ssid_name(device_profiles[i].mac);
        var o_tag = '<option value="' + device_profiles[i].mac  + '">' + device_profiles[i].name + ' ('  + device_profiles[i].ip + ', ' + /*device_profiles[i].mac*/ device_ssid + ')' + '</option>';
        $("#devicemenu").append(o_tag);
    }
}

function export_block_file(){
    
     var ebf_handler = (fname, xStr, wOpt)=>{
        if (fname){
            // For iOS 
            if (is_ios){
                webkit.messageHandlers.export_file.postMessage({filename: fname, content: xStr, ext: "xml", override: wOpt});
            }
            // For Electron
            if (is_electron){
                ipcRenderer.send('export_file',{filename: fname, content: xStr, ext: "xml", override: wOpt});
            }

            // For Web
            if (is_web){
                eventHandlers['export_file']({filename: fname, content: xStr, ext: "xml", override: wOpt});
            }
        }
     };
     if (current_xml_file != ""){
            ebf_handler(current_xml_file, xml_str, true);
            
     } else{
        // For iOS and Web
        if (is_ios || is_web){
            bootbox.prompt({
             title: "Enter file name",
             value: "my_mp_project",
             callback: (result)=>{
                 ebf_handler(result, xml_str, false);}
            });
        }

        // For Electron
        if (is_electron){
            ebf_handler("new_file",xml_str, false);
        }
     }
}

function export_py_file(){
    var epf_handler = (fname, pStr, wOpt)=>{
       if (fname){
           // For iOS 
           if (is_ios){
            webkit.messageHandlers.export_file.postMessage({filename: fname, content: pStr, ext: "py", override: wOpt});
           }
           // For Electron
           if (is_electron){
            ipcRenderer.send('export_file',{filename: fname, content: pStr, ext: "py", override: wOpt});
           }

           // For Web
           if (is_web){
               eventHandlers['export_file']({filename: fname, content: pStr, ext: "py", override: wOpt});
           }
       }
    };
    if (current_py_file != ""){
        epf_handler(current_py_file, workingCode_cm, true);
           
    } else{
        // For iOS and Web
        if (is_ios || is_web){
            bootbox.prompt({
            title: "Enter file name",
            value: "my_mp_project",
            callback: (result)=>{
                epf_handler(result, workingCode_cm, false);}
            });
        }
       // For Electron
       if (is_electron){
            epf_handler("new_file", workingCode_cm, false);      
       }
    }
}


function export_file(){
    var msg;
    var call;
    if (proModeInUse()){
        msg = current_py_file === "" ? 'Save the new Python project?' : 'Save Python project ' + current_py_file + ' ?';
        call = export_py_file;
    } else{
        msg = current_xml_file === "" ? 'Save the new Blockly project?' : 'Save Blockly project ' + current_xml_file + ' ?';
        call = export_block_file;
    }

    bootbox.confirm({
        message: msg,
        buttons: {
            confirm: {
                label: 'Yes',
                className: 'btn-success'
            },
            cancel: {
                label: 'No',
                className: 'btn-danger'
            }
        },
        callback: function (result) {
            if (result){
                call();
            }
        }
    });
}

function new_block_file(){
        current_xml_file_did_change("");
        workspace.clear();
}

function new_py_file(){
    current_py_file_did_change("");
    editor.setValue("");
}

function delete_file(){
    var fileName;
    var ext;
    if(!proModeInUse()){
        fileName = current_xml_file;
        ext = "xml";
    } else {
        fileName = current_py_file;
        ext = "py";
    }

    // For Web
    if (is_web){
        eventHandlers['delele_file']({fileName: fileName, ext: ext});
    }
}

function open_file_list(cmd){ 
    if (proModeInUse() && !python_editing){
        alert("Python editor is in sync with the Blockly editor.");
        return;
    }
    var f_handler = (a)=>{
        switch(a){
            case "cancel":
                console.log('Cancel button clicked');
                break;

            case "open":
            bootbox.confirm("Unsaved changes will be lost.", function(result){ 
                if(result){
                    var filetype = proModeInUse() ? "py" : "xml";
                    // For iOS
                    if (is_ios){
                        webkit.messageHandlers.open_file_list.postMessage({filetype : filetype});
                    }
                    // For Electron
                    if (is_electron){
                        ipcRenderer.send('open_file_list', {filetype : filetype});
                    }
    
                    // For Web
                    if (is_web){
                        eventHandlers['open_file_list']({filetype : filetype});
                    }
                }
                });
                break;

            case "open_example":
                bootbox.confirm("Unsaved changes will be lost.", function(result){ 
                    if(result){
                        var example_projects = proModeInUse() ? example_projects_python : example_projects_blockly;
                        var file_ext = proModeInUse() ? "py" : "xml";
                        bootbox.prompt({
                            title: "Examples",
                            inputType: 'select',
                            inputOptions: example_projects,
                            callback: function (result) {
                                if(result){
                                    // For iOS
                                    if (is_ios){
                                        webkit.messageHandlers.open_example.postMessage({exampleid : result, ext: file_ext});
                                    }
                                    // For Electron
                                    if (is_electron){
                                        ipcRenderer.send('open_example', {exampleid : result, ext: file_ext});
                                    }
        
                                    // For Web
                                    if (is_web){
                                        eventHandlers['open_example']({exampleid : result, ext: file_ext});
                                    }
                                }                    
                            }
                        });
                    }
                });
                
                break;

            case "new":
                bootbox.confirm("Unsaved changes will be lost.", function(result){ 
                    if (result){
                        var filetype = proModeInUse() ? "py" : "xml";
                        // For iOS
                        if (is_ios){
                            webkit.messageHandlers.new_file.postMessage({filetype : filetype});
                        }
                        // For Electron
                        if (is_electron){
                            ipcRenderer.send('new_file', {filetype : filetype});
                        }

                        // For Web
                        if (is_web){
                            eventHandlers['new_file']({filetype : filetype});
                        }
                    } 
                });
                
                break;
        }
    }
    var file_msg = "";
    if (proModeInUse()){
        if (current_py_file != ""){
            file_msg = " File " + current_py_file + " is currently opened.";
        }
    } else {
        if (current_xml_file != ""){
            file_msg = " File " + current_xml_file + " is currently opened.";
        }
    }

    f_handler(cmd);
    
}

function import_external(){
    bootbox.confirm("Unsaved changes will be lost.", (result)=>{
        if (result){
            $("#import_proj_file").trigger("click");
        }
    });
    
}

function handle_import_external_file(e){
    if (!e) return;
    var url = e.target.files[0];
    var fe = url.name.split('.')[1];
    var ee = proModeInUse() ? "py" : "mpxproj";
    console.log(fe);
    if (fe != ee){
        bootbox.alert("Please select a " + ee + " file.");
        return;
    }
    var fileReader = new FileReader();
    fileReader.onload = function () {
      var data = fileReader.result;  // data <-- in this var you have the file data in Base64 format
      var ext = proModeInUse() ? "py" : "xml";

      // For Web
      if (is_web){
        eventHandlers['import_external_file']({data: data, ext: ext});
      }
      
    };
    fileReader.readAsText(url);
    $("#import_proj_file").val("");
}

function current_xml_file_did_change(name){
    current_xml_file = name; // if a new, unsaved file is created, make this ""

    // For iOS
    if (is_ios){
        webkit.messageHandlers.update_current_xml_file.postMessage({current_xml_file: current_xml_file});  
    }

    // For Electron
    if (is_electron){
        ipcRenderer.send('update_current_xml_file',{current_xml_file: current_xml_file});
    }

    // For Web
    if (is_web){
        eventHandlers['update_current_xml_file']({current_xml_file: current_xml_file});
    }
}

function current_py_file_did_change(name){
    
    current_py_file = name; // if a new, unsaved file is created, make this ""

    // For iOS
    if (is_ios){
        webkit.messageHandlers.update_current_py_file.postMessage({current_py_file: current_py_file});  
    }

    // For Electron
    if (is_electron){
        ipcRenderer.send('update_current_py_file',{current_py_file: current_py_file});
    }

    // For Web
    if (is_web){
        eventHandlers['update_current_py_file']({current_py_file: current_py_file});
    }
}

function load_block_file(data){
        xml_str = data;
        workspace.clear();
        importXML();
}

function load_code_file(data){
    workingCode_cm = data;
    editor.setValue(workingCode_cm);
}

function change_system(system){ // For future support of ESP32
    currentSystem = system;
    // For iOS 
    if (is_ios){
        webkit.messageHandlers.change_system.postMessage({system: currentSystem});
    }

    // For Electron
    if (is_electron){
        ipcRenderer.send('change_system',{system: currentSystem});
    }

    // For Web
    if (is_web){
        eventHandlers['change_system']({system: currentSystem});
    }
}

function share_file(){
    if (proModeInUse() && !python_editing){
        alert("You need to stop syncing the editors and open the python file you want to share first.");
        return;
    }

    var ext = proModeInUse()? "py" : "xml";
    var fileName = proModeInUse()? current_py_file : current_xml_file;
    if (fileName != ""){
        // For iOS 
        if (is_ios){
            webkit.messageHandlers.share_file.postMessage({fileName: fileName, ext: ext});   
        }

        // For Electron
        if (is_electron){
            ipcRenderer.send('share_file', {fileName: fileName, ext: ext});
        }

        // For Web
        if (is_web){
            eventHandlers['share_file']({fileName: fileName, ext: ext});
        }

    } else{
        alert("You need to save the code first before you can share it.");
    }
}


function reloadapp(){
    var r = confirm("Unsaved change will be lost.");
    if (r){
        // For iOS 
        if (is_ios){
            webkit.messageHandlers.reload_app.postMessage({message: "reload web view"});
        }

        // For Electron
        if (is_electron){
            ipcRenderer.send('reload_app',{message: "reload web view"});
        }

        
        xml_strs = "";
        workingCode_cm = "";
        if(ws){
            ws.send('\r\x03\x03'); // Ctrl + C, keyboard interrupt
            ws.send("machine.reset()");
            ws.send('\x0D');
        }

        // For Web
        if (is_web){ // Restart ESP BEFORE reloading the page
            eventHandlers['reload_app']({message: "reload web view"});
        }
        
    }
    
}

function keyboard_interrupt(){
    if(ws){
        ws.send('\r\x03\x03'); // Ctrl + C, keyboard interrupt
    }
}