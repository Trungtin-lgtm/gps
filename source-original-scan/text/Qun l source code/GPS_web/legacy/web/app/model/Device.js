
Ext.define('Traccar.model.Device', {
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
        name: 'phone',
        type: 'string',
        allowNull: true
    }, {
        name: 'model',
        type: 'string',
        allowNull: true
    }, {
        name: 'contact',
        type: 'string',
        allowNull: true
    }, {
        name: 'category',
        type: 'string',
        allowNull: true
    }, {
        name: 'status',
        type: 'string',
        allowNull: true
    }, {
        name: 'lastUpdate',
        type: 'date',
        dateFormat: 'c'
    }, {
        name: 'groupId',
        type: 'int'
    }, {
        name: 'disabled',
        type: 'boolean'
    }, {
        name: 'attributes'
    }]
});
