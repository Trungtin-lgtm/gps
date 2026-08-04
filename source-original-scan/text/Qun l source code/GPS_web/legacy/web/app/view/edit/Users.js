

Ext.define('Traccar.view.edit.Users', {
    extend: 'Traccar.view.GridPanel',
    xtype: 'usersView',

    requires: [
        'Traccar.view.edit.UsersController',
        'Traccar.view.edit.Toolbar'
    ],

    controller: 'users',
    store: 'Users',

    tbar: {
        xtype: 'editToolbar',
        scrollable: true,
        items: [{
            disabled: true,
            handler: 'onGeofencesClick',
            reference: 'userGeofencesButton',
            glyph: 'xf21d@FontAwesome',
            tooltip: Strings.sharedGeofences,
            tooltipType: 'title'
        }, {
            disabled: true,
            handler: 'onDevicesClick',
            reference: 'userDevicesButton',
            glyph: 'xf248@FontAwesome',
            tooltip: Strings.deviceTitle,
            tooltipType: 'title'
        }, {
            disabled: true,
            handler: 'onGroupsClick',
            reference: 'userGroupsButton',
            glyph: 'xf247@FontAwesome',
            tooltip: Strings.settingsGroups,
            tooltipType: 'title'
        }, {
            disabled: true,
            handler: 'onUsersClick',
            reference: 'userUsersButton',
            glyph: 'xf0c0@FontAwesome',
            tooltip: Strings.settingsUsers,
            tooltipType: 'title'
        }, {
            disabled: true,
            handler: 'onNotificationsClick',
            reference: 'userNotificationsButton',
            glyph: 'xf003@FontAwesome',
            tooltip: Strings.sharedNotifications,
            tooltipType: 'title'
        }, {
            disabled: true,
            handler: 'onCalendarsClick',
            reference: 'userCalendarsButton',
            glyph: 'xf073@FontAwesome',
            tooltip: Strings.sharedCalendars,
            tooltipType: 'title'
        }, {
            disabled: true,
            handler: 'onAttributesClick',
            reference: 'userAttributesButton',
            glyph: 'xf0ae@FontAwesome',
            tooltip: Strings.sharedComputedAttributes,
            tooltipType: 'title'
        }, {
            disabled: true,
            handler: 'onDriversClick',
            reference: 'userDriversButton',
            glyph: 'xf084@FontAwesome',
            tooltip: Strings.sharedDrivers,
            tooltipType: 'title'
        }, {
            xtype: 'button',
            disabled: true,
            handler: 'onCommandsClick',
            reference: 'userCommandsButton',
            glyph: 'xf093@FontAwesome',
            tooltip: Strings.sharedSavedCommands,
            tooltipType: 'title'
        }, {
            xtype: 'button',
            disabled: true,
            handler: 'onMaintenancesClick',
            reference: 'userMaintenancesButton',
            glyph: 'xf0ad@FontAwesome',
            tooltip: Strings.sharedMaintenance,
            tooltipType: 'title'
        }]
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
            text: Strings.sharedName,
            dataIndex: 'name',
            filter: 'string'
        }, {
            text: Strings.userEmail,
            dataIndex: 'email',
            filter: 'string'
        }, {
            text: Strings.userAdmin,
            dataIndex: 'administrator',
            renderer: Traccar.AttributeFormatter.getFormatter('administrator'),
            filter: 'boolean'
        }, {
            text: Strings.serverReadonly,
            dataIndex: 'readonly',
            hidden: true,
            renderer: Traccar.AttributeFormatter.getFormatter('readonly'),
            filter: 'boolean'
        }, {
            text: Strings.userDeviceReadonly,
            dataIndex: 'deviceReadonly',
            renderer: Traccar.AttributeFormatter.getFormatter('deviceReadonly'),
            hidden: true,
            filter: 'boolean'
        }, {
            text: Strings.sharedDisabled,
            dataIndex: 'disabled',
            renderer: Traccar.AttributeFormatter.getFormatter('disabled'),
            filter: 'boolean'
        }, {
            text: Strings.userExpirationTime,
            dataIndex: 'expirationTime',
            hidden: true,
            renderer: Traccar.AttributeFormatter.getFormatter('expirationTime'),
            filter: 'date'
        }]
    }
});
