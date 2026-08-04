
Ext.define('Traccar.view.dialog.Group', {
    extend: 'Traccar.view.dialog.BaseEdit',

    requires: [
        'Traccar.view.ClearableComboBox',
        'Traccar.view.UnescapedTextField'
    ],

    title: Strings.groupDialog,

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
            }]
        }, {
            xtype: 'fieldset',
            title: Strings.sharedExtra,
            collapsible: true,
            collapsed: true,
            items: [{
                xtype: 'clearableComboBox',
                name: 'groupId',
                fieldLabel: Strings.groupParent,
                store: 'Groups',
                queryMode: 'local',
                displayField: 'name',
                valueField: 'id'
            }]
        }]
    }
});
