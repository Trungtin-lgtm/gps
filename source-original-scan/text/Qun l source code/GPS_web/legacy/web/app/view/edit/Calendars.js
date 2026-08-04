
Ext.define('Traccar.view.edit.Calendars', {
    extend: 'Traccar.view.GridPanel',
    xtype: 'calendarsView',

    requires: [
        'Traccar.view.edit.CalendarsController',
        'Traccar.view.edit.Toolbar'
    ],

    controller: 'calendars',
    store: 'Calendars',

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
        }]
    }
});
