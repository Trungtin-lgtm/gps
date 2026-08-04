

Ext.define('Traccar.view.ArrayListFilter', {
    extend: 'Ext.grid.filters.filter.List',
    alias: 'grid.filter.arraylist',

    type: 'arraylist',

    constructor: function (config) {
        this.callParent([config]);
        this.filter.setFilterFn(function (item) {
            var i, property, value, splits;
            property = item.get(this.getProperty());
            value = this.getValue();
            if (Ext.isArray(property)) {
                for (i = 0; i < property.length; i++) {
                    if (value.indexOf(property[i]) !== -1) {
                        return true;
                    }
                }
            } else if (property.match(/[ ,]+/)) {
                splits = property.split(/[ ,]+/).filter(Boolean);
                for (i = 0; i < splits.length; i++) {
                    if (value.indexOf(splits[i]) !== -1) {
                        return true;
                    }
                }
            } else if (value.indexOf(property) !== -1) {
                return true;
            }
            return false;
        });
    }
});
