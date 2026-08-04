

Ext.define('Traccar.view.edit.Notifications', {
    extend: 'Traccar.view.GridPanel',
    xtype: 'notificationsView',

    requires: [
        'Traccar.view.edit.NotificationsController',
        'Traccar.view.edit.Toolbar'
    ],

    controller: 'notifications',
    store: 'Notifications',

    tbar: {
        xtype: 'editToolbar'
    },

    listeners: {
        selectionchange: 'onSelectionChange'
    },

    columns: {
        defaults: {
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal
        },
        items: [{
            text: Strings.notificationType,
            dataIndex: 'type',
            flex: 2,
            renderer: function (value) {
                return Traccar.app.getEventString(value);
            },
            filter: {
                type: 'list',
                idField: 'type',
                labelField: 'name',
                store: 'AllNotificationTypes'
            }
        }, {
            text: Strings.notificationAlways,
            dataIndex: 'always',
            renderer: Traccar.AttributeFormatter.getFormatter('always'),
            filter: 'boolean'
        }, {
            text: Strings.sharedAlarms,
            dataIndex: 'attributes',
            renderer: function (value) {
                var i, key, result = '', alarms = value && value['alarms'];
                if (alarms) {
                    alarms = alarms.split(',');
                    for (i = 0; i < alarms.length; i++) {
                        key = 'alarm' + alarms[i].charAt(0).toUpperCase() + alarms[i].slice(1);
                        if (result) {
                            result += ', ';
                        }
                        result += Strings[key] || key;
                    }
                }
                return result;
            }
        }, {
            text: Strings.notificationNotificators,
            dataIndex: 'notificators',
            flex: 2,
            filter: {
                type: 'arraylist',
                idField: 'type',
                labelField: 'name',
                store: 'AllNotificators'
            },
            renderer: function (value) {
                var result = '', i, notificators;
                if (value) {
                    notificators = value.split(/[ ,]+/).filter(Boolean);
                    for (i = 0; i < notificators.length; i++) {
                        result += Traccar.app.getNotificatorString(notificators[i]) + (i < notificators.length - 1 ? ', ' : '');
                    }
                }
                return result;
            }
        }, {
            text: Strings.sharedCalendar,
            dataIndex: 'calendarId',
            hidden: true,
            filter: {
                type: 'list',
                labelField: 'name',
                store: 'AllCalendars'
            },
            renderer: Traccar.AttributeFormatter.getFormatter('calendarId')
        }]
    }
});
