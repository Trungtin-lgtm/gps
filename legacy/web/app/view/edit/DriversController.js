
Ext.define('Traccar.view.edit.DriversController', {
    extend: 'Traccar.view.edit.ToolbarController',
    alias: 'controller.drivers',

    requires: [
        'Traccar.view.dialog.Driver',
        'Traccar.model.Driver'
    ],

    objectModel: 'Traccar.model.Driver',
    objectDialog: 'Traccar.view.dialog.Driver',
    removeTitle: Strings.sharedDriver
});
