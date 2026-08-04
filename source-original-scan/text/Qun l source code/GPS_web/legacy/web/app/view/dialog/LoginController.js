

Ext.define('Traccar.view.dialog.LoginController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.login',

    requires: [
        'Traccar.view.dialog.Register'
    ],

    init: function () {
        this.lookupReference('resetButton').setHidden(!Traccar.app.getServer().get('emailEnabled'));
        this.lookupReference('registerButton').setDisabled(!Traccar.app.getServer().get('registration'));
        this.lookupReference('languageField').setValue(Locale.language);
    },

    login: function () {
        var form = this.lookupReference('form');
        if (form.isValid()) {
            Ext.get('spinner').setVisible(true);
            this.getView().setVisible(false);
            Ext.Ajax.request({
                scope: this,
                method: 'POST',
                url: 'api/session',
                params: form.getValues(),
                callback: function (options, success, response) {
                    Ext.get('spinner').setVisible(false);
                    if (success) {
                        Traccar.app.setUser(Ext.decode(response.responseText));
                        this.fireViewEvent('login');
                    } else {
                        this.getView().setVisible(true);
                        if (response.status === 401) {
                            Traccar.app.showError(Strings.loginFailed);
                        } else {
                            Traccar.app.showError(response.responseText);
                        }
                    }
                }
            });
        }
    },

    logout: function () {
        Ext.util.Cookies.clear('user');
        Ext.util.Cookies.clear('password');
        Ext.Ajax.request({
            scope: this,
            method: 'DELETE',
            url: 'api/session',
            callback: function () {
                window.location.reload();
            }
        });
    },

    onSelectLanguage: function (selected) {
        var paramName, paramValue, url, prefix, suffix;
        paramName = 'locale';
        paramValue = selected.getValue();
        url = window.location.href;
        if (url.indexOf(paramName + '=') >= 0) {
            prefix = url.substring(0, url.indexOf(paramName));
            suffix = url.substring(url.indexOf(paramName));
            suffix = suffix.substring(suffix.indexOf('=') + 1);
            suffix = suffix.indexOf('&') >= 0 ? suffix.substring(suffix.indexOf('&')) : '';
            url = prefix + paramName + '=' + paramValue + suffix;
        } else if (url.indexOf('?') < 0) {
            url += '?' + paramName + '=' + paramValue;
        } else {
            url += '&' + paramName + '=' + paramValue;
        }
        window.location.href = url;
    },

    onAfterRender: function (field) {
        field.focus();
    },

    onSpecialKey: function (field, e) {
        if (e.getKey() === e.ENTER) {
            this.login();
        }
    },

    onLoginClick: function () {
        Ext.getElementById('submitButton').click();
        this.login();
    },

    onRegisterClick: function () {
        Ext.create('Traccar.view.dialog.Register').show();
    },

    onResetClick: function () {
        Ext.Msg.prompt(Strings.loginReset, Strings.userEmail, function (btn, text) {
            if (btn === 'ok') {
                Ext.Ajax.request({
                    scope: this,
                    method: 'POST',
                    url: 'api/password/reset',
                    params: {
                        email: text
                    },
                    callback: function (options, success, response) {
                        if (success) {
                            Traccar.app.showToast(Strings.loginResetSuccess);
                        } else {
                            Traccar.app.showError(response.responseText);
                        }
                    }
                });
            }
        });
    }
});
