

Ext.define('Traccar.store.AllComputedAttributes', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.ComputedAttribute',

    proxy: {
        type: 'rest',
        url: 'api/attributes/computed',
        extraParams: {
            all: true
        }
    }
});
