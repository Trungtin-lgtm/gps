
Ext.define('Traccar.view.dialog.DeviceAccumulators', {
    extend: 'Traccar.view.dialog.Base',

    requires: [
        'Traccar.view.dialog.DeviceAccumulatorsController'
    ],

    controller: 'deviceAccumulators',
    title: Strings.sharedDeviceAccumulators,

    items: [{
        xtype: 'customNumberField',
        dataType: 'distance',
        reference: 'totalDistance',
        fieldLabel: Strings.deviceTotalDistance
    }, {
        xtype: 'customNumberField',
        dataType: 'hours',
        reference: 'hours',
        fieldLabel: Strings.positionHours
    }],

    buttons: [{
        reference: 'setButton',
        glyph: 'xf00c@FontAwesome',
        tooltip: Strings.sharedSet,
        tooltipType: 'title',
        minWidth: 0,
        handler: 'onSetClick'
    }, {
        glyph: 'xf00d@FontAwesome',
        tooltip: Strings.sharedCancel,
        tooltipType: 'title',
        minWidth: 0,
        handler: 'closeView'
    }]
});
