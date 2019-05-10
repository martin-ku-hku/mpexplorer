var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    mode: {name: "python",
               version: 3,
               singleLineStringErrors: false},
    lineNumbers: true,
    styleActiveLine: true,
    matchBrackets: true,
    indentUnit: 2
    });
  

  editor.setOption("theme", "monokai");
  editor.setOption("readOnly", "nocursor");
  editor.on("change", function() {
    workingCode_cm = editor.getValue();
    // For iOS 
    if (is_ios){
      webkit.messageHandlers.save_py_code.postMessage({code: workingCode_cm});
    }
    // For Electron
    if (is_electron){
      ipcRenderer.send('save_py_code', {code: workingCode_cm});
    }

    // For Web
    if (is_web){
      eventHandlers['save_py_code']({code: workingCode_cm});
    }

  });

  CodeMirror.on(window, "hashchange", function() {
    var theme = location.hash.slice(1);
    if (theme) { input.value = theme; selectTheme(); }
  });

function loadBlockToCode(){
    if(workingCode_cm === ""){
        workingCode_cm = workingCode;
    }
    editor.setValue(workingCode_cm);
}

function enableEditing(){
    var editor_msg = python_editing ? "Two editors will start synchronizing. Unsaved changes will be lost." : "Two editors will stop synchronizing.";
    bootbox.confirm(editor_msg, function(result){ 
      if(result){
        python_editing = !python_editing;
      }
      if (python_editing){
        editor.setOption("readOnly", false);
        $("#synceditorbtntext").html('  Start sync');
        $("#dropdownfilemenubtn").show();
      } else {
        new_py_file();
        current_py_file_did_change("");
        editor.setOption("readOnly", "nocursor");
        workingCode_cm = workingCode;
        loadBlockToCode();
        $("#synceditorbtntext").html('  Stop sync');
        $("#dropdownfilemenubtn").hide();
      }

      
      
      // For iOS 
      if (is_ios){
        webkit.messageHandlers.save_sync_editor_pref.postMessage({python_editing: python_editing});
      }
      // For Electron
      if (is_electron){
        ipcRenderer.send('save_sync_editor_pref', {python_editing: python_editing});
      }

      // For Web
      if (is_web){
        eventHandlers['save_sync_editor_pref']({python_editing: python_editing});
      }


    }); 
    
}

