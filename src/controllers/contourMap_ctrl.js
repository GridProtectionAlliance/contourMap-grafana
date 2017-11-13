﻿//******************************************************************************************************
//  contourMap_ctrl.ts - Gbtc
//
//  Copyright © 2017, Grid Protection Alliance.  All Rights Reserved.
//
//  Licensed to the Grid Protection Alliance (GPA) under one or more contributor license agreements. See
//  the NOTICE file distributed with this work for additional information regarding copyright ownership.
//  The GPA licenses this file to you under the MIT License (MIT), the "License"; you may not use this
//  file except in compliance with the License. You may obtain a copy of the License at:
//
//      http://opensource.org/licenses/MIT
//
//  Unless agreed to in writing, the subject software distributed under the License is distributed on an
//  "AS-IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. Refer to the
//  License for the specific language governing permissions and limitations.
//
//  Code Modification History:
//  ----------------------------------------------------------------------------------------------------
//  11/08/2017 - Billy Ernest
//       Generated original version of source code.
//
//******************************************************************************************************

import { MetricsPanelCtrl } from 'app/plugins/sdk'

import _ from 'lodash';
import d3 from "d3";

import * as L from 'leaflet';
import './../css/leaflet.css!';

import { TileServers } from './../js/constants';
import isobands from "@turf/isobands"

export class ContourMapCtrl extends MetricsPanelCtrl {
    constructor($scope, $injector) {
        super($scope, $injector);

        var ctrl = this;

        this.events.on('init-edit-mode', this.onInitEditMode.bind(this));
        this.events.on('panel-teardown', this.onPanelTeardown.bind(this));
        this.events.on('render', this.onRender.bind(this));
        this.events.on('panel-initialized', this.onPanelInitialized.bind(this));
        this.events.on('data-received', this.onDataRecieved.bind(this));
        //this.events.on('data-snapshot-load', console.log('data-snapshot-load'));
        this.events.on('data-error', this.onDataError.bind(this));
        this.events.on('refresh', this.onRefresh.bind(this));


        // Variables for options
        ctrl.TileServers = TileServers;
        ctrl.panel.tileServer = (ctrl.panel.tileServer != undefined ? ctrl.panel.tileServer: TileServers[0]);
        ctrl.panel.maxZoom = (ctrl.panel.tileServer.Options.options.maxZoom != undefined ? ctrl.panel.tileServer.Options.options.maxZoom : 18)
        ctrl.panel.minZoom = (ctrl.panel.tileServer.Options.options.minZoom != undefined ? ctrl.panel.tileServer.Options.options.minZoom : 2)
        ctrl.panel.zoomLevel = (ctrl.panel.zoomLevel != undefined ? ctrl.panel.zoomLevel : ctrl.panel.tileServer.Options.options.maxZoom);
        ctrl.panel.lockMap = (ctrl.panel.lockMap != undefined ? ctrl.panel.lockMap : 'No');
        ctrl.panel.maxLongitude = (ctrl.panel.maxLongitude != undefined ? ctrl.panel.maxLongitude : -125);
        ctrl.panel.maxLatitude = (ctrl.panel.maxLatitude != undefined ? ctrl.panel.maxLatitude : 24);
        ctrl.panel.minLatitude = (ctrl.panel.minLatitude != undefined ? ctrl.panel.minLatitude : 50);
        ctrl.panel.minLongitude = (ctrl.panel.minLongitude != undefined ? ctrl.panel.minLongitude : -66);
        ctrl.panel.useReferenceValue = (ctrl.panel.useReferenceValue != undefined ? ctrl.panel.useReferenceValue : false);
        ctrl.panel.referencePointTag = (ctrl.panel.referencePointTag != undefined ? ctrl.panel.referencePointTag : '');
        ctrl.panel.useAngleMean = (ctrl.panel.useAngleMean != undefined ? ctrl.panel.useAngleMean : false);
        ctrl.panel.angleMeanTimeWindow = (ctrl.panel.angleMeanTimeWindow != undefined ? ctrl.panel.angleMeanTimeWindow : '5');
        ctrl.panel.showLegend = (ctrl.panel.showLegend != undefined ? ctrl.panel.showLegend : false);
        ctrl.panel.useGradient = (ctrl.panel.useGradient != undefined ? ctrl.panel.useGradient : true);
        ctrl.panel.gradientBreakCount = (ctrl.panel.gradientBreakCount != undefined ? ctrl.panel.gradientBreakCount : 10);
        ctrl.panel.gradientStart = (ctrl.panel.gradientStart != undefined ? ctrl.panel.gradientStart : 0);
        ctrl.panel.gradientEnd = (ctrl.panel.gradientEnd != undefined ? ctrl.panel.gradientEnd : 1000);
        ctrl.panel.gradientStartColor = (ctrl.panel.gradientStartColor != undefined ? ctrl.panel.gradientStartColor : 'purple');
        ctrl.panel.gradientEndColor = (ctrl.panel.gradientEndColor != undefined ? ctrl.panel.gradientEndColor : 'red');
        ctrl.panel.gradientSigFigs = (ctrl.panel.gradientSigFigs != undefined ? ctrl.panel.gradientSigFigs : 2);


        ctrl.metaData = null;
        ctrl.data = [];
        ctrl.circleMarkers = [];
        ctrl.contourLayers = null;
        ctrl.$scope.mapContainer == null;
        ctrl.legend = null;


    }

    // #region Events from Graphana Handlers
    onInitEditMode() {
        this.addEditorTab('Options', 'public/plugins/gridprotectionalliance-contourmap-panel/partials/editor.html', 2);
        this.addEditorTab('Colors', 'public/plugins/gridprotectionalliance-contourmap-panel/partials/colors.html', 3);
        console.log('init-edit-mode');
    }

    onPanelTeardown() {
        if (this.map) {
            this.map.off('zoomend');
            this.map.off('moveend');
        }
        console.log('panel-teardown');
    }

    onPanelInitialized() {
        console.log('panel-initialized');
    }

    onRefresh() {
        var ctrl = this;

        if (ctrl.height > ctrl.row.height) ctrl.render();

        console.log('refresh');
    }

    onResize() {
        var ctrl = this;
        console.log('refresh');
    }

    onRender() {
        console.log('render');
    }

    onDataRecieved(data) {
        var ctrl = this;

        if (ctrl.$scope.mapContainer == null) ctrl.createMap();

        if (ctrl.metaData == null || ctrl.panel.editMode) {
            ctrl.metaData = [];
            
            ctrl.datasource.getMetaData(data.map(function(x) { return "'" + x.pointtag + "'"; }).join(',')).then(function (metaData) {
                ctrl.metaData = JSON.parse(metaData.data);
                _.each(ctrl.metaData, function (element, index, list) {
                    var datam = _.find(data, function (y) {
                        return element.PointTag == y.pointtag
                    });

                    if (datam.datapoints.length > 0)
                        element.Value = datam.datapoints.pop()[0];
                });
                ctrl.plotSites();
                ctrl.plotContour(data);

            })
        }
        else {
            _.each(ctrl.metaData, function (element, index, list) {
                var datam = _.find(data, function(x) {
                    return element.pointtag == data.pointtag
                });

                if (datam.datapoints.length > 0)
                    element.Value = datam.datapoints.pop()[0];
            });
            ctrl.plotContour(data);
        }

    }

    onDataError(msg) {
        console.log('data-error');
    }
    // #endregion

    // #region Map and Marker Creation
    createMap() {
        var ctrl = this;

        if (ctrl.$scope.mapContainer == null) {

            var mapOptions = {
                zoomControl: false,
                attributionControl: false,
                boxZoom: false,
                doubleClickZoom: false,
                dragging: (ctrl.panel.lockMap == 'No'),
                zoomDelta: (ctrl.panel.lockMap == 'No' ? 1 : 0),
                minZoom: (ctrl.panel.lockMap == 'No' ? ctrl.panel.minZoom : ctrl.panel.zoomLevel),
                maxZoom: (ctrl.panel.lockMap == 'No' ? ctrl.panel.maxZoom : ctrl.panel.zoomLevel)
            };

            ctrl.$scope.mapContainer = L.map('mapid_' + ctrl.panel.id, mapOptions);
            ctrl.$scope.tileLayer = L.tileLayer(ctrl.panel.tileServer.Options.url, ctrl.panel.tileServer.Options.options);
            ctrl.$scope.tileLayer.addTo(ctrl.$scope.mapContainer);
            ctrl.updateMapView();

            // setup map listeners
            ctrl.$scope.mapContainer.off('zoomend');
            ctrl.$scope.mapContainer.on('zoomend', function (event) {
                ctrl.panel.zoomLevel = ctrl.$scope.mapContainer.getZoom();

                var bounds = ctrl.$scope.mapContainer.getBounds();
                ctrl.panel.maxLongitude = bounds._southWest.lng;
                ctrl.panel.maxLatitude = bounds._northEast.lat;
                ctrl.panel.minLatitude = bounds._southWest.lat;
                ctrl.panel.minLongitude = bounds._northEast.lng;

                ctrl.refresh();
            });
            ctrl.$scope.mapContainer.off('moveend');
            ctrl.$scope.mapContainer.on('moveend', function (event) {
                ctrl.panel.zoomLevel = ctrl.$scope.mapContainer.getZoom();

                var bounds = ctrl.$scope.mapContainer.getBounds();
                ctrl.panel.maxLongitude = bounds._southWest.lng;
                ctrl.panel.maxLatitude = bounds._northEast.lat;
                ctrl.panel.minLatitude = bounds._southWest.lat;
                ctrl.panel.minLongitude = bounds._northEast.lng;

                ctrl.refresh();
            });

        }
    }

    plotSites() {
        var ctrl = this;
        var options = {
            radius: 4,             // Radius of the circle marker, in pixels
            stroke: true,           // Whether to draw stroke along the path. Set it to false to disable borders on polygons or circles.
            color: '#3388ff',       // Stroke color
            weight: 1,              // Stroke width in pixels
            opacity: 1.0,           // Stroke opacity
            lineCap: 'round',       // A string that defines shape to be used at the end of the stroke.
            lineJoin: 'round',      // A string that defines shape to be used at the corners of the stroke.
            dashArray: null,        // A string that defines the stroke dash pattern. Doesn't work on Canvas-powered layers in some old browsers.
            dashOffset: null,       // A string that defines the distance into the dash pattern to start the dash. Doesn't work on Canvas-powered layers in some old browsers.
            fill: true,             // Whether to fill the path with color. Set it to false to disable filling on polygons or circles.
            fillColor: '#3388ff',   // Fill color. Defaults to the value of the color option
            fillOpacity: 0.2,       // Fill opacity.
            fillRule: 'evenodd',    // A string that defines how the inside of a shape is determined.
            bubblingMouseEvents: true,  // When true, a mouse event on this path will trigger the same event on the map (unless L.DomEvent.stopPropagation is used).
            renderer: null,         // Use this specific instance of Renderer for this path. Takes precedence over the map's default renderer.
            className: null         // 	Custom class name set on an element. Only for SVG renderer.
        };

        if (ctrl.circleMarkers.length > 0) ctrl.circleMarkers.map(a => { a.removeFrom(ctrl.$scope.mapContainer)})
        _.each(ctrl.metaData, function (element, index, list) {
            ctrl.circleMarkers.push(L.circleMarker([element.Latitude, element.Longitude], options).addTo(ctrl.$scope.mapContainer));
        });
    }

    plotContour(data) {
        var ctrl = this;

        var m = $(this.$scope.mapContainer._container).height(),
            n = $(this.$scope.mapContainer._container).width(),
            values = new Array(parseInt((n * m).toFixed(0)));

        var geoJson = this.createGeoJson(data);
        var isoband = isobands(geoJson, geoJson.properties.breaks, geoJson.properties);

        if (ctrl.contourLayers != null) ctrl.contourLayers.removeFrom(ctrl.$scope.mapContainer);

        ctrl.contourLayers = L.geoJSON(isoband, {
            style: function (feature) {
                return feature.properties.style
            }
        }).addTo(ctrl.$scope.mapContainer);

        ctrl.addLegend(isoband);

    }

    addLegend(data) {
        var ctrl = this;

        if (ctrl.legend != null) ctrl.legend.remove();

        if (ctrl.panel.showLegend) {
            ctrl.legend = L.control({ position: 'bottomright' });

            ctrl.legend.onAdd = function (map) {

                var div = L.DomUtil.create('div', 'info legend'),
                    labels = data.features.map(a => { return a.properties.Value }),
                    colors = data.features.map(a => { return a.properties.style.fillColor });

                // loop through our density intervals and generate a label with a colored square for each interval
                for (var i = 1; i < labels.length; i++) {
                    div.innerHTML +=
                        '<i style="background:' + colors[i] + '"></i> ' +
                        labels[i] + '<br>';
                }

                return div;
            };

            ctrl.legend.addTo(ctrl.$scope.mapContainer);
        }
    }
    // #endregion

    // #region Options Functions
    changeMapBackground() {
        var ctrl = this;

        ctrl.$scope.tileLayer.remove();
        ctrl.$scope.tileLayer = L.tileLayer(ctrl.panel.tileServer.Options.url, ctrl.panel.tileServer.Options.options);
        ctrl.$scope.tileLayer.addTo(this.$scope.mapContainer);
    }

    updateZoom() {
        var ctrl = this;

        ctrl.$scope.mapContainer.options.minZoom = (ctrl.panel.lockMap == 'No' ? ctrl.panel.minZoom : ctrl.panel.zoomLevel);
        ctrl.$scope.mapContainer.options.maxZoom = (ctrl.panel.lockMap == 'No' ? ctrl.panel.maxZoom : ctrl.panel.zoomLevel);

        ctrl.$scope.mapContainer.setZoom(ctrl.panel.zoomLevel);
    }

    updateMapView() {
        var ctrl = this;

        ctrl.$scope.mapContainer.fitBounds([
            [ctrl.panel.maxLatitude, ctrl.panel.maxLongitude],
            [ctrl.panel.minLatitude, ctrl.panel.minLongitude]
        ]);
    }

    lockMap() {
        var ctrl = this;

        ctrl.$scope.mapContainer.remove();
        ctrl.$scope.mapContainer = null;
        ctrl.createMap();
    }

    boundToMarkers() {
        var ctrl = this;

        var markerGroup = new L.featureGroup(ctrl.circleMarkers);
        if (markerGroup.getBounds().isValid())
            ctrl.$scope.mapContainer.fitBounds(markerGroup.getBounds());

        var bounds = ctrl.$scope.mapContainer.getBounds();
        ctrl.panel.maxLongitude = bounds._southWest.lng;
        ctrl.panel.maxLatitude = bounds._northEast.lat;
        ctrl.panel.minLatitude = bounds._southWest.lat;
        ctrl.panel.minLongitude = bounds._northEast.lng;
    }
    //#endregion

    // #region Angular Tag Functions
    getRange(min, max, step) {
        step = step || 1;
        var input = [];
        for (var i = min; i <= max; i = i + step) {
            input.push(i);
        }
        return input;
    }
    // #endregion

    //#region Misc
    createGeoJson(data) {
        var ctrl = this;
        ctrl.average = this.metaData.map(a => { return a.Value }).reduce((a, b) => { return a + b }) / this.metaData.length;
        var markerGroup = new L.featureGroup(ctrl.circleMarkers);
        var bounds = markerGroup.getBounds();
        var minLng = bounds._southWest.lng;
        var minLat = bounds._southWest.lat;
        var maxLng = bounds._northEast.lng;
        var maxLat = bounds._northEast.lat;

        var gridN = 20;
        var gridM = 20;

        var nStep = Math.abs(maxLng - minLng) / gridN;
        var mStep = Math.abs(maxLat - minLat) / gridM;

        var breaks = [-9999999999];
        var color = d3.scaleLinear()
            .domain([ctrl.panel.gradientStart, ctrl.panel.gradientEnd])
            .range([ctrl.panel.gradientStartColor, ctrl.panel.gradientEndColor])
            .interpolate(d3.interpolateCubehelixLong);

        var styles = [{
            "style": {
                "stroke": 0,
                "fillColor": "white",
                "opacity": 0
            }
        }];

        for (var i = ctrl.panel.gradientStart; i <= ctrl.panel.gradientEnd; i+= (ctrl.panel.gradientEnd - ctrl.panel.gradientStart)/ctrl.panel.gradientBreakCount) {
            breaks.push(i.toFixed(ctrl.panel.gradientSigFigs));
            styles.push({
                "style": {
                    "stroke": 0,
                    "fillColor": color(i)
                }
            })

        }



        var geoJson = {
            "type": 'FeatureCollection',
            "properties": {
                "breaks": breaks,
                "breaksProperties": styles,
                "zProperty": "Value"
            },
            "features": []
        }

        for (var i = minLng - nStep; i <= maxLng + nStep; i += nStep) {
            for (var j = minLat - mStep; j <= maxLat + mStep; j += mStep) {

                var wzSum = 0;
                var wSum = 0;
                _.each(ctrl.metaData, (element, index, list) => {
                    wzSum += Math.abs( element.Value) / Math.pow(ctrl.getDistanceFromLatLonInKm(element.Latitude, element.Longitude, j, i),2);
                    wSum += 1 / Math.pow(ctrl.getDistanceFromLatLonInKm(element.Latitude, element.Longitude, j, i), 2);
                });

                var value = wzSum/wSum;


                if( i < minLng || i > maxLng || j < minLat || j > maxLat) value = -9999999999
                var feature = {
                    "type": "Feature",
                    "properties": { Value: value},
                    "geometry": {
                        "type": "Point",
                        "coordinates": [i, j]
                    }
                };

                geoJson.features.push(feature)
            }
        }

        return geoJson;
    }

    getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        var ctrl = this;

        var R = 6371; // Radius of the earth in km
        var dLat = ctrl.deg2rad(lat2 - lat1);  // deg2rad below
        var dLon = ctrl.deg2rad(lon2 - lon1);
        var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(ctrl.deg2rad(lat1)) * Math.cos(ctrl.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
            ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        var d = R * c; // Distance in km
        return (d < 1 ? 1 : d);
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180)
    }


    //#endregion

}

ContourMapCtrl.templateUrl = 'partials/module.html';

