
Ext.define('Traccar.view.dialog.SendCommand', {
    extend: 'Traccar.view.dialog.Base',

    requires: [
        'Traccar.view.dialog.SendCommandController'
    ],

    controller: 'sendCommand',
    title: Strings.commandTitle,

    items: [{
        xtype: 'combobox',
        reference: 'commandsComboBox',
        fieldLabel: Strings.deviceCommand,
        displayField: 'description',
        valueField: 'id',
        store: 'DeviceCommands',
        queryMode: 'local',
        editable: false,
        allowBlank: false,
        listeners: {
            select: 'onCommandSelect'
        }
    }, {
        xtype: 'form',
        listeners: {
            validitychange: 'onValidityChange'
        },
        items: [{
            xtype: 'fieldset',
            reference: 'newCommandFields',
            disabled: true,
            items: [{
                xtype: 'checkboxfield',
                name: 'textChannel',
                reference: 'textChannelCheckBox',
                inputValue: true,
                uncheckedValue: false,
                fieldLabel: Strings.commandSendSms,
                listeners: {
                    change: 'onTextChannelChange'
                }
            }, {
                xtype: 'combobox',
                name: 'type',
                reference: 'commandType',
                fieldLabel: Strings.sharedType,
                store: 'CommandTypes',
                displayField: 'name',
                valueField: 'type',
                editable: false,
                allowBlank: false,
                listeners: {
                    change: 'onTypeChange'
                }
            }, {
                xtype: 'fieldcontainer',
                reference: 'parameters'
            }]
        }]
    }],

    buttons: [{
        xtype: 'tbfill'
    }, {
        glyph: 'xf093@FontAwesome',
        tooltip: Strings.sharedSend,
        tooltipType: 'title',
        minWidth: 0,
        disabled: true,
        reference: 'sendButton',
        handler: 'onSendClick'
    }, {
        glyph: 'xf00d@FontAwesome',
        tooltip: Strings.sharedCancel,
        tooltipType: 'title',
        minWidth: 0,
        handler: 'closeView'
    }]
});
