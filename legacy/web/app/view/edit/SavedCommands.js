

Ext.define('Traccar.view.edit.SavedCommands', {
    extend: 'Traccar.view.GridPanel',
    xtype: 'savedCommandsView',

    requires: [
        'Traccar.view.edit.SavedCommandsController',
        'Traccar.view.edit.Toolbar'
    ],

    controller: 'savedCommands',
    store: 'Commands',

    tbar: {
        xtype: 'editToolbar'
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
            text: Strings.sharedDescription,
            dataIndex: 'description',
            filter: 'string'
        }, {
            text: Strings.sharedType,
            dataIndex: 'type',
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
            renderer: Traccar.AttributeFormatter.getFormatter('textChannel'),
            filter: 'boolean'
        }]
    }
});
