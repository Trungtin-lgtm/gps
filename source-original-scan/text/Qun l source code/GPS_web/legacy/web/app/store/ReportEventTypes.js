

Ext.define('Traccar.store.ReportEventTypes', {
    extend: 'Ext.data.Store',
    fields: ['type', 'name'],

    statics: {
        allEvents: 'allEvents'
    }
});
