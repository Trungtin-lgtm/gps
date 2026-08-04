
Ext.define('Traccar.model.KnownAttribute', {
    extend: 'Ext.data.Model',
    idProperty: 'key',

    fields: [{
        name: 'key',
        type: 'string'
    }, {
        name: 'name',
        type: 'string'
    }, {
        name: 'valueType',
        type: 'string'
    }, {
        name: 'dataType',
        type: 'string'
    }]
});
