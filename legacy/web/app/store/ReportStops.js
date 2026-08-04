

Ext.define('Traccar.store.ReportStops', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.ReportStop',

    proxy: {
        type: 'rest',
        url: 'api/reports/stops',
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
