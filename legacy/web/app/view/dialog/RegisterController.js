

Ext.define('Traccar.view.dialog.RegisterController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.register',

    onCreateClick: function () {
        var form = this.lookupReference('form');
        if (form.isValid()) {
            Ext.Ajax.request({
                scope: this,
                method: 'POST',
                url: 'api/users',
                jsonData: form.getValues(),
                callback: this.onCreateReturn
            });
        }
    },

    onCreateReturn: function (options, success, response) {
        if (success) {
            this.closeView();
            Traccar.app.showToast(Strings.loginCreated);
        } else {
            Traccar.app.showError(response);
        }
    }

});
