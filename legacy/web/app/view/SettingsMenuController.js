
Ext.define('Traccar.view.SettingsMenuController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.settings',

    requires: [
        'Traccar.view.dialog.LoginController',
        'Traccar.view.dialog.User',
        'Traccar.view.dialog.Server',
        'Traccar.view.edit.Users',
        'Traccar.view.edit.Groups',
        'Traccar.view.edit.Geofences',
        'Traccar.view.edit.Drivers',
        'Traccar.view.edit.Notifications',
        'Traccar.view.edit.ComputedAttributes',
        'Traccar.view.Statistics',
        'Traccar.view.edit.Calendars',
        'Traccar.view.edit.SavedCommands',
        'Traccar.view.edit.Maintenances',
        'Traccar.view.BaseWindow'
    ],

    init: function () {
        var admin, manager, readonly;
        admin = Traccar.app.getUser().get('administrator');
        manager = Traccar.app.getUser().get('userLimit') !== 0;
        readonly = Traccar.app.getPreference('readonly', false);
        if (admin) {
            this.lookupReference('settingsServerButton').setHidden(false);
            this.lookupReference('settingsStatisticsButton').setHidden(false);
            this.lookupReference('settingsComputedAttributesButton').setHidden(
                Traccar.app.getBooleanAttributePreference('ui.disableComputedAttributes'));
        }
        if (admin || manager) {
            this.lookupReference('settingsUsersButton').setHidden(false);
        }
        if (admin || !readonly) {
            this.lookupReference('settingsUserButton').setHidden(false);
            this.lookupReference('settingsGroupsButton').setHidden(false);
            this.lookupReference('settingsGeofencesButton').setHidden(false);
            this.lookupReference('settingsNotificationsButton').setHidden(false);
            this.lookupReference('settingsCalendarsButton').setHidden(
                Traccar.app.getBooleanAttributePreference('ui.disableCalendars'));
            this.lookupReference('settingsDriversButton').setHidden(
                Traccar.app.getVehicleFeaturesDisabled() || Traccar.app.getBooleanAttributePreference('ui.disableDrivers'));
            this.lookupReference('settingsCommandsButton').setHidden(Traccar.app.getPreference('limitCommands', false));
            this.lookupReference('settingsMaintenancesButton').setHidden(
                Traccar.app.getVehicleFeaturesDisabled() || Traccar.app.getBooleanAttributePreference('ui.disableMaintenance'));
        }
    },

    onUserClick: function () {
        var dialog = Ext.create('Traccar.view.dialog.User', {
            selfEdit: true
        });
        dialog.down('form').loadRecord(Traccar.app.getUser());
        dialog.lookupReference('testNotificationButton').setHidden(false);
        dialog.show();
    },

    onGroupsClick: function () {
        Ext.create('Traccar.view.BaseWindow', {
            title: Strings.settingsGroups,
            items: {
                xtype: 'groupsView'
            }
        }).show();
    },

    onGeofencesClick: function () {
        Ext.create('Traccar.view.BaseWindow', {
            title: Strings.sharedGeofences,
            items: {
                xtype: 'geofencesView'
            }
        }).show();
    },

    onServerClick: function () {
        var dialog = Ext.create('Traccar.view.dialog.Server');
        dialog.down('form').loadRecord(Traccar.app.getServer());
        dialog.show();
    },

    onUsersClick: function () {
        Ext.create('Traccar.view.BaseWindow', {
            title: Strings.settingsUsers,
            items: {
                xtype: 'usersView'
            }
        }).show();
    },

    onNotificationsClick: function () {
        Ext.create('Traccar.view.BaseWindow', {
            title: Strings.sharedNotifications,
            items: {
                xtype: 'notificationsView'
            }
        }).show();
    },

    onComputedAttributesClick: function () {
        Ext.create('Traccar.view.BaseWindow', {
            title: Strings.sharedComputedAttributes,
            items: {
                xtype: 'computedAttributesView'
            }
        }).show();
    },

    onStatisticsClick: function () {
        Ext.create('Traccar.view.BaseWindow', {
            title: Strings.statisticsTitle,
            items: {
                xtype: 'statisticsView'
            }
        }).show();
    },

    onCalendarsClick: function () {
        Ext.create('Traccar.view.BaseWindow', {
            title: Strings.sharedCalendars,
            items: {
                xtype: 'calendarsView'
            }
        }).show();
    },

    onDriversClick: function () {
        Ext.create('Traccar.view.BaseWindow', {
            title: Strings.sharedDrivers,
            items: {
                xtype: 'driversView'
            }
        }).show();
    },

    onCommandsClick: function () {
        Ext.create('Traccar.view.BaseWindow', {
            title: Strings.sharedSavedCommands,
            items: {
                xtype: 'savedCommandsView'
            }
        }).show();
    },

    onMaintenancesClick: function () {
        Ext.create('Traccar.view.BaseWindow', {
            title: Strings.sharedMaintenance,
            items: {
                xtype: 'maintenancesView'
            }
        }).show();
    },

    onLogoutClick: function () {
        Ext.create('Traccar.view.dialog.LoginController').logout();
    }
});
