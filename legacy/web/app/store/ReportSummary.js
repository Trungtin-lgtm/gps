

Ext.define('Traccar.store.ReportSummary', {
    extend: 'Ext.data.Store',
    model: 'Traccar.model.ReportSummary',

    proxy: {
        type: 'rest',
        url: 'api/reports/summary',
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
