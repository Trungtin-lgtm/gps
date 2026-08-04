
Ext.define('Traccar.store.AttributeValueTypes', {
    extend: 'Ext.data.Store',
    fields: ['id', 'name'],
    proxy: 'memory',

    data: [{
        id: 'string',
        name: Strings.sharedTypeString
    }, {
        id: 'number',
        name: Strings.sharedTypeNumber
    }, {
        id: 'boolean',
        name: Strings.sharedTypeBoolean
    }]
});
