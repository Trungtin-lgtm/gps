
Ext.define('Traccar.view.edit.Geofences', {
    extend: 'Traccar.view.GridPanel',
    xtype: 'geofencesView',

    requires: [
        'Traccar.view.edit.GeofencesController',
        'Traccar.view.edit.Toolbar'
    ],

    controller: 'geofences',
    store: 'Geofences',

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
            text: Strings.sharedDescription,
            dataIndex: 'description',
            filter: 'string'
        }, {
            text: Strings.sharedCalendar,
            dataIndex: 'calendarId',
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
