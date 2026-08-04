

Ext.define('Traccar.view.edit.GroupsController', {
    extend: 'Traccar.view.edit.ToolbarController',
    alias: 'controller.groups',

    requires: [
        'Traccar.view.dialog.Group',
        'Traccar.view.permissions.Geofences',
        'Traccar.view.permissions.ComputedAttributes',
        'Traccar.view.permissions.Drivers',
        'Traccar.view.permissions.SavedCommands',
        'Traccar.view.permissions.Maintenances',
        'Traccar.view.BaseWindow',
        'Traccar.model.Group'
    ],

    objectModel: 'Traccar.model.Group',
    objectDialog: 'Traccar.view.dialog.Group',
    removeTitle: Strings.groupDialog,

    init: function () {
        this.lookupReference('toolbarDriversButton').setHidden(
            Traccar.app.getVehicleFeaturesDisabled() || Traccar.app.getBooleanAttributePreference('ui.disableDrivers'));
        this.lookupReference('toolbarAttributesButton').setHidden(
            Traccar.app.getBooleanAttributePreference('ui.disableComputedAttributes'));
        this.lookupReference('toolbarCommandsButton').setHidden(Traccar.app.getPreference('limitCommands', false));
        this.lookupReference('toolbarMaintenancesButton').setHidden(
            Traccar.app.getVehicleFeaturesDisabled() || Traccar.app.getBooleanAttributePreference('ui.disableMaintenance'));
    },

    onGeofencesClick: function () {
        var group = this.getView().getSelectionModel().getSelection()[0];
        Ext.create('Traccar.view.BaseWindow', {
            title: Strings.sharedGeofences,
            items: {
                xtype: 'linkGeofencesView',
                baseObjectName: 'groupId',
                linkObjectName: 'geofenceId',
                storeName: 'Geofences',
                baseObject: group.getId()
            }
        }).show();
    },

    onAttributesClick: function () {
        var group = this.getView().getSelectionModel().getSelection()[0];
        Ext.create('Traccar.view.BaseWindow', {
            title: Strings.sharedComputedAttributes,
            items: {
                xtype: 'linkComputedAttributesView',
                baseObjectName: 'groupId',
                linkObjectName: 'attributeId',
                storeName: 'ComputedAttributes',
                baseObject: group.getId()
            }
        }).show();
    },

    onDriversClick: function () {
        var group = this.getView().getSelectionModel().getSelection()[0];
        Ext.create('Traccar.view.BaseWindow', {
            title: Strings.sharedDrivers,
            items: {
                xtype: 'linkDriversView',
                baseObjectName: 'groupId',
                linkObjectName: 'driverId',
                storeName: 'Drivers',
                baseObject: group.getId()
            }
        }).show();
    },

    onCommandsClick: function () {
        var group = this.getView().getSelectionModel().getSelection()[0];
        Ext.create('Traccar.view.BaseWindow', {
            title: Strings.sharedSavedCommands,
            items: {
                xtype: 'linkSavedCommandsView',
                baseObjectName: 'groupId',
                linkObjectName: 'commandId',
                storeName: 'Commands',
                baseObject: group.getId()
            }
        }).show();
    },

    onNotificationsClick: function () {
        var group = this.getView().getSelectionModel().getSelection()[0];
        Ext.create('Traccar.view.BaseWindow', {
            title: Strings.sharedNotifications,
            items: {
                xtype: 'linkNotificationsView',
                baseObjectName: 'groupId',
                linkObjectName: 'notificationId',
                storeName: 'Notifications',
                baseObject: group.getId()
            }
        }).show();
    },

    onMaintenancesClick: function () {
        var group = this.getView().getSelectionModel().getSelection()[0];
        Ext.create('Traccar.view.BaseWindow', {
            title: Strings.sharedMaintenance,
            items: {
                xtype: 'linkMaintenancesView',
                baseObjectName: 'groupId',
                linkObjectName: 'maintenanceId',
                storeName: 'Maintenances',
                baseObject: group.getId()
            }
        }).show();
    },

    onSelectionChange: function (selection, selected) {
        var disabled = selected.length === 0;
        this.lookupReference('toolbarGeofencesButton').setDisabled(disabled);
        this.lookupReference('toolbarAttributesButton').setDisabled(disabled);
        this.lookupReference('toolbarDriversButton').setDisabled(disabled);
        this.lookupReference('toolbarCommandsButton').setDisabled(disabled);
        this.lookupReference('toolbarNotificationsButton').setDisabled(disabled);
        this.lookupReference('toolbarMaintenancesButton').setDisabled(disabled);
        this.callParent(arguments);
    }
});
