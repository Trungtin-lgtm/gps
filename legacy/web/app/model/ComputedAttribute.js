
Ext.define('Traccar.model.ComputedAttribute', {
    extend: 'Ext.data.Model',
    identifier: 'negative',

    fields: [{
        name: 'id',
        type: 'int'
    }, {
        name: 'description',
        type: 'string'
    }, {
        name: 'type',
        type: 'string'
    }, {
        name: 'attribute',
        type: 'string'
    }, {
        name: 'expression',
        type: 'string'
    }]
});
