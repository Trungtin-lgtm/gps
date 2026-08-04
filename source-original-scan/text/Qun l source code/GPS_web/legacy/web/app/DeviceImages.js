
Ext.define('Traccar.DeviceImages', {
    singleton: true,

    getImageSvg: function (color, zoom, angle, category) {
        var i, info, svg, width, height, rotateTransform, scaleTransform, fill;

        info = Ext.getStore('DeviceImages').findRecord('key', category || 'default', 0, false, false, true);
        svg = Ext.clone(info.get('svg'));
        if (!svg) {
            svg = this.cloneDocument(info.get('svg'));
        }

        width = parseFloat(svg.documentElement.getAttribute('width'));
        height = parseFloat(svg.documentElement.getAttribute('height'));

        fill = info.get('fillId');
        if (!Ext.isArray(fill)) {
            fill = [fill];
        }
        for (i = 0; i < fill.length; i++) {
            svg.getElementById(fill[i]).style.fill = color;
        }

        rotateTransform = 'rotate(' + angle + ' ' + width / 2 + ' ' + height / 2 + ')';
        svg.getElementById(info.get('rotateId')).setAttribute('transform', rotateTransform);

        if (zoom) {
            width *= Traccar.Style.mapScaleSelected;
            height *= Traccar.Style.mapScaleSelected;
            scaleTransform = 'scale(' + Traccar.Style.mapScaleSelected + ') ';
        } else {
            width *= Traccar.Style.mapScaleNormal;
            height *= Traccar.Style.mapScaleNormal;
            scaleTransform = 'scale(' + Traccar.Style.mapScaleNormal + ') ';
        }

        if (info.get('scaleId') !== info.get('rotateId')) {
            svg.getElementById(info.get('scaleId')).setAttribute('transform', scaleTransform);
        } else {
            svg.getElementById(info.get('scaleId')).setAttribute('transform', scaleTransform + ' ' + rotateTransform);
        }

        svg.documentElement.setAttribute('width', width);
        svg.documentElement.setAttribute('height', height);
        svg.documentElement.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

        return svg;
    },

    formatSrc: function (svg) {
        return 'data:image/svg+xml;charset=utf-8,' +
                encodeURIComponent(new XMLSerializer().serializeToString(svg.documentElement));
    },

    cloneDocument: function (svgDocument) {
        var newDocument, newNode;
        newDocument = svgDocument.implementation.createDocument(svgDocument.namespaceURI, null, null);
        newNode = newDocument.importNode(svgDocument.documentElement, true);
        newDocument.appendChild(newNode);
        return newDocument;
    },

    getImageIcon: function (color, zoom, angle, category) {
        var image, svg, width, height;

        svg = this.getImageSvg(color, zoom, angle, category);
        width = parseFloat(svg.documentElement.getAttribute('width'));
        height = parseFloat(svg.documentElement.getAttribute('height'));

        image = new ol.style.Icon({
            imgSize: [width, height],
            src: this.formatSrc(svg)
        });
        image.fill = color;
        image.zoom = zoom;
        image.angle = angle;
        image.category = category;

        return image;
    }
});
