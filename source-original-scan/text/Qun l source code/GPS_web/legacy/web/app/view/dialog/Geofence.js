

Ext.define('Traccar.view.dialog.Geofence', {
    extend: 'Traccar.view.dialog.BaseEdit',

    requires: [
        'Traccar.view.ClearableComboBox',
        'Traccar.view.dialog.GeofenceController',
        'Traccar.view.UnescapedTextField'
    ],

    controller: 'geofence',
    title: Strings.sharedGeofence,

    items: {
        xtype: 'form',
        items: [{
            xtype: 'fieldset',
            title: Strings.sharedRequired,
            items: [{
                xtype: 'unescapedTextField',
                name: 'name',
                fieldLabel: Strings.sharedName
            }]
        }, {
            xtype: 'fieldset',
            title: Strings.sharedExtra,
            collapsible: true,
            collapsed: true,
            items: [{
                xtype: 'unescapedTextField',
                name: 'description',
                fieldLabel: Strings.sharedDescription
            }, {
                xtype: 'clearableComboBox',
                reference: 'calendarCombo',
                name: 'calendarId',
                store: 'Calendars',
                queryMode: 'local',
                displayField: 'name',
                valueField: 'id',
                fieldLabel: Strings.sharedCalendar
            }, {
                xtype: 'hiddenfield',
                name: 'area',
                allowBlank: false,
                reference: 'areaField'
            }]
        }]
    },

    buttons: [{
        text: Strings.sharedArea,
        glyph: 'xf21d@FontAwesome',
        handler: 'onAreaClick'
    }, {
        text: Strings.sharedAttributes,
        handler: 'showAttributesView'
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
