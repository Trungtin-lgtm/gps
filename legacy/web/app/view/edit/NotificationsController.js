

Ext.define('Traccar.view.edit.NotificationsController', {
    extend: 'Traccar.view.edit.ToolbarController',
    alias: 'controller.notifications',

    requires: [
        'Traccar.view.dialog.Notification',
        'Traccar.model.Notification'
    ],

    objectModel: 'Traccar.model.Notification',
    objectDialog: 'Traccar.view.dialog.Notification',
    removeTitle: Strings.sharedNotification
});
