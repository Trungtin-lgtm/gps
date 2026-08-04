

Ext.define('Traccar.view.dialog.Notification', {
    extend: 'Traccar.view.dialog.BaseEdit',

    requires: [
        'Traccar.view.ClearableComboBox',
        'Traccar.view.dialog.NotificationController'
    ],

    controller: 'notification',
    title: Strings.sharedNotification,

    items: {
        xtype: 'form',
        items: [{
            xtype: 'fieldset',
            title: Strings.sharedRequired,
            items: [{
                xtype: 'combobox',
                name: 'type',
                fieldLabel: Strings.sharedType,
                store: 'AllNotificationTypes',
                queryMode: 'local',
                displayField: 'name',
                valueField: 'type',
                editable: false,
                allowBlank: false,
                listeners: {
                    change: 'onTypeChange'
                }
            }, {
                xtype: 'checkboxfield',
                inputValue: true,
                uncheckedValue: false,
                name: 'always',
                fieldLabel: Strings.notificationAlways
            }, {
                xtype: 'tagfield',
                reference: 'alarmsField',
                fieldLabel: Strings.sharedAlarms,
                maxWidth: Traccar.Style.formFieldWidth,
                store: 'AlarmTypes',
                valueField: 'key',
                displayField: 'name',
                queryMode: 'local',
                hidden: true,
                listeners: {
                    beforerender: 'onAlarmsLoad',
                    change: 'onAlarmsChange'
                }
            }, {
                xtype: 'tagfield',
                fieldLabel: Strings.notificationNotificators,
                name: 'notificators',
                maxWidth: Traccar.Style.formFieldWidth,
                store: 'AllNotificators',
                valueField: 'type',
                displayField: 'name',
                queryMode: 'local'
            }]
        }, {
            xtype: 'fieldset',
            title: Strings.sharedExtra,
            collapsible: true,
            collapsed: true,
            items: [{
                xtype: 'clearableComboBox',
                reference: 'calendarCombo',
                name: 'calendarId',
                store: 'Calendars',
                queryMode: 'local',
                displayField: 'name',
                valueField: 'id',
                fieldLabel: Strings.sharedCalendar
            }]
        }]
    }
});
