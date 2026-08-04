
Ext.define('Traccar.view.permissions.Devices', {
    extend: 'Traccar.view.permissions.Base',
    xtype: 'linkDevicesView',

    requires: [
        'Traccar.AttributeFormatter'
    ],

    columns: {
        items: [{
            text: Strings.sharedName,
            dataIndex: 'name',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            filter: 'string'
        }, {
            text: Strings.deviceIdentifier,
            dataIndex: 'uniqueId',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            filter: 'string'
        }, {
            text: Strings.sharedPhone,
            dataIndex: 'phone',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            hidden: true,
            filter: 'string'
        }, {
            text: Strings.deviceModel,
            dataIndex: 'model',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            hidden: true,
            filter: 'string'
        }, {
            text: Strings.deviceContact,
            dataIndex: 'contact',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            hidden: true,
            filter: 'string'
        }, {
            text: Strings.sharedDisabled,
            dataIndex: 'disabled',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            renderer: Traccar.AttributeFormatter.getFormatter('disabled'),
            hidden: true,
            filter: 'boolean'
        }, {
            text: Strings.groupDialog,
            dataIndex: 'groupId',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            hidden: true,
            filter: {
                type: 'list',
                labelField: 'name',
                store: 'AllGroups'
            },
            renderer: Traccar.AttributeFormatter.getFormatter('groupId')
        }]
    }
});
