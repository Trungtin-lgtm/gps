
Ext.define('Traccar.model.Driver', {
    extend: 'Ext.data.Model',
    identifier: 'negative',

    fields: [{
        name: 'id',
        type: 'int'
    }, {
        name: 'name',
        type: 'string'
    }, {
        name: 'uniqueId',
        type: 'string'
    }, {
        name: 'attributes'
    }]
});
