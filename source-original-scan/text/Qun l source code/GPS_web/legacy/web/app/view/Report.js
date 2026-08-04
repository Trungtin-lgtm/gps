
Ext.define('Traccar.view.Report', {
    extend: 'Ext.panel.Panel',
    xtype: 'reportView',

    requires: [
        'Traccar.view.ReportController',
        'Traccar.view.GridPanel'
    ],

    controller: 'report',

    title: Strings.reportTitle,

    tools: [{
        type: 'close',
        tooltip: Strings.sharedHide,
        handler: 'hideReports'
    }],

    tbar: {
        scrollable: true,
        items: [{
            xtype: 'tbtext',
            html: Strings.sharedType
        }, {
            xtype: 'combobox',
            reference: 'reportTypeField',
            store: 'ReportTypes',
            displayField: 'name',
            valueField: 'key',
            editable: false,
            listeners: {
                change: 'onTypeChange'
            }
        }, '-', {
            text: Strings.reportConfigure,
            handler: 'onConfigureClick'
        }, '-', {
            text: Strings.reportShow,
            reference: 'showButton',
            disabled: true,
            handler: 'onReportClick'
        }, {
            text: Strings.reportExport,
            reference: 'exportButton',
            disabled: true,
            handler: 'onReportClick'
        }, {
            text: Strings.reportEmail,
            reference: 'emailButton',
            disabled: true,
            handler: 'onReportClick'
        }, {
            text: Strings.reportClear,
            handler: 'onClearClick'
        }]
    },

    layout: 'card',

    items: [{
        xtype: 'customGridPanel',
        itemId: 'grid',
        listeners: {
            selectionchange: 'onSelectionChange'
        },
        columns: {
            defaults: {
                flex: 1,
                minWidth: Traccar.Style.columnWidthNormal
            },
            items: [
            ]
        },
        style: Traccar.Style.reportGridStyle
    }, {
        xtype: 'cartesian',
        itemId: 'chart',
        plugins: {
            ptype: 'chartitemevents',
            moveEvents: true
        },
        store: 'ReportRoute',
        axes: [{
            title: Strings.reportChart,
            type: 'numeric',
            position: 'left'
        }, {
            type: 'time',
            position: 'bottom',
            fields: ['fixTime']
        }],
        listeners: {
            itemclick: 'onChartMarkerClick'
        },
        insetPadding: Traccar.Style.chartPadding
    }]
});
