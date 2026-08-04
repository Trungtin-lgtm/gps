
Ext.define('Traccar.view.dialog.Server', {
    extend: 'Traccar.view.dialog.BaseEdit',

    requires: [
        'Traccar.view.ClearableComboBox',
        'Traccar.view.dialog.MapPickerController',
        'Traccar.view.UnescapedTextField'
    ],

    controller: 'mapPicker',
    title: Strings.serverTitle,

    items: {
        xtype: 'form',
        items: [{
            xtype: 'fieldset',
            title: Strings.sharedPreferences,
            items: [{
                xtype: 'clearableComboBox',
                name: 'map',
                fieldLabel: Strings.mapLayer,
                store: 'MapTypes',
                displayField: 'name',
                valueField: 'key'
            }, {
                xtype: 'unescapedTextField',
                name: 'bingKey',
                fieldLabel: Strings.mapBingKey
            }, {
                xtype: 'unescapedTextField',
                reference: 'mapUrlField',
                name: 'mapUrl',
                fieldLabel: Strings.mapCustomLabel
            }, {
                xtype: 'numberfield',
                reference: 'latitude',
                name: 'latitude',
                fieldLabel: Strings.positionLatitude,
                decimalPrecision: Traccar.Style.coordinatePrecision
            }, {
                xtype: 'numberfield',
                reference: 'longitude',
                name: 'longitude',
                fieldLabel: Strings.positionLongitude,
                decimalPrecision: Traccar.Style.coordinatePrecision
            }, {
                xtype: 'numberfield',
                reference: 'zoom',
                name: 'zoom',
                fieldLabel: Strings.serverZoom
            }, {
                xtype: 'checkboxfield',
                inputValue: true,
                uncheckedValue: false,
                name: 'forceSettings',
                fieldLabel: Strings.serverForceSettings
            }, {
                xtype: 'clearableComboBox',
                name: 'coordinateFormat',
                fieldLabel: Strings.settingsCoordinateFormat,
                store: 'CoordinateFormats',
                displayField: 'name',
                valueField: 'key'
            }, {
                xtype: 'unescapedTextField',
                name: 'poiLayer',
                fieldLabel: Strings.mapPoiLayer
            }, {
                xtype: 'unescapedTextField',
                name: 'announcement',
                fieldLabel: Strings.serverAnnouncement
            }]
        }, {
            xtype: 'fieldset',
            title: Strings.sharedPermissions,
            collapsible: true,
            collapsed: true,
            items: [{
                xtype: 'checkboxfield',
                inputValue: true,
                uncheckedValue: false,
                name: 'registration',
                fieldLabel: Strings.serverRegistration
            }, {
                xtype: 'checkboxfield',
                inputValue: true,
                uncheckedValue: false,
                name: 'readonly',
                fieldLabel: Strings.serverReadonly
            }, {
                xtype: 'checkboxfield',
                inputValue: true,
                uncheckedValue: false,
                name: 'deviceReadonly',
                fieldLabel: Strings.userDeviceReadonly
            }, {
                xtype: 'checkboxfield',
                inputValue: true,
                uncheckedValue: false,
                name: 'limitCommands',
                fieldLabel: Strings.userLimitCommands
            }, {
                xtype: 'checkboxfield',
                inputValue: true,
                uncheckedValue: false,
                name: 'disableReports',
                fieldLabel: Strings.userDisableReports
            }]
        }]
    },

    buttons: [{
        text: Strings.sharedAttributes,
        handler: 'showAttributesView'
    }, {
        glyph: 'xf041@FontAwesome',
        minWidth: 0,
        handler: 'getMapState',
        tooltip: Strings.sharedGetMapState,
        tooltipType: 'title'
    }, {
        xtype: 'tbfill'
    }, {
        glyph: 'xf00c@FontAwesome',
        tooltip: Strings.sharedSave,
        tooltipType: 'title',
        minWidth: 0,
        handler: 'onSaveClick'
    }, {
        glyph: 'xf00d@FontAwesome',
        tooltip: Strings.sharedCancel,
        tooltipType: 'title',
        minWidth: 0,
        handler: 'closeView'
    }]
});
