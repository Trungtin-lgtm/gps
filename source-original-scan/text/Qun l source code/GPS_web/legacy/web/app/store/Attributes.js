
Ext.define('Traccar.store.Attributes', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Attribute',

    sorters: [{
        property: 'priority'
    }]
});
