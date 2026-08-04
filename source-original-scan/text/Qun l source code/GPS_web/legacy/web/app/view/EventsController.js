

Ext.define('Traccar.view.EventsController', {
    extend: 'Ext.app.ViewController',
    alias: 'controller.events',

    config: {
        listen: {
            controller: {
                '*': {
                    selectdevice: 'deselectEvent',
                    selectreport: 'deselectEvent'
                },
                'map': {
                    deselectfeature: 'deselectFeature'
                }
            },
            store: {
                '#Events': {
                    add: 'onAddEvent'
                }
            }
        }
    },

    init: function () {
        var self = this;
        setInterval(function () {
            self.getView().getView().refresh();
        }, Traccar.Style.refreshPeriod);

        if (Traccar.app.isMobile()) {
            this.lookupReference('hideEventsButton').setHidden(false);
        }
    },

    onRemoveClick: function () {
        var event, positionId;
        event = this.getView().getSelectionModel().getSelection()[0];
        if (event) {
            Ext.getStore('Events').remove(event);
            positionId = event.get('positionId');
            if (positionId && !Ext.getStore('Events').findRecord('positionId', positionId, 0, false, false, true)) {
                Ext.getStore('EventPositions').remove(Ext.getStore('EventPositions').getById(positionId));
            }
        }
    },

    onClearClick: function () {
        Ext.getStore('Events').removeAll();
        Ext.getStore('EventPositions').removeAll();
    },

    onAddEvent: function () {
        if (this.lookupReference('scrollToLastButton').pressed) {
            this.getView().scrollBy(0, Number.POSITIVE_INFINITY, true);
        }
    },

    onScrollToLastClick: function (button, pressed) {
        if (pressed) {
            this.onAddEvent();
        }
    },

    onHideEvents: function () {
        Traccar.app.showEvents(false);
    },


    deselectEvent: function (object) {
        if (object) {
            this.deselectFeature();
        }
    },

    deselectFeature: function () {
        this.getView().getSelectionModel().deselectAll();
    },

    onSelectionChange: function (selection, selected) {
        var event, positionId, position;
        event = selected.length > 0 ? selected[0] : null;
        if (event) {
            positionId = event.get('positionId');
            if (positionId) {
                position = Ext.getStore('EventPositions').getById(positionId);
                if (position) {
                    this.fireEvent('selectevent', position);
                } else {
                    Ext.getStore('EventPositions').load({
                        params: {
                            id: positionId
                        },
                        scope: this,
                        addRecords: true,
                        callback: function (records, operation, success) {
                            if (success && records.length > 0) {
                                this.fireEvent('selectevent', records[0]);
                            }
                        }
                    });
                }
            } else {
                this.fireEvent('selectevent');
            }
        }
        this.lookupReference('removeEventButton').setDisabled(!event);
    }
});
