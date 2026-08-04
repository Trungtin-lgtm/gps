

Ext.define('Traccar.view.Events', {
    extend: 'Traccar.view.GridPanel',
    xtype: 'eventsView',

    requires: [
        'Traccar.view.EventsController'
    ],

    controller: 'events',

    store: 'Events',

    stateful: true,
    stateId: 'events-grid',

    title: Strings.reportEvents,

    sortableColumns: false,

    header: false,

    tbar: {
        componentCls: 'toolbar-header-style',
        defaults: {
            xtype: 'button',
            tooltipType: 'title',
            stateEvents: ['toggle'],
            enableToggle: true,
            stateful: {
                pressed: true
            }
        },
        items: [{
            xtype: 'tbtext',
            html: Strings.reportEvents,
            baseCls: 'x-panel-header-title-default'
        }, {
            xtype: 'tbfill'
        }, {
            glyph: 'xf063@FontAwesome',
            pressed: true,
            toggleHandler: 'onScrollToLastClick',
            stateId: 'events-scroll-to-last-button',
            tooltip: Strings.eventsScrollToLast,
            reference: 'scrollToLastButton'
        }, {
            id: 'soundButton',
            glyph: 'xf0a2@FontAwesome',
            tooltip: Strings.sharedSound,
            stateId: 'sound-button'
        }, {
            glyph: 'xf014@FontAwesome',
            tooltip: Strings.sharedRemove,
            handler: 'onRemoveClick',
            reference: 'removeEventButton',
            disabled: true,
            stateful: false,
            enableToggle: false
        }, {
            glyph: 'xf1f8@FontAwesome',
            tooltip: Strings.reportClear,
            handler: 'onClearClick',
            stateful: false,
            enableToggle: false
        }, {
            glyph: 'xf00d@FontAwesome',
            tooltip: Strings.sharedHide,
            handler: 'onHideEvents',
            reference: 'hideEventsButton',
            hidden: true,
            stateful: false,
            enableToggle: false
        }]
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
            text: Strings.sharedDevice,
            dataIndex: 'deviceId',
            renderer: Traccar.AttributeFormatter.getFormatter('deviceId')
        }, {
            flex: 2,
            text: Strings.positionEvent,
            dataIndex: 'text'
        }, {
            text: Strings.positionFixTime,
            dataIndex: 'eventTime',
            renderer: Traccar.AttributeFormatter.getFormatter('eventTime')
        }]
    }
});
