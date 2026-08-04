

Ext.define('Traccar.store.Events', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Event',

    trackRemoved: false,

    proxy: {
        type: 'rest',
        url: 'api/events'
    }
});
