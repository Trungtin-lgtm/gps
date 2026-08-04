
Ext.define('Traccar.view.MainController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.mainController',

    init: function () {
        this.lookupReference('reportView').setHidden(Traccar.app.getPreference('disableReports', false));
        this.lookupReference('eventsView').setHidden(Traccar.app.getBooleanAttributePreference('ui.disableEvents'));
    }
});
