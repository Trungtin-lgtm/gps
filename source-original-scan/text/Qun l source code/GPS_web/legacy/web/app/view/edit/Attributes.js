

Ext.define('Traccar.view.edit.Attributes', {
    extend: 'Traccar.view.GridPanel',
    xtype: 'attributesView',

    requires: [
        'Traccar.view.edit.AttributesController',
        'Traccar.view.edit.Toolbar'
    ],

    controller: 'attributes',

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
            text: Strings.sharedName,
            dataIndex: 'name',
            filter: 'string',
            renderer: function (value) {
                var attribute;
                if (this.attributesStore) {
                    attribute = Ext.getStore(this.attributesStore).getById(value);
                }
                return attribute && attribute.get('name') || value;
            }
        }, {
            text: Strings.stateValue,
            dataIndex: 'value',
            renderer: function (value, metaData, record) {
                var attribute;
                if (this.attributesStore) {
                    attribute = Ext.getStore(this.attributesStore).getById(record.get('name'));
                }
                return Traccar.AttributeFormatter.renderAttribute(value, attribute);
            }
        }]
    }
});
