

Ext.define('Traccar.view.dialog.DeviceAccumulatorsController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.deviceAccumulators',

    onSetClick: function () {
        var totalDistance, hours, data = {
            deviceId: this.getView().deviceId
        };
        totalDistance = this.lookupReference('totalDistance');
        if (!isNaN(totalDistance.getRawValue())) {
            data.totalDistance = totalDistance.getValue();
        }
        hours = this.lookupReference('hours');
        if (!isNaN(hours.getRawValue())) {
            data.hours = hours.getValue();
        }
        Ext.Ajax.request({
            scope: this,
            method: 'PUT',
            url: 'api/devices/' + data.deviceId + '/accumulators',
            jsonData: Ext.util.JSON.encode(data),
            callback: function (options, success, response) {
                if (!success) {
                    Traccar.app.showError(response);
                }
            }
        });
        this.closeView();
    }
});
