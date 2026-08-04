
Ext.define('Traccar.store.ReportPeriods', {
    extend: 'Ext.data.Store',
    fields: ['key', 'name'],

    data: [{
        key: 'custom',
        name: Strings.reportCustom
    }, {
        key: 'today',
        name: Strings.reportToday
    }, {
        key: 'yesterday',
        name: Strings.reportYesterday
    }, {
        key: 'thisWeek',
        name: Strings.reportThisWeek
    }, {
        key: 'previousWeek',
        name: Strings.reportPreviousWeek
    }, {
        key: 'thisMonth',
        name: Strings.reportThisMonth
    }, {
        key: 'previousMonth',
        name: Strings.reportPreviousMonth
    }]
});
