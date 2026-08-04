
Ext.define('Traccar.view.permissions.Calendars', {
    extend: 'Traccar.view.permissions.Base',
    xtype: 'linkCalendarsView',

    columns: {
        items: [{
            text: Strings.sharedName,
            dataIndex: 'name',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            filter: 'string'
        }]
    }
});
