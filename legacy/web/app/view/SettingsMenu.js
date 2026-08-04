
Ext.define('Traccar.view.SettingsMenu', {
    extend: 'Ext.button.Button',
    xtype: 'settingsMenu',

    requires: [
        'Traccar.view.SettingsMenuController'
    ],

    glyph: 'xf013@FontAwesome',
    tooltip: Strings.settingsTitle,
    tooltipType: 'title',

    menu: {
        controller: 'settings',

        items: [{
            hidden: true,
            text: Strings.settingsUser,
            glyph: 'xf007@FontAwesome',
            handler: 'onUserClick',
            reference: 'settingsUserButton'
        }, {
            hidden: true,
            text: Strings.settingsGroups,
            glyph: 'xf247@FontAwesome',
            handler: 'onGroupsClick',
            reference: 'settingsGroupsButton'
        }, {
            hidden: true,
            text: Strings.sharedDrivers,
            glyph: 'xf084@FontAwesome',
            handler: 'onDriversClick',
            reference: 'settingsDriversButton'
        }, {
            hidden: true,
            text: Strings.sharedGeofences,
            glyph: 'xf21d@FontAwesome',
            handler: 'onGeofencesClick',
            reference: 'settingsGeofencesButton'
        }, {
            hidden: true,
            text: Strings.settingsServer,
            glyph: 'xf233@FontAwesome',
            handler: 'onServerClick',
            reference: 'settingsServerButton'
        }, {
            hidden: true,
            text: Strings.settingsUsers,
            glyph: 'xf0c0@FontAwesome',
            handler: 'onUsersClick',
            reference: 'settingsUsersButton'
        }, {
            hidden: true,
            text: Strings.sharedNotifications,
            glyph: 'xf003@FontAwesome',
            handler: 'onNotificationsClick',
            reference: 'settingsNotificationsButton'
        }, {
            hidden: true,
            text: Strings.sharedComputedAttributes,
            glyph: 'xf0ae@FontAwesome',
            handler: 'onComputedAttributesClick',
            reference: 'settingsComputedAttributesButton'
        }, {
            hidden: true,
            text: Strings.statisticsTitle,
            glyph: 'xf080@FontAwesome',
            handler: 'onStatisticsClick',
            reference: 'settingsStatisticsButton'
        }, {
            hidden: true,
            text: Strings.sharedCalendars,
            glyph: 'xf073@FontAwesome',
            handler: 'onCalendarsClick',
            reference: 'settingsCalendarsButton'
        }, {
            hidden: true,
            text: Strings.sharedSavedCommands,
            glyph: 'xf093@FontAwesome',
            handler: 'onCommandsClick',
            reference: 'settingsCommandsButton'
        }, {
            hidden: true,
            text: Strings.sharedMaintenance,
            glyph: 'xf0ad@FontAwesome',
            handler: 'onMaintenancesClick',
            reference: 'settingsMaintenancesButton'
        }, {
            text: Strings.loginLogout,
            glyph: 'xf08b@FontAwesome',
            handler: 'onLogoutClick'
        }]
    }
});
