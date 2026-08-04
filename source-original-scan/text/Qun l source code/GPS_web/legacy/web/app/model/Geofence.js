
Ext.define('Traccar.model.Geofence', {
    extend: 'Ext.data.Model',
    identifier: 'negative',

    fields: [{
        name: 'id',
        type: 'int'
    }, {
        name: 'name',
        type: 'string'
    }, {
        name: 'description',
        type: 'string'
    }, {
        name: 'area',
        type: 'string'
    }, {
        name: 'calendarId',
        type: 'int'
    }, {
        name: 'attributes'
    }]
});
