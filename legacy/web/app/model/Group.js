
Ext.define('Traccar.model.Group', {
    extend: 'Ext.data.Model',
    identifier: 'negative',

    fields: [{
        name: 'id',
        type: 'int'
    }, {
        name: 'name',
        type: 'string'
    }, {
        name: 'groupId',
        type: 'int'
    }, {
        name: 'attributes'
    }]
});
