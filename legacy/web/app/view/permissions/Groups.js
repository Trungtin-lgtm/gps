
Ext.define('Traccar.view.permissions.Groups', {
    extend: 'Traccar.view.permissions.Base',
    xtype: 'linkGroupsView',

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
