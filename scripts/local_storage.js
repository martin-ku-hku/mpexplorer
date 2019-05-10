var app_data = {};
var mpxproj_data = {};
var py_data = {};
var init_done = false;


let AD_KEY_CXML = "cached_xml"
let AD_KEY_CPY = "cached_python"
let AD_KEY_IP = "ip_address"
let AD_KEY_SSID = "ssid"
let AD_KEY_WPWD = "wifipassword"
let AD_KEY_EDITOR_PREF = "editor_pref"
let AD_KEY_SYSTEM_PREF = "system_pref"
let AD_KEY_CXMLF = "current_xml_file"
let AD_KEY_CPYF = "current_py_file"
let AD_KEY_DE_PRO = "device_profiles"
let AD_KEY_CDEPRO = "current_device_mac"
let AD_KEY_PYTHONEDITING = "python_editing"


var eventHandlers = {};

function save_file_data(ext){
    if (!init_done) return;
    if (ext === "mpxproj"){
        localStorage.setItem("mpxproj_data", JSON.stringify(mpxproj_data));
    } else if (ext === "py"){
        localStorage.setItem("py_data", JSON.stringify(py_data));
    }
}

function save_app_data(){
    if (!init_done) return;
    localStorage.setItem("app_data", JSON.stringify(app_data));
}

function restore_webapp_data(){
    var ad = localStorage.getItem("app_data");
    var md = localStorage.getItem("mpxproj_data");
    var pd = localStorage.getItem("py_data");
    if (ad){
        app_data = JSON.parse(ad);
    } 
    if (md){
        mpxproj_data = JSON.parse(md);
    }
    if (pd){
        py_data = JSON.parse(pd);
    }
    restore_session(app_data);
    init_done = true;
}

eventHandlers['save_xml'] = (arg)=>{
    if (!init_done) {
        console.log("Rejected xml save");
        return;
    }
    app_data[AD_KEY_CXML] = arg["xml"];
    save_app_data();
};

eventHandlers['save_py_code'] = (arg)=>{
    if (!init_done) {
        console.log("Rejected py save");
        return;
      }
    
      app_data[AD_KEY_CPY] = arg["code"];
      save_app_data();
}

eventHandlers['save_ip_address'] = (arg)=>{
    app_data[AD_KEY_IP] = arg["ip"];
    save_app_data();
}


eventHandlers['save_editorPref'] = (arg)=>{
    app_data[AD_KEY_EDITOR_PREF] = arg["editor"];
    save_app_data();
}

eventHandlers['change_system'] = (arg)=>{
    app_data[AD_KEY_SYSTEM_PREF] = arg["system"];
    save_app_data();
}

eventHandlers['reload_app'] = (arg)=>{
    location.reload();
}


function file_exist(name, ext){
    var keys = ext === "mpxproj" ? Object.keys(mpxproj_data) : Object.keys(py_data);
    var match = false;
    for (var i = 0; i < keys.length; i++){
        if (keys[i] === name){
            match = true;
            break;
        }
    }
    return match;
}

eventHandlers['export_file'] = (arg)=>{
    let filename = arg.filename;
    var extname = arg.ext;
    if(extname == "xml"){
        extname = "mpxproj";
    }
    let content = arg.content;
    let override = arg.override;
    let location = extname === "mpxproj" ? mpxproj_data : py_data;
    var fname = filename;
    if (override){
        location[fname] = content;
    } else{
        var count = 0;
        while (file_exist(fname, extname)){
            count++;
            fname = filename + count;
        }
        location[fname] = content;
    }
    save_file_data(extname);
    if (extname == "mpxproj"){
        bootbox.alert('Blockly project ' + fname + ' is saved.');
        current_xml_file_did_change(fname);
      } else{
        bootbox.alert('Python project ' + fname + ' is saved.'); 
        current_py_file_did_change(fname);
      }
}

eventHandlers['open_file_list'] = (arg)=>{
    var ext = arg.filetype;
    if (ext === "xml"){
      ext = "mpxproj";
    }
    var location = ext === "mpxproj" ? mpxproj_data : py_data;
    var location_keys = Object.keys(location);
    if (location_keys.length != 0){
        var ioptions = [];
        for (var i = 0; i < location_keys.length; i++){
            ioptions[i] = {text: location_keys[i], value: location_keys[i]};
        }
        bootbox.prompt({
            title: "Select a project",
            inputType: 'select',
            inputOptions: ioptions,
            callback: function (result) {
                if (!result) return;
                if (ext === "mpxproj"){
                    load_block_file(location[result]);
                    current_xml_file_did_change(result);
                  } else{
                    load_code_file(location[result]);
                    current_py_file_did_change(result);
                  }
            }
        });
    } else{
        bootbox.alert("No projects have been saved.");
    }
    
}

eventHandlers['open_example'] = (arg)=>{
    let filename = arg.exampleid;
    var extension = arg.ext;
    if (extension === "xml"){
        extension = "mpxproj"
    }
    var example_path = '/projexamples/' + extension + '/' + filename + '.' + extension;    
    $.get(example_path, function(data, status){
        if (status === 'success'){
            if (extension === "mpxproj"){
                load_block_file(data);
                current_xml_file_did_change('');
                
              } else{
                load_code_file(data);
                current_py_file_did_change('');
              }
        }
    });
}

eventHandlers['import_external_file'] = (arg)=>{
    var data = arg.data;
    var ext = arg.ext;
    if (ext === "xml"){
        ext = "mpxproj"
    }
    if (ext === "mpxproj"){
        load_block_file(data);
        current_xml_file_did_change('');
        
      } else{
        load_code_file(data);
        current_py_file_did_change('');
    }
}

eventHandlers['new_file'] = (arg)=>{
    var ext = arg.filetype
    if (ext === "xml"){
      ext = "mpxproj"
    }
    if (ext === "mpxproj"){
      new_block_file();
      current_xml_file_did_change("");
    } else{
      new_py_file();
      current_py_file_did_change("");
    }
}

eventHandlers['update_current_xml_file'] = (arg)=>{
    app_data[AD_KEY_CXMLF] = arg["current_xml_file"];
    save_app_data();
}

eventHandlers['update_current_py_file'] = (arg)=>{
    app_data[AD_KEY_CPYF] = arg["current_py_file"];
    save_app_data();
}

eventHandlers['save_device_profile'] = (arg)=>{
    app_data[AD_KEY_DE_PRO] = arg["device_profiles"];
    save_app_data();
}

eventHandlers['change_device_profile'] = (arg)=>{
    app_data[AD_KEY_CDEPRO] = arg["current_device_mac"];
    save_app_data();
}

eventHandlers['share_file'] = (arg)=>{
    var filename = arg.fileName;
    var ext = arg.ext;
    if (ext === 'xml'){
        ext = 'mpxproj'
    }
    var location;
    if (ext === 'mpxproj'){
        location = mpxproj_data;
    } else{
        location = py_data;
    }

    if (location[filename]){
        var blob = new Blob([location[filename]], {
            type: "text/plain;charset=utf-8;",
        });
        saveAs(blob, filename + '.' + ext);
    }
    
}

eventHandlers['open_adafruit_io'] = (arg)=>{
    if (arg.url){
        let link = arg["url"]
        window.open(link, _blank);
    }
}


eventHandlers['save_sync_editor_pref'] = (arg)=>{
    if (arg.python_editing){
        app_data[AD_KEY_PYTHONEDITING] = arg["python_editing"];
        save_app_data();
    }
}

eventHandlers['delele_file'] = (arg)=>{
    var fileName = arg.fileName;
    if (fileName === "") {
        bootbox.alert("No file is opened.")
        return;
    }
    var ext = arg.ext;
    if (ext === "xml"){
        ext = "mpxproj"
    }
    
    bootbox.confirm("Delete " + (ext === "mpxproj" ? "Blockly" : "Python") + " project " + fileName + "?", function(result){ 
        if (result){
            if (!file_exist(fileName, ext)){
                return;
            } else{
                if (ext === "mpxproj"){
                    console.log(mpxproj_data);
                    current_xml_file_did_change("");
                } else{
                    delete py_data[fileName];
                    current_py_file_did_change("");
                }
                save_file_data(ext);
                console.log(mpxproj_data);
                bootbox.alert(fileName + " is deleted." );
            }
        } 
    });
    
}