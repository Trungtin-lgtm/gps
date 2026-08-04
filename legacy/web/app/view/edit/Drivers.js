

Ext.define('Traccar.view.edit.Drivers', {
    extend: 'Traccar.view.GridPanel',
    xtype: 'driversView',

    requires: [
        'Traccar.view.edit.DriversController',
        'Traccar.view.edit.Toolbar'
    ],

    controller: 'drivers',
    store: 'Drivers',

    tbar: {
        xtype: 'editToolbar'
    },

    listeners: {
        selectionchange: 'onSelectionChange'
    },

    columns: {
        defaults: {
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal
        },
        items: [{
            text: Strings.sharedName,
            dataIndex: 'name',
            filter: 'string'
        }, {
            text: Strings.deviceIdentifier,
            dataIndex: 'uniqueId',
            filter: 'string'
        }]
    }
});
