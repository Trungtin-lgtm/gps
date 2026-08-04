

Ext.define('Traccar.view.dialog.Driver', {
    extend: 'Traccar.view.dialog.BaseEdit',

    requires: [
        'Traccar.view.UnescapedTextField'
    ],

    title: Strings.sharedDriver,

    items: {
        xtype: 'form',
        items: [{
            xtype: 'fieldset',
            title: Strings.sharedRequired,
            items: [{
                xtype: 'unescapedTextField',
                name: 'name',
                fieldLabel: Strings.sharedName,
                allowBlank: false
            }, {
                xtype: 'unescapedTextField',
                name: 'uniqueId',
                fieldLabel: Strings.deviceIdentifier,
                allowBlank: false
            }]
        }]
    }
});
