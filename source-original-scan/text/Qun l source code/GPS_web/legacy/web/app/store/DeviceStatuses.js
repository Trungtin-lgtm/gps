
Ext.define('Traccar.store.DeviceStatuses', {
    extend: 'Ext.data.Store',
    fields: ['id', 'name', 'color'],

    data: [{
        id: 'online',
        name: Strings.deviceStatusOnline,
        color: 'view-color-green'
    }, {
        id: 'offline',
        name: Strings.deviceStatusOffline,
        color: 'view-color-red'
    }, {
        id: 'unknown',
        name: Strings.deviceStatusUnknown,
        color: 'view-color-yellow'
    }]
});
