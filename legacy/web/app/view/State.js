

Ext.define('Traccar.view.State', {
    extend: 'Traccar.view.GridPanel',
    xtype: 'stateView',

    requires: [
        'Traccar.view.StateController'
    ],

    controller: 'state',
    store: 'Attributes',

    stateful: true,
    stateId: 'state-grid',

    tbar: {
        componentCls: 'toolbar-header-style',
        items: [{
            xtype: 'tbtext',
            html: Strings.stateTitle,
            baseCls: 'x-panel-header-title-default'
        }, {
            xtype: 'tbfill'
        }, {
            xtype: 'button',
            disabled: true,
            handler: 'onComputedAttributesClick',
            reference: 'computedAttributesButton',
            glyph: 'xf0ae@FontAwesome',
            tooltip: Strings.sharedComputedAttributes,
            tooltipType: 'title'
        }]
    },

    columns: {
        defaults: {
            minWidth: Traccar.Style.columnWidthNormal,
            flex: 1
        },
        items: [{
            text: Strings.stateName,
            dataIndex: 'name'
        }, {
            text: Strings.stateValue,
            dataIndex: 'value',
            cellWrap: true,
            renderer: function (value, metaData, record) {
                var position, device, attribute;
                attribute = record.get('attribute');
                if (attribute === 'alarm') {
                    metaData.tdCls = 'view-color-red';
                } else if (attribute === 'address' && !value) {
                    return '<a href="#" onclick="Ext.fireEvent(\'stategeocode\')" >' +
                        Strings.sharedShowAddress + '</a>';
                } else if (attribute === 'image' || attribute === 'video' || attribute === 'audio') {
                    position = this.getController().position;
                    if (position) {
                        device = Ext.getStore('Devices').getById(position.get('deviceId'));
                        if (device) {
                            return '<a target="_blank" href="/api/media/' +
                                device.get('uniqueId') + '/' + value + '" >' + value + '</a>';
                        }
                    }
                }
                return value;
            }
        }]
    }
});
