Blockly.defineBlocksWithJsonArray(
    [    {
      "type": "sleep",
      "message0": "sleep for (s) %1",
      "args0": [
        {
          "type": "input_value",
          "name": "time_in_ms",
          "check": "Number"
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "colour": 135,
      "tooltip": "",
      "helpUrl": ""
    },
          {
            "type": "sleep_in_ms",
            "message0": "sleep for (ms) %1",
            "args0": [
              {
                "type": "input_value",
                "name": "time_in_ms",
                "check": "Number"
              }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 135,
            "tooltip": "",
            "helpUrl": ""
          },
          
          
          {
            "type": "to_number",
            "message0": "to integer %1",
            "args0": [
              {
                "type": "input_value",
                "name": "object"
              }
            ],
            "output": null,
            "colour": 230,
            "tooltip": "",
            "helpUrl": ""
          },
          
          {
            "type": "math_change",
            "message0": "change %1 %2 by %3",
            "args0": [
              {
                "type": "field_variable",
                "name": "VAR",
                "variable": "item"
              },
              {
                "type": "input_dummy"
              },
              {
                "type": "input_value",
                "name": "DELTA",
                "check": "Number",
                "align": "RIGHT"
              }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 230,
            "tooltip": "",
            "helpUrl": ""
          },
          
          {
            "type": "text_to_int",
            "message0": "to int %1",
            "args0": [
              {
                "type": "input_value",
                "name": "text",
                "check": "String"
              }
            ],
            "output": "Number",
            "colour": 230,
            "tooltip": "",
            "helpUrl": ""
          },
          {
            "type": "text_to_float",
            "message0": "to float %1",
            "args0": [
              {
                "type": "input_value",
                "name": "text",
                "check": "String"
              }
            ],
            "output": "Number",
            "colour": 230,
            "tooltip": "",
            "helpUrl": ""
          },
          {
            "type": "expo",
            "message0": "base %1 to the power of %2",
            "args0": [
              {
                "type": "input_value",
                "name": "base",
                "check": "Number",
                "align": "RIGHT"
              },
              {
                "type": "input_value",
                "name": "power",
                "check": "Number"
              }
            ],
            "output": null,
            "colour": 230,
            "tooltip": "",
            "helpUrl": ""
          },
          {
            "type": "log",
            "message0": "log %1 of base %2",
            "args0": [
              {
                "type": "input_value",
                "name": "val",
                "check": "Number",
                "align": "RIGHT"
              },
              {
                "type": "input_value",
                "name": "base",
                "check": "Number"
              }
            ],
            "output": null,
            "colour": 230,
            "tooltip": "",
            "helpUrl": ""
          },
                 
          

    ]
);



  Blockly.Python['sleep'] = function(block) {
    var value_time_in_ms = Blockly.Python.valueToCode(block, 'time_in_ms', Blockly.Python.ORDER_ATOMIC);
    // TODO: Assemble Python into code variable.
    Blockly.Python.provideFunction_(
        'import_modul_time', ['import time']);
    var code = 'time.sleep(' + value_time_in_ms + ')\n';
    return code;
  };

  Blockly.Python['sleep_in_ms'] = function(block) {
    var value_time_in_ms = Blockly.Python.valueToCode(block, 'time_in_ms', Blockly.Python.ORDER_ATOMIC);
    // TODO: Assemble Python into code variable.
    Blockly.Python.provideFunction_(
        'import_modul_time', ['import time']);
    var code = 'time.sleep_ms(' + value_time_in_ms + ')\n';
    return code;
  };

  

  Blockly.Python['to_number'] = function(block) {
    var value_object = Blockly.Python.valueToCode(block, 'object', Blockly.Python.ORDER_ATOMIC);
    // TODO: Assemble Python into code variable.
    var code = 'int(' + value_object + ')';
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.Python.ORDER_ATOMIC];
  };

 

  Blockly.Python['math_change'] = function(block){
    var _var = block.getFieldValue('VAR');
    var name = Blockly.Python.variableDB_.getName(_var, Blockly.Variables.NAME_TYPE);
    var variable_DELTA = Blockly.Python.valueToCode(block, 'DELTA', Blockly.Python.ORDER_ATOMIC);
    var code =  name + ' += '  +  variable_DELTA + '\n';
    return code;
  }

  

  Blockly.Python['text_to_int'] = function(block) {
    var value_text = Blockly.Python.valueToCode(block, 'text', Blockly.Python.ORDER_ATOMIC);
    // TODO: Assemble Python into code variable.
    var code = 'int(' + value_text + ')';
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.Python.ORDER_ATOMIC];
  };

  Blockly.Python['text_to_float'] = function(block) {
    var value_text = Blockly.Python.valueToCode(block, 'text', Blockly.Python.ORDER_ATOMIC);
    // TODO: Assemble Python into code variable.
    var code = 'float(' + value_text + ')';
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.Python.ORDER_ATOMIC];
  };


  Blockly.Python['expo'] = function(block) {
    var value_base = Blockly.Python.valueToCode(block, 'base', Blockly.Python.ORDER_ATOMIC);
    var value_power = Blockly.Python.valueToCode(block, 'power', Blockly.Python.ORDER_ATOMIC);
    // TODO: Assemble Python into code variable.
    Blockly.Python.provideFunction_(
      'import_math', ['import math']);
    var code = 'math.pow(' + value_base + ', ' + value_power + ')';
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.Python.ORDER_ATOMIC];
  };

  Blockly.Python['log'] = function(block) {
    var value_val = Blockly.Python.valueToCode(block, 'val', Blockly.Python.ORDER_ATOMIC);
    var value_base= Blockly.Python.valueToCode(block, 'base', Blockly.Python.ORDER_ATOMIC);
    // TODO: Assemble Python into code variable.
    Blockly.Python.provideFunction_(
      'import_math', ['import math']);
    var code = 'math.log(' + value_val + ', ' + value_base + ')';
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.Python.ORDER_ATOMIC];
  };

  