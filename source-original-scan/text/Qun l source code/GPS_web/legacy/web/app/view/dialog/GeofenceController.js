

Ext.define('Traccar.view.dialog.GeofenceController', {
    extend: 'Traccar.view.dialog.BaseEditController',
    alias: 'controller.geofence',

    requires: [
        'Traccar.view.BaseWindow',
        'Traccar.view.map.GeofenceMap'
    ],

    config: {
        listen: {
            controller: {
                '*': {
                    savearea: 'saveArea'
                }
            }
        }
    },

    init: function () {
        this.lookupReference('calendarCombo').setHidden(
            Traccar.app.getBooleanAttributePreference('ui.disableCalendars'));
    },

    saveArea: function (value) {
        this.lookupReference('areaField').setValue(value);
    },

    onAreaClick: function (button) {
        var dialog, record;
        dialog = button.up('window').down('form');
        record = dialog.getRecord();
        Ext.create('Traccar.view.BaseWindow', {
            title: Strings.sharedArea,
            items: {
                xtype: 'geofenceMapView',
                area: record.get('area')
            }
        }).show();
    }
});
