
Ext.define('Traccar.model.Command', {
    extend: 'Ext.data.Model',
    identifier: 'negative',

    fields: [{
        name: 'id',
        type: 'int'
    }, {
        name: 'description',
        type: 'string'
    }, {
        name: 'deviceId',
        type: 'int'
    }, {
        name: 'type',
        type: 'string'
    }, {
        name: 'textChannel',
        type: 'boolean'
    }, {
        name: 'attributes'
    }]
});
