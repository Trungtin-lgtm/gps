Ext.define('Traccar.view.permissions.Users', {
    extend: 'Traccar.view.permissions.Base',
    xtype: 'linkUsersView',

    columns: {
        items: [{
            text: Strings.sharedName,
            dataIndex: 'name',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            filter: 'string'
        }]
    }
});
