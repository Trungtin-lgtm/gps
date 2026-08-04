

Ext.define('Traccar.view.edit.ComputedAttributes', {
    extend: 'Traccar.view.GridPanel',
    xtype: 'computedAttributesView',

    requires: [
        'Traccar.view.edit.ComputedAttributesController',
        'Traccar.view.edit.Toolbar'
    ],

    controller: 'computedAttributes',
    store: 'ComputedAttributes',

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
            text: Strings.sharedAttribute,
            dataIndex: 'attribute',
            filter: {
                type: 'list',
                labelField: 'name',
                store: 'PositionAttributes'
            },
            renderer: function (value) {
                return Ext.getStore('PositionAttributes').getAttributeName(value);
            }
        }, {
            text: Strings.sharedExpression,
            dataIndex: 'expression'
        }, {
            text: Strings.sharedType,
            dataIndex: 'type',
            filter: {
                type: 'list',
                labelField: 'name',
                store: 'AttributeValueTypes'
            },
            renderer: function (value) {
                var type = Ext.getStore('AttributeValueTypes').getById(value);
                if (type) {
                    return type.get('name');
                } else {
                    return value;
                }
            }
        }]
    }
});
