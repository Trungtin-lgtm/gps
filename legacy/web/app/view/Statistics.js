

Ext.define('Traccar.view.Statistics', {
    extend: 'Traccar.view.GridPanel',
    xtype: 'statisticsView',

    requires: [
        'Traccar.view.StatisticsController'
    ],

    controller: 'statistics',
    store: 'Statistics',

    tbar: {
        scrollable: true,
        items: [{
            xtype: 'tbtext',
            html: Strings.reportFrom
        }, {
            xtype: 'datefield',
            reference: 'fromDateField',
            startDay: Traccar.Style.weekStartDay,
            format: Traccar.Style.dateFormat,
            value: new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
        }, '-', {
            xtype: 'tbtext',
            html: Strings.reportTo
        }, {
            xtype: 'datefield',
            reference: 'toDateField',
            startDay: Traccar.Style.weekStartDay,
            format: Traccar.Style.dateFormat,
            value: new Date()
        }, '-', {
            text: Strings.reportShow,
            handler: 'onShowClick'
        }]
    },

    columns: {
        defaults: {
            flex: 1,
            minWidth: Traccar.Style.columnWidthNormal
        },
        items: [{
            text: Strings.statisticsCaptureTime,
            dataIndex: 'captureTime',
            xtype: 'datecolumn',
            renderer: Traccar.AttributeFormatter.defaultFormatter()
        }, {
            text: Strings.statisticsActiveUsers,
            dataIndex: 'activeUsers'
        }, {
            text: Strings.statisticsActiveDevices,
            dataIndex: 'activeDevices'
        }, {
            text: Strings.statisticsRequests,
            dataIndex: 'requests'
        }, {
            text: Strings.statisticsMessagesReceived,
            dataIndex: 'messagesReceived'
        }, {
            text: Strings.statisticsMessagesStored,
            dataIndex: 'messagesStored'
        }, {
            text: Strings.notificatorMail,
            dataIndex: 'mailSent'
        }, {
            text: Strings.notificatorSms,
            dataIndex: 'smsSent'
        }, {
            text: Strings.statisticsGeocoder,
            dataIndex: 'geocoderRequests'
        }, {
            text: Strings.statisticsGeolocation,
            dataIndex: 'geolocationRequests'
        }]
    }
});
