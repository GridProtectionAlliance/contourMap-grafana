//******************************************************************************************************
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
import * as d3 from "d3";

import * as L from './../lib/leaflet';
import './../css/leaflet.css!';
import { TileServers } from './../js/constants';
//import * as d3Contour from "d3-contour";

//import * as d3Scale from "d3-scale";
//import * as d3Color from "d3-color";
//import * as d3Collection from "d3-collection";

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
        ctrl.panel.mapBackgrounds = Object.keys(TileServers);
        ctrl.panel.mapBackground = (ctrl.panel.mapBackground != undefined ? ctrl.panel.mapBackground : ctrl.panel.mapBackgrounds[0]);
        ctrl.panel.tileServer = _.find(TileServers, function (ts) { return ts.Name == ctrl.panel.mapBackground;});
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

        setTimeout(function () {
            ctrl.createMap();
        }, 300);

        ctrl.metaData = null;
        ctrl.data = [];


    }

    // #region Events from Graphana Handlers
    onInitEditMode() {
        this.addEditorTab('Options', 'public/plugins/gridprotectionalliance-contourmap-panel/partials/editor.html', 2);
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
        //var ctrl = this;

        //if (ctrl.height > ctrl.row.height) ctrl.render();

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

        if (ctrl.metaData == null) {
            ctrl.datasource.getMetaData(data.map(function(x) { return "'" + x.pointtag + "'"; }).join(',')).then(function (metaData) {
                ctrl.metaData = JSON.parse(metaData.data);
                _.each(ctrl.metaData, function (element, index, list) {
                    var datam = _.find(data, function (y) {
                        return element.PointTag == y.pointtag
                    });

                    if (datam.datapoints.length > 0)
                        element.Value = datam.datapoints[datam.datapoints.length - 1][0];
                });
                ctrl.plotSites();
                ctrl.plotContour();

            })
        }
        else {
            _.each(ctrl.metaData, function (element, index, list) {
                var datam = _.find(data, function(x) {
                    return element.pointtag == data.pointtag
                });

                if (datam.datapoints.length > 0)
                    element.Value = datam.datapoints[datam.datapoints.length - 1][0];
            });
            ctrl.plotContour();
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
            radius: 10,             // Radius of the circle marker, in pixels
            stroke: true,           // Whether to draw stroke along the path. Set it to false to disable borders on polygons or circles.
            color: '#3388ff',       // Stroke color
            weight: 3,              // Stroke width in pixels
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
        _.each(ctrl.metaData, function (element, index, list) {
            L.circleMarker([element.Latitude, element.Longitude], options).addTo(ctrl.$scope.mapContainer)
        });
    }

    plotContour() {
        //var values = new Array(parseInt((n * m).toFixed(0))),
        //    m = $(this.$scope.mapContainer._container).height(),
        //    n = $(this.$scope.mapContainer._container).width();

        //values.fill(2);

        //var color = d3.scaleSequential(d3.interpolateMagma)
        //    .domain(d3.extent(values));

        //var contours = d3Contour.contours()
        //    .size([n, m])
        //    .smooth(false)
        //    .thresholds(20);

        //d3.select("svg")
        //    .attr("viewBox", [0, 0, n, m])
        //    .selectAll("path")
        //    .data(contours(values))
        //    .enter().append("path")
        //    .attr("d", d3.geoPath())
        //    .attr("fill", function (d) { return color(d.value); });
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

        var markerGroup = new L.featureGroup(ctrl.$scope.circleMarkers);
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

}

ContourMapCtrl.templateUrl = 'partials/module.html';

