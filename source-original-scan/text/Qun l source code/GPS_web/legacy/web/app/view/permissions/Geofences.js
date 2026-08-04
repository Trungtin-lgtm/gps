
Ext.define('Traccar.view.permissions.Geofences', {
    extend: 'Traccar.view.permissions.Base',
    xtype: 'linkGeofencesView',

    columns: {
        items: [{
            text: Strings.sharedName,
            dataIndex: 'name',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            filter: 'string'
        }, {
            text: Strings.sharedCalendar,
            dataIndex: 'calendarId',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            hidden: true,
            filter: {
                type: 'list',
                labelField: 'name',
                store: 'AllCalendars'
            },
            renderer: Traccar.AttributeFormatter.getFormatter('calendarId')
        }]
    }
});
