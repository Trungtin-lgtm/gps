
Ext.define('Traccar.model.Statistics', {
    extend: 'Ext.data.Model',
    identifier: 'negative',

    fields: [{
        name: 'id',
        type: 'int'
    }, {
        name: 'captureTime',
        type: 'date',
        dateFormat: 'c'
    }, {
        name: 'activeUsers',
        type: 'int'
    }, {
        name: 'activeDevices',
        type: 'int'
    }, {
        name: 'requests',
        type: 'int'
    }, {
        name: 'messagesReceived',
        type: 'int'
    }, {
        name: 'messagesStored',
        type: 'int'
    }, {
        name: 'mailSent',
        type: 'int'
    }, {
        name: 'smsSent',
        type: 'int'
    }, {
        name: 'geocoderRequests',
        type: 'int'
    }, {
        name: 'geolocationRequests',
        type: 'int'
    }, {
        name: 'attributes'
    }]
});
