

Ext.define('Traccar.view.dialog.Login', {
    extend: 'Traccar.view.dialog.Base',
    alias: 'widget.login',

    requires: [
        'Traccar.view.dialog.LoginController'
    ],

    controller: 'login',

    header: false,
    closable: false,

    items: {
        xtype: 'form',
        reference: 'form',

        autoEl: {
            tag: 'form',
            method: 'POST',
            action: 'fake-login.html',
            target: 'submitTarget'
        },

        items: [{
            xtype: 'image',
            src: 'logo.svg',
            alt: Strings.loginLogo,
            width: 240,
            height: 64,
            style: {
                display: 'block',
                margin: '10px auto 25px'
            }
        }, {
            xtype: 'pickerfield',
            fieldLabel: Strings.settingsServer,
            editable: false,
            value: window.location.host,
            hidden: !window.appInterface && !(window.webkit && window.webkit.messageHandlers.appInterface),
            createPicker: function () {
                var self = this, popup = Ext.create({
                    xtype: 'window',
                    closeAction: 'hide',
                    referenceHolder: true,
                    minWidth: 204,
                    layout: 'form',
                    header: false,
                    resizable: true,
                    items: [{
                        xtype: 'textfield',
                        anchor: '100%',
                        reference: 'serverAddress',
                        value: window.location.href
                    }],
                    fbar: [{
                        text: Strings.sharedSet,
                        handler: function () {
                            var message = 'server|' + popup.lookupReference('serverAddress').getValue();
                            if (window.webkit && window.webkit.messageHandlers.appInterface) {
                                window.webkit.messageHandlers.appInterface.postMessage(message);
                            }
                            if (window.appInterface) {
                                window.appInterface.postMessage(message);
                            }
                        }
                    }, {
                        text: Strings.sharedCancel,
                        handler: function () {
                            self.collapse();
                        }
                    }]
                });
                return popup;
            }
        }, {
            xtype: 'combobox',
            name: 'language',
            fieldLabel: Strings.loginLanguage,
            store: 'Languages',
            displayField: 'name',
            valueField: 'code',
            editable: false,
            submitValue: false,
            listeners: {
                select: 'onSelectLanguage'
            },
            reference: 'languageField'
        }, {
            xtype: 'textfield',
            name: 'email',
            reference: 'userField',
            fieldLabel: Strings.userEmail,
            allowBlank: false,
            enableKeyEvents: true,
            listeners: {
                specialKey: 'onSpecialKey',
                afterrender: 'onAfterRender'
            },
            inputAttrTpl: ['autocomplete="on" autocapitalize="none"']
        }, {
            xtype: 'textfield',
            name: 'password',
            reference: 'passwordField',
            fieldLabel: Strings.userPassword,
            inputType: 'password',
            allowBlank: false,
            enableKeyEvents: true,
            listeners: {
                specialKey: 'onSpecialKey'
            },
            inputAttrTpl: ['autocomplete="on"']
        }, {
            xtype: 'component',
            html: '<iframe id="submitTarget" name="submitTarget" style="display:none"></iframe>'
        }, {
            xtype: 'component',
            html: '<input type="submit" id="submitButton" style="display:none">'
        }]
    },

    buttons: [{
        text: Strings.loginReset,
        handler: 'onResetClick',
        reference: 'resetButton'
    }, {
        text: Strings.loginRegister,
        handler: 'onRegisterClick',
        reference: 'registerButton'
    }, {
        text: Strings.loginLogin,
        handler: 'onLoginClick'
    }]
});
