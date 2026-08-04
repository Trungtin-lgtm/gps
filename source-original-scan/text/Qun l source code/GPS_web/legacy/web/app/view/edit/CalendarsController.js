

Ext.define('Traccar.view.edit.CalendarsController', {
    extend: 'Traccar.view.edit.ToolbarController',
    alias: 'controller.calendars',

    requires: [
        'Traccar.view.dialog.Calendar',
        'Traccar.model.Calendar'
    ],

    objectModel: 'Traccar.model.Calendar',
    objectDialog: 'Traccar.view.dialog.Calendar',
    removeTitle: Strings.sharedCalendar
});
