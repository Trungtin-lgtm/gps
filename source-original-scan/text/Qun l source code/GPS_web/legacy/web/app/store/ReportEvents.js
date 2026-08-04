

Ext.define('Traccar.store.ReportEvents', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.Event',

    proxy: {
        type: 'rest',
        url: 'api/reports/events',
        timeout: Traccar.Style.reportTimeout,
        headers: {
            'Accept': 'application/json'
        },
        listeners: {
            exception: function (proxy, exception) {
                Traccar.app.showError(exception);
            }
        }
    }
});
