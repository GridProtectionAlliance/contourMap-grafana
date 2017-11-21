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
import d3 from "d3";
import moment from "moment";

import * as L from 'leaflet';
import './../css/leaflet.css!';

import { TileServers, StatesData } from './../js/constants';
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
        ctrl.panel.showWeather = (ctrl.panel.showWeather != undefined ? ctrl.panel.showWeather : false);

        ctrl.panel.useGradient = (ctrl.panel.useGradient != undefined ? ctrl.panel.useGradient : true);
        ctrl.panel.gradientBreakCount = (ctrl.panel.gradientBreakCount != undefined ? ctrl.panel.gradientBreakCount : 10);
        ctrl.panel.gradientStart = (ctrl.panel.gradientStart != undefined ? ctrl.panel.gradientStart : 0);
        ctrl.panel.gradientEnd = (ctrl.panel.gradientEnd != undefined ? ctrl.panel.gradientEnd : 1000);
        ctrl.panel.gradientStartColor = (ctrl.panel.gradientStartColor != undefined ? ctrl.panel.gradientStartColor : 'purple');
        ctrl.panel.gradientEndColor = (ctrl.panel.gradientEndColor != undefined ? ctrl.panel.gradientEndColor : 'red');
        ctrl.panel.gradientSigFigs = (ctrl.panel.gradientSigFigs != undefined ? ctrl.panel.gradientSigFigs : 2);

        ctrl.panel.ySteps = (ctrl.panel.ySteps != undefined ? ctrl.panel.ySteps : 25);
        ctrl.panel.xSteps = (ctrl.panel.xSteps != undefined ? ctrl.panel.xSteps : 35);
        ctrl.panel.distancePower = (ctrl.panel.distancePower != undefined ? ctrl.panel.distancePower : 2);
        ctrl.panel.overlap = (ctrl.panel.overlap != undefined ? ctrl.panel.overlap : 0);

        ctrl.data = [];
        ctrl.circleMarkers = [];
        ctrl.contourLayers = null;
        ctrl.$scope.mapContainer == null;
        ctrl.legend = null;
        ctrl.stateSvg = null;


    }

    // #region Events from Graphana Handlers
    onInitEditMode() {
        this.addEditorTab('Options', 'public/plugins/gridprotectionalliance-contourmap-panel/partials/editor.html', 2);
        this.addEditorTab('Colors', 'public/plugins/gridprotectionalliance-contourmap-panel/partials/colors.html', 3);
        //console.log('init-edit-mode');
    }

    onPanelTeardown() {
        if (this.map) {
            this.map.off('zoomend');
            this.map.off('moveend');
        }
        //console.log('panel-teardown');
    }

    onPanelInitialized() {
        //console.log('panel-initialized');
    }

    onRefresh() {
        var ctrl = this;

        if (ctrl.height > ctrl.row.height) ctrl.render();

        //console.log('refresh');
    }

    onResize() {
        var ctrl = this;
        //console.log('refresh');
    }

    onRender() {
        console.log('render');

    }

    onDataRecieved(data) {
        var ctrl = this;

        if (ctrl.$scope.mapContainer == null) ctrl.createMap();
        ctrl.plotContourWithD3(data);
    }

    onDataError(msg) {
        //console.log('data-error');
    }

    // ran on dom creation
    link(scope, elem, attr, ctrl) {
        ctrl.$panelContainer = elem.find('.panel-container');
        ctrl.panel.height = ctrl.height;
        
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

    plotContour(data) {
        var geojsonMarkerOptions = {
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

        var ctrl = this;

        if (ctrl.contourLayers != null) ctrl.contourLayers.removeFrom(ctrl.$scope.mapContainer);

        if (data.length < 2) return;

        var geoJson = this.createGeoJson(data);
        var isoband = isobands(geoJson, geoJson.properties.breaks, geoJson.properties);

        ctrl.addLegend(isoband);

        _.each(data, (e, i, l) => {
            var geojsonFeature = {
                "type": "Feature",
                "properties": {
                    "name": e.rootTarget,
                    "popupContent": e.rootTarget + '-' + (e.datapoints.length > 0 ? e.datapoints[e.datapoints.length - 1][0] : "No Data")
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [e.longitude, e.latitude]
                }
            };

            isoband.features.push(geojsonFeature);
        });

        ctrl.contourLayers = L.geoJSON(isoband, {
            style: function (feature) {
                return feature.properties.style
            },
            pointToLayer: function (feature, latlng) {
                return L.circleMarker(latlng, geojsonMarkerOptions);
            },
            onEachFeature: function (feature, layer) {
                if (feature.properties && feature.properties.popupContent) {
                    layer.bindPopup(feature.properties.popupContent);
                }
            }
        }).addTo(ctrl.$scope.mapContainer);


        var date = (data[0].datapoints.length > 0 ? moment(data[0].datapoints[data[0].datapoints.length - 1][1]) : moment());
        var remainder = date.minute() % 5;
        date = moment(date).add(-remainder, "minutes").utc().format("YYYY-MM-DDTHH:mm");

        if (ctrl.ia_wms != null) ctrl.ia_wms.remove();

        if(ctrl.panel.showWeather)
            ctrl.ia_wms = L.tileLayer.wms("https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r-t.cgi?", { layers: "nexrad-n0r-wmst", transparent: true, format: 'image/png', time: date}).addTo(ctrl.$scope.mapContainer);

    }

    plotContourWithD3(data) {
        var ctrl = this;
        var geoJson = this.createGeoJson(data);
        var isoband = isobands(geoJson, geoJson.properties.breaks, geoJson.properties);
        var stateData = d3.geoPath()(StatesData.features[4].geometry)
        // Define the div for the tooltip
        var div = d3.select("#tooltip_" + ctrl.panel.id);

        if (!d3.select('#mapid_' + ctrl.panel.id + ' .leaflet-overlay-pane svg').empty()) d3.select('#mapid_' + ctrl.panel.id + ' .leaflet-overlay-pane svg').remove();
        var svg = d3.select(ctrl.$scope.mapContainer.getPanes().overlayPane).append("svg"),
            g = svg.append("g").attr("class", "leaflet-zoom-hide").attr("clip-path","url(#mask)"),
            transform = d3.geoTransform({ point: projectPoint }),
            path = d3.geoPath().projection(transform),
            clipPath = svg.append('defs').append('clipPath').attr('id', 'mask'),
            fakemask = g.append("path").style('stroke','black').style('fill-opacity', '0'),
            mask = clipPath.append("path");


        // create isobands
        var feature = g.selectAll("path")
            .data(isoband.features)
            .enter()
            .append("path")
            .style("fill", function (d) { return d.properties.style.fillColor })
            .style("opacity", function (d) { return 0.5 });

        // create markers
        var circles = g.selectAll("circle")
            .data(data)
            .enter()
            .append("circle")
            .attr("cx", function (d) { return ctrl.$scope.mapContainer.latLngToLayerPoint(new L.LatLng(d.latitude, d.longitude)).x })
            .attr("cy", function (d) { return ctrl.$scope.mapContainer.latLngToLayerPoint(new L.LatLng(d.latitude, d.longitude)).y })
            .attr("r", "4px")
            .attr("fill", "#3388ff")
            .attr("opacity", "1.0")
            .attr("fill-opacity", "0.2")
            .attr("fill-rule", "evenodd")
            .attr("weight", "1")
            .attr("stroke", true)
            .attr("cursor", "pointer")
            .on("mouseover", function (d) {
                div.transition()
                    .duration(200)
                    .style("opacity", 1);
                div.html(d.rootTarget + "<br/>" + (d.datapoints.length > 0 ? d.datapoints[d.datapoints.length - 1][0].toFixed(4) : "No Data"))
                    .style("left", (event.pageX) + "px")
                    .style("top", (event.pageY - 100) + "px");
            })
            .on("mouseout", function (d) {
                div.transition()
                    .duration(500)
                    .style("opacity", 0);
            });


        var geojsonMarkerOptions = {
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

        ctrl.$scope.mapContainer.on("viewreset", reset);
        reset();

        // Reposition the SVG to cover the features.
        function reset() {
            var bounds = path.bounds(isoband),
                topLeft = bounds[0],
                bottomRight = bounds[1];

            svg.attr("width", bottomRight[0] - topLeft[0])
                .attr("height", bottomRight[1] - topLeft[1])
                .style("left", topLeft[0] + "px")
                .style("top", topLeft[1] + "px");

            feature.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");
            feature.attr("d", path);
            circles.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");
            mask.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");
            fakemask.attr("d", path(StatesData.features[4]));
            mask.attr("d", path(StatesData.features[4]));

        }


        function projectPoint(x, y) {
            var point = ctrl.$scope.mapContainer.latLngToLayerPoint(new L.LatLng(y, x));
            this.stream.point(point.x, point.y);
        }
    }

    addLegend(data) {
        var ctrl = this;

        if (ctrl.legend != null)
            ctrl.legend.remove();

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

        var minLng = d3.min(data, function (a) { return a.longitude });
        var minLat = d3.min(data, function (a) { return a.latitude  });
        var maxLng = d3.max(data, function (a) { return a.longitude });
        var maxLat = d3.max(data, function (a) { return a.latitude });

        var overlapLat = (maxLat - minLat) * ctrl.panel.overlap/100;
        var overlapLng = (maxLng - minLng) * ctrl.panel.overlap/100;

        minLng -= overlapLng;
        maxLng += overlapLng;
        minLat -= overlapLat;
        maxLat += overlapLat;

        var gridN = ctrl.panel.xSteps;
        var gridM = ctrl.panel.ySteps;
        var pow = ctrl.panel.distancePower;

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
                _.each(data, (element, index, list) => {
                    var val = element.datapoints[element.datapoints.length - 1][0];
                    if (isNaN(val))
                        return;
                    wzSum += val / Math.pow(ctrl.getDistanceFromLatLonInKm(element.latitude, element.longitude, j, i),pow);
                    wSum += 1 / Math.pow(ctrl.getDistanceFromLatLonInKm(element.latitude, element.longitude, j, i),pow);
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

    project(x) {
        var ctrl = this;
        var point = ctrl.$scope.mapContainer.latLngToLayerPoint(new L.LatLng(x[1], x[0]));
        return [point.x, point.y];
    }
    //#endregion

}

ContourMapCtrl.templateUrl = 'partials/module.html';

