
Ext.define('Traccar.view.permissions.ComputedAttributes', {
    extend: 'Traccar.view.permissions.Base',
    xtype: 'linkComputedAttributesView',

    columns: {
        items: [{
            text: Strings.sharedDescription,
            dataIndex: 'description',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            filter: 'string'
        }, {
            text: Strings.sharedAttribute,
            dataIndex: 'attribute',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            filter: {
                type: 'list',
                labelField: 'name',
                store: 'PositionAttributes'
            },
            renderer: function (value) {
                return Ext.getStore('PositionAttributes').getAttributeName(value);
            }
        }]
    }
});
