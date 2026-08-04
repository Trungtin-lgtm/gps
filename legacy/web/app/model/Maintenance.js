
Ext.define('Traccar.model.Maintenance', {
    extend: 'Ext.data.Model',
    identifier: 'negative',

    fields: [{
        name: 'id',
        type: 'int'
    }, {
        name: 'name',
        type: 'string'
    }, {
        name: 'type',
        type: 'string'
    }, {
        name: 'start',
        type: 'float'
    }, {
        name: 'period',
        type: 'float'
    }, {
        name: 'attributes'
    }]
});
