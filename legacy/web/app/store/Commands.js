

Ext.define('Traccar.store.Commands', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Command',

    proxy: {
        type: 'rest',
        url: 'api/commands',
        writer: {
            writeAllFields: true
        }
    }
});
