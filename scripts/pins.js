Blockly.defineBlocksWithJsonArray([
    {
        "type": "create_digital_out",
        "message0": "Create digital pin %1 for %2 %3 at GPIO %4",
        "args0": [
          {
            "type": "field_variable",
            "name": "pinvar",
            "variable": "pin1"
          },
          {
            "type": "field_dropdown",
            "name": "direction",
            "options": [
              [
                "input",
                "input"
              ],
              [
                "output",
                "output"
              ]
            ]
          },
          {
            "type": "input_dummy"
          },
          {
            "type": "input_value",
            "name": "pinnumber",
            "check": "Number",
            "align": "RIGHT"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 345,
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "digital_read_pin",
        "message0": "digital read pin %1",
        "args0": [
          {
            "type": "field_variable",
            "name": "pinvar",
            "variable": "pin1"
          }
        ],
        "output": null,
        "colour": 345,
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "digital_write_pin",
        "message0": "digital write pin %1 to %2",
        "args0": [
          {
            "type": "field_variable",
            "name": "pinvar",
            "variable": "pin1"
          },
          {
            "type": "field_dropdown",
            "name": "value",
            "options": [
              [
                "0",
                "0"
              ],
              [
                "1",
                "1"
              ]
            ]
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 345,
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "create_adc",
        "message0": "Create ADC %1",
        "args0": [
          {
            "type": "field_variable",
            "name": "adcvar",
            "variable": "adc1"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 345,
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "read_adc",
        "message0": "analog read from %1",
        "args0": [
          {
            "type": "field_variable",
            "name": "adcvar",
            "variable": "adc1"
          }
        ],
        "output": null,
        "colour": 345,
        "tooltip": "",
        "helpUrl": ""
      },
      {
        "type": "create_pwm_pin",
        "message0": "Create PWM pin %1 %2 on GPIO %3 at frequency %4",
        "args0": [
          {
            "type": "field_variable",
            "name": "pwmvar",
            "variable": "pwm1"
          },
          {
            "type": "input_dummy"
          },
          {
            "type": "input_value",
            "name": "pinnumber",
            "check": "Number",
            "align": "RIGHT"
          },
          {
            "type": "input_value",
            "name": "freq",
            "check": "Number",
            "align": "RIGHT"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 345,
        "tooltip": "",
        "helpUrl": ""
      }, 
      {
        "type": "analog_write",
        "message0": "PWM %1 %2 analog write %3",
        "args0": [
          {
            "type": "field_variable",
            "name": "pwmvar",
            "variable": "pwm1"
          },
          {
            "type": "input_dummy"
          },
          {
            "type": "input_value",
            "name": "duty",
            "check": "Number",
            "align": "RIGHT"
          }
        ],
        "previousStatement": null,
        "nextStatement": null,
        "colour": 345,
        "tooltip": "",
        "helpUrl": ""
      }
]);


Blockly.Python['create_digital_out'] = function(block) {
    var variable_pinvar = Blockly.Python.variableDB_.getName(block.getFieldValue('pinvar'), Blockly.Variables.NAME_TYPE);
    var dropdown_direction = block.getFieldValue('direction');
    var value_pinnumber = Blockly.Python.valueToCode(block, 'pinnumber', Blockly.Python.ORDER_ATOMIC);
    // TODO: Assemble Python into code variable.
    Blockly.Python.provideFunction_(
        'import_pin', ['from machine import Pin']);
    var dir = '';
    switch(dropdown_direction){
        case 'input':
            dir = 'Pin.IN';
            break;
        case 'output':
            dir = 'Pin.OUT';
            break;
        default:
            break;
    }
    var code = variable_pinvar + ' = Pin(' + value_pinnumber + ', ' + dir + ')\n';
    return code;
  };

  Blockly.Python['digital_read_pin'] = function(block) {
    var variable_pinvar = Blockly.Python.variableDB_.getName(block.getFieldValue('pinvar'), Blockly.Variables.NAME_TYPE);
    // TODO: Assemble Python into code variable.
    Blockly.Python.provideFunction_(
        'import_pin', ['from machine import Pin']);
    var code = variable_pinvar + '.value()';
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.Python.ORDER_ATOMIC];
  };

  Blockly.Python['digital_write_pin'] = function(block) {
    var variable_pinvar = Blockly.Python.variableDB_.getName(block.getFieldValue('pinvar'), Blockly.Variables.NAME_TYPE);
    var dropdown_value = block.getFieldValue('value');
    // TODO: Assemble Python into code variable.
    Blockly.Python.provideFunction_(
        'import_pin', ['from machine import Pin']);
    var code = variable_pinvar + '.value(' + dropdown_value  + ')\n';
    return code;
  };

  Blockly.Python['create_adc'] = function(block) {
    var variable_adcvar = Blockly.Python.variableDB_.getName(block.getFieldValue('adcvar'), Blockly.Variables.NAME_TYPE);
    // TODO: Assemble Python into code variable.
    Blockly.Python.provideFunction_(
        'import_adc', ['from machine import ADC']);
    var code = variable_adcvar + ' = ADC(0)\n';
    return code;
  };

  Blockly.Python['read_adc'] = function(block) {
    var variable_adcvar = Blockly.Python.variableDB_.getName(block.getFieldValue('adcvar'), Blockly.Variables.NAME_TYPE);
    // TODO: Assemble Python into code variable.
    Blockly.Python.provideFunction_(
        'import_adc', ['from machine import ADC']);
    var code = variable_adcvar + '.read()';
    // TODO: Change ORDER_NONE to the correct strength.
    return [code, Blockly.Python.ORDER_ATOMIC];
  };

  Blockly.Python['create_pwm_pin'] = function(block) {
    var variable_pwmvar = Blockly.Python.variableDB_.getName(block.getFieldValue('pwmvar'), Blockly.Variables.NAME_TYPE);
    var value_pinnumber = Blockly.Python.valueToCode(block, 'pinnumber', Blockly.Python.ORDER_ATOMIC);
    var value_freq = Blockly.Python.valueToCode(block, 'freq', Blockly.Python.ORDER_ATOMIC);
    // TODO: Assemble Python into code variable.
    Blockly.Python.provideFunction_(
        'import_pin', ['from machine import Pin']);
    Blockly.Python.provideFunction_(
        'import_pwm', ['from machine import PWM']);
    var code = variable_pwmvar + ' = PWM(Pin(' + value_pinnumber + '), ' +  value_freq + ')\n';
    return code;
  };

  Blockly.Python['analog_write'] = function(block) {
    var variable_pwmvar = Blockly.Python.variableDB_.getName(block.getFieldValue('pwmvar'), Blockly.Variables.NAME_TYPE);
    var value_duty = Blockly.Python.valueToCode(block, 'duty', Blockly.Python.ORDER_ATOMIC);
    // TODO: Assemble Python into code variable.
    var code = variable_pwmvar + '.duty(' + value_duty + ')\n';
    return code;
  };