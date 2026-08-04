
Ext.define('Traccar.view.permissions.SavedCommands', {
    extend: 'Traccar.view.permissions.Base',
    xtype: 'linkSavedCommandsView',

    columns: {
        items: [{
            text: Strings.sharedDescription,
            dataIndex: 'description',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            filter: 'string'
        }, {
            text: Strings.sharedType,
            dataIndex: 'type',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            filter: {
                type: 'list',
                idField: 'type',
                labelField: 'name',
                store: 'AllCommandTypes'
            },
            renderer: Traccar.AttributeFormatter.getFormatter('commandType')
        }, {
            text: Strings.commandSendSms,
            dataIndex: 'textChannel',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            filter: 'boolean'
        }]
    }
});
