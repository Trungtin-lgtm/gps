

Ext.define('Traccar.view.dialog.Attribute', {
    extend: 'Traccar.view.dialog.Base',

    requires: [
        'Traccar.view.dialog.AttributeController',
        'Traccar.view.ColorPicker',
        'Traccar.view.CustomNumberField',
        'Traccar.view.UnescapedTextField'
    ],

    controller: 'attribute',
    title: Strings.sharedAttribute,

    items: {
        xtype: 'form',
        listeners: {
            validitychange: 'onValidityChange'
        },
        items: [{
            xtype: 'unescapedTextField',
            reference: 'nameTextField',
            name: 'name',
            allowBlank: false,
            fieldLabel: Strings.sharedName
        }, {
            xtype: 'textfield',
            name: 'value',
            reference: 'valueField',
            allowBlank: false,
            fieldLabel: Strings.stateValue
        }]
    },

    buttons: [{
        glyph: 'xf00c@FontAwesome',
        reference: 'saveButton',
        tooltip: Strings.sharedSave,
        tooltipType: 'title',
        minWidth: 0,
        handler: 'onSaveClick'
    }, {
        glyph: 'xf00d@FontAwesome',
        tooltip: Strings.sharedCancel,
        tooltipType: 'title',
        minWidth: 0,
        handler: 'closeView'
    }]
});
