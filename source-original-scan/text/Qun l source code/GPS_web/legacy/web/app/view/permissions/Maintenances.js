

Ext.define('Traccar.view.permissions.Maintenances', {
    extend: 'Traccar.view.permissions.Base',
    xtype: 'linkMaintenancesView',

    columns: {
        items: [{
            text: Strings.sharedName,
            dataIndex: 'name',
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
                idField: 'key',
                labelField: 'name',
                store: 'MaintenanceTypes'
            },
            renderer: function (value) {
                var attribute = Ext.getStore('MaintenanceTypes').getById(value);
                return attribute && attribute.get('name') || value;
            }
        }, {
            text: Strings.maintenanceStart,
            dataIndex: 'start',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            renderer: function (value, metaData, record) {
                return Traccar.AttributeFormatter.renderAttribute(
                    value, Ext.getStore('MaintenanceTypes').getById(record.get('type')));
            }
        }, {
            text: Strings.maintenancePeriod,
            dataIndex: 'period',
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal,
            renderer: function (value, metaData, record) {
                return Traccar.AttributeFormatter.renderAttribute(
                    value, Ext.getStore('MaintenanceTypes').getById(record.get('type')));
            }
        }]
    }
});
