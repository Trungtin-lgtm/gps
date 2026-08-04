
Ext.define('Traccar.view.Main', {
    extend: 'Ext.container.Viewport',
    alias: 'widget.main',

    requires: [
        'Traccar.view.MainController',
        'Traccar.view.edit.Devices',
        'Traccar.view.State',
        'Traccar.view.Report',
        'Traccar.view.Events',
        'Traccar.view.map.Map'
    ],

    controller: 'mainController',

    layout: 'border',

    defaults: {
        header: false,
        collapsible: true,
        split: true
    },

    items: [{
        region: 'west',
        layout: 'border',
        width: Traccar.Style.deviceWidth,
        title: Strings.devicesAndState,
        titleCollapse: true,
        floatable: false,
        stateful: true,
        stateId: 'devices-and-state-panel',

        defaults: {
            split: true,
            flex: 1
        },

        items: [{
            region: 'center',
            xtype: 'devicesView'
        }, {
            region: 'south',
            xtype: 'stateView'
        }]
    }, {
        region: 'south',
        xtype: 'reportView',
        reference: 'reportView',
        height: Traccar.Style.reportHeight,
        collapsed: true,
        titleCollapse: true,
        floatable: false
    }, {
        region: 'center',
        xtype: 'mapView',
        collapsible: false
    }, {
        region: 'east',
        xtype: 'eventsView',
        reference: 'eventsView',
        width: Traccar.Style.deviceWidth,
        collapsed: true,
        titleCollapse: true,
        floatable: false
    }]
});
