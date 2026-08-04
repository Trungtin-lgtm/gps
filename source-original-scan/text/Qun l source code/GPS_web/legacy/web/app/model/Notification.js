

Ext.define('Traccar.model.Notification', {
    extend: 'Ext.data.Model',
    identifier: 'negative',

    fields: [{
        name: 'id',
        type: 'int'
    }, {
        name: 'type',
        type: 'string'
    }, {
        name: 'always',
        type: 'bool'
    }, {
        name: 'attributes'
    }, {
        name: 'notificators',
        type: 'string'
    }, {
        name: 'calendarId',
        type: 'int'
    }]
});
