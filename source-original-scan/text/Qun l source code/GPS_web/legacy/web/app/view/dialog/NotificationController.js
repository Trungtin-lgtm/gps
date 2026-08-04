

Ext.define('Traccar.view.dialog.NotificationController', {
    extend: 'Traccar.view.dialog.BaseEditController',
    alias: 'controller.notification',

    init: function () {
        this.lookupReference('calendarCombo').setHidden(
            Traccar.app.getBooleanAttributePreference('ui.disableCalendars'));
    },

    onTypeChange: function (view, value) {
        this.lookupReference('alarmsField').setHidden(value !== 'alarm');
    },

    onAlarmsLoad: function (view) {
        var attributes, record = view.up('form').getRecord();
        attributes = record.get('attributes') || {};
        if (attributes['alarms']) {
            view.suspendEvents(false);
            view.setValue(attributes['alarms'].split(','));
            view.resumeEvents();
        }
    },

    onAlarmsChange: function (view, value) {
        var attributes, record = view.up('window').down('form').getRecord();
        attributes = record.get('attributes') || {};

        value = value.join();
        if (attributes['alarms'] !== value) {
            attributes['alarms'] = value;
            record.set('attributes', attributes);
            record.dirty = true;
        }
    }
});
