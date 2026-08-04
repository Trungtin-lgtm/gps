

Ext.define('Traccar.view.edit.MaintenancesController', {
    extend: 'Traccar.view.edit.ToolbarController',
    alias: 'controller.maintenances',

    requires: [
        'Traccar.view.dialog.Maintenance',
        'Traccar.model.Maintenance'
    ],

    objectModel: 'Traccar.model.Maintenance',
    objectDialog: 'Traccar.view.dialog.Maintenance',
    removeTitle: Strings.sharedMaintenance
});
