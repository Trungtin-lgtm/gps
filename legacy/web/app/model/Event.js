
Ext.define('Traccar.model.Event', {
    extend: 'Ext.data.Model',
    identifier: 'negative',

    fields: [{
        name: 'id',
        type: 'int'
    }, {
        name: 'type',
        type: 'string'
    }, {
        name: 'eventTime',
        type: 'date',
        dateFormat: 'c'
    }, {
        name: 'deviceId',
        type: 'int'
    }, {
        name: 'positionId',
        type: 'int'
    }, {
        name: 'geofenceId',
        type: 'int'
    }, {
        name: 'maintenanceId',
        type: 'int'
    }, {
        name: 'text',
        convert: function (v, rec) {
            var text, alarmKey, geofence, maintenance;
            if (rec.get('type') === 'commandResult') {
                text = Strings.eventCommandResult + ': ' + rec.get('attributes')['result'];
            } else if (rec.get('type') === 'alarm') {
                alarmKey = rec.get('attributes')['alarm'];
                alarmKey = 'alarm' + alarmKey.charAt(0).toUpperCase() + alarmKey.slice(1);
                text = Strings[alarmKey] || alarmKey;
            } else if (rec.get('type') === 'textMessage') {
                text = Strings.eventTextMessage + ': ' + rec.get('attributes')['message'];
            } else if (rec.get('type') === 'driverChanged') {
                text = Strings.eventDriverChanged + ': ' +
                    Traccar.AttributeFormatter.driverUniqueIdFormatter(rec.get('attributes')['driverUniqueId']);
            } else {
                text = Traccar.app.getEventString(rec.get('type'));
            }
            if (rec.get('geofenceId')) {
                geofence = Ext.getStore('Geofences').getById(rec.get('geofenceId'));
                if (geofence) {
                    text += ' "' + geofence.get('name') + '"';
                }
            }
            if (rec.get('maintenanceId')) {
                maintenance = Ext.getStore('Maintenances').getById(rec.get('maintenanceId'));
                if (maintenance) {
                    text += ' "' + maintenance.get('name') + '"';
                }
            }
            return text;
        },
        depends: ['type', 'attributes', 'geofenceId', 'maintenanceId']
    }, {
        name: 'attributes'
    }]
});
