

Ext.define('Traccar.store.MapTypes', {
    extend: 'Ext.data.Store',
    fields: ['key', 'name'],

    data: [{
        key: 'locationIqStreets',
        name: Strings.mapLocationIqStreets
    }, {
        key: 'osm',
        name: Strings.mapOsm
    }, {
        key: 'carto',
        name: Strings.mapCarto
    }, {
        key: 'autoNavi',
        name: Strings.mapAutoNavi
    }, {
        key: 'bingRoad',
        name: Strings.mapBingRoad
    }, {
        key: 'bingAerial',
        name: Strings.mapBingAerial
    }, {
        key: 'bingHybrid',
        name: Strings.mapBingHybrid
    }, {
        key: 'yandexMap',
        name: Strings.mapYandexMap
    }, {
        key: 'yandexSat',
        name: Strings.mapYandexSat
    }, {
        key: 'custom',
        name: Strings.mapCustom
    }, {
        key: 'customArcgis',
        name: Strings.mapCustomArcgis
    }]
});
