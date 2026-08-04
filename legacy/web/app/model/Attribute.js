
Ext.define('Traccar.model.Attribute', {
    extend: 'Ext.data.Model',

    fields: [{
        name: 'priority',
        type: 'int'
    }, {
        name: 'name',
        type: 'string'
    }, {
        name: 'value'
    }, {
        name: 'attribute',
        type: 'string'
    }]
});
