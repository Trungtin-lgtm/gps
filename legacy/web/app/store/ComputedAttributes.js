

Ext.define('Traccar.store.ComputedAttributes', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.ComputedAttribute',

    proxy: {
        type: 'rest',
        url: 'api/attributes/computed',
        writer: {
            writeAllFields: true
        }
    }
});
