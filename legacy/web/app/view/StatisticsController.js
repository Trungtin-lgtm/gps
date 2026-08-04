

Ext.define('Traccar.view.StatisticsController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.statistics',

    onShowClick: function () {
        Ext.getStore('Statistics').load({
            params: {
                from: this.lookupReference('fromDateField').getValue().toISOString(),
                to: this.lookupReference('toDateField').getValue().toISOString()
            }
        });
    }
});
