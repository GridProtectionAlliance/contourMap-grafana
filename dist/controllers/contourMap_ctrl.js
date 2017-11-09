'use strict';

System.register(['app/plugins/sdk', 'lodash', 'd3', './../lib/leaflet', './../css/leaflet.css!', './../js/constants'], function (_export, _context) {
    "use strict";

    var MetricsPanelCtrl, _, d3, L, TileServers, _createClass, ContourMapCtrl;

    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    function _inherits(subClass, superClass) {
        if (typeof superClass !== "function" && superClass !== null) {
            throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
        }

        subClass.prototype = Object.create(superClass && superClass.prototype, {
            constructor: {
                value: subClass,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });
        if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
    }

    return {
        setters: [function (_appPluginsSdk) {
            MetricsPanelCtrl = _appPluginsSdk.MetricsPanelCtrl;
        }, function (_lodash) {
            _ = _lodash.default;
        }, function (_d) {
            d3 = _d;
        }, function (_libLeaflet) {
            L = _libLeaflet;
        }, function (_cssLeafletCss) {}, function (_jsConstants) {
            TileServers = _jsConstants.TileServers;
        }],
        execute: function () {
            _createClass = function () {
                function defineProperties(target, props) {
                    for (var i = 0; i < props.length; i++) {
                        var descriptor = props[i];
                        descriptor.enumerable = descriptor.enumerable || false;
                        descriptor.configurable = true;
                        if ("value" in descriptor) descriptor.writable = true;
                        Object.defineProperty(target, descriptor.key, descriptor);
                    }
                }

                return function (Constructor, protoProps, staticProps) {
                    if (protoProps) defineProperties(Constructor.prototype, protoProps);
                    if (staticProps) defineProperties(Constructor, staticProps);
                    return Constructor;
                };
            }();

            _export('ContourMapCtrl', ContourMapCtrl = function (_MetricsPanelCtrl) {
                _inherits(ContourMapCtrl, _MetricsPanelCtrl);

                function ContourMapCtrl($scope, $injector) {
                    _classCallCheck(this, ContourMapCtrl);

                    var _this = _possibleConstructorReturn(this, (ContourMapCtrl.__proto__ || Object.getPrototypeOf(ContourMapCtrl)).call(this, $scope, $injector));

                    var ctrl = _this;

                    _this.events.on('init-edit-mode', _this.onInitEditMode.bind(_this));
                    _this.events.on('panel-teardown', _this.onPanelTeardown.bind(_this));
                    _this.events.on('render', _this.onRender.bind(_this));
                    _this.events.on('panel-initialized', _this.onPanelInitialized.bind(_this));
                    _this.events.on('data-received', _this.onDataRecieved.bind(_this));
                    //this.events.on('data-snapshot-load', console.log('data-snapshot-load'));
                    _this.events.on('data-error', _this.onDataError.bind(_this));
                    _this.events.on('refresh', _this.onRefresh.bind(_this));

                    // Variables for options
                    ctrl.panel.mapBackgrounds = Object.keys(TileServers);
                    ctrl.panel.mapBackground = ctrl.panel.mapBackground != undefined ? ctrl.panel.mapBackground : ctrl.panel.mapBackgrounds[0];
                    ctrl.panel.tileServer = _.find(TileServers, function (ts) {
                        return ts.Name == ctrl.panel.mapBackground;
                    });
                    ctrl.panel.maxZoom = ctrl.panel.tileServer.Options.options.maxZoom != undefined ? ctrl.panel.tileServer.Options.options.maxZoom : 18;
                    ctrl.panel.minZoom = ctrl.panel.tileServer.Options.options.minZoom != undefined ? ctrl.panel.tileServer.Options.options.minZoom : 2;
                    ctrl.panel.zoomLevel = ctrl.panel.zoomLevel != undefined ? ctrl.panel.zoomLevel : ctrl.panel.tileServer.Options.options.maxZoom;
                    ctrl.panel.lockMap = ctrl.panel.lockMap != undefined ? ctrl.panel.lockMap : 'No';
                    ctrl.panel.maxLongitude = ctrl.panel.maxLongitude != undefined ? ctrl.panel.maxLongitude : -125;
                    ctrl.panel.maxLatitude = ctrl.panel.maxLatitude != undefined ? ctrl.panel.maxLatitude : 24;
                    ctrl.panel.minLatitude = ctrl.panel.minLatitude != undefined ? ctrl.panel.minLatitude : 50;
                    ctrl.panel.minLongitude = ctrl.panel.minLongitude != undefined ? ctrl.panel.minLongitude : -66;
                    ctrl.panel.useReferenceValue = ctrl.panel.useReferenceValue != undefined ? ctrl.panel.useReferenceValue : false;
                    ctrl.panel.referencePointTag = ctrl.panel.referencePointTag != undefined ? ctrl.panel.referencePointTag : '';
                    ctrl.panel.useAngleMean = ctrl.panel.useAngleMean != undefined ? ctrl.panel.useAngleMean : false;
                    ctrl.panel.angleMeanTimeWindow = ctrl.panel.angleMeanTimeWindow != undefined ? ctrl.panel.angleMeanTimeWindow : '5';
                    ctrl.panel.showLegend = ctrl.panel.showLegend != undefined ? ctrl.panel.showLegend : false;

                    setTimeout(function () {
                        ctrl.createMap();
                    }, 300);

                    ctrl.metaData = null;
                    ctrl.data = [];

                    return _this;
                }

                // #region Events from Graphana Handlers


                _createClass(ContourMapCtrl, [{
                    key: 'onInitEditMode',
                    value: function onInitEditMode() {
                        this.addEditorTab('Options', 'public/plugins/gridprotectionalliance-contourmap-panel/partials/editor.html', 2);
                        console.log('init-edit-mode');
                    }
                }, {
                    key: 'onPanelTeardown',
                    value: function onPanelTeardown() {
                        if (this.map) {
                            this.map.off('zoomend');
                            this.map.off('moveend');
                        }
                        console.log('panel-teardown');
                    }
                }, {
                    key: 'onPanelInitialized',
                    value: function onPanelInitialized() {
                        console.log('panel-initialized');
                    }
                }, {
                    key: 'onRefresh',
                    value: function onRefresh() {
                        //var ctrl = this;

                        //if (ctrl.height > ctrl.row.height) ctrl.render();

                        console.log('refresh');
                    }
                }, {
                    key: 'onResize',
                    value: function onResize() {
                        var ctrl = this;
                        console.log('refresh');
                    }
                }, {
                    key: 'onRender',
                    value: function onRender() {
                        console.log('render');
                    }
                }, {
                    key: 'onDataRecieved',
                    value: function onDataRecieved(data) {
                        var ctrl = this;

                        if (ctrl.metaData == null) {
                            ctrl.datasource.getMetaData(data.map(function (x) {
                                return "'" + x.pointtag + "'";
                            }).join(',')).then(function (metaData) {
                                ctrl.metaData = JSON.parse(metaData.data);
                                _.each(ctrl.metaData, function (element, index, list) {
                                    var datam = _.find(data, function (y) {
                                        return element.PointTag == y.pointtag;
                                    });

                                    if (datam.datapoints.length > 0) element.Value = datam.datapoints[datam.datapoints.length - 1][0];
                                });
                                ctrl.plotSites();
                                ctrl.plotContour();
                            });
                        } else {
                            _.each(ctrl.metaData, function (element, index, list) {
                                var datam = _.find(data, function (x) {
                                    return element.pointtag == data.pointtag;
                                });

                                if (datam.datapoints.length > 0) element.Value = datam.datapoints[datam.datapoints.length - 1][0];
                            });
                            ctrl.plotContour();
                        }
                    }
                }, {
                    key: 'onDataError',
                    value: function onDataError(msg) {
                        console.log('data-error');
                    }
                }, {
                    key: 'createMap',
                    value: function createMap() {
                        var ctrl = this;

                        if (ctrl.$scope.mapContainer == null) {

                            var mapOptions = {
                                zoomControl: false,
                                attributionControl: false,
                                boxZoom: false,
                                doubleClickZoom: false,
                                dragging: ctrl.panel.lockMap == 'No',
                                zoomDelta: ctrl.panel.lockMap == 'No' ? 1 : 0,
                                minZoom: ctrl.panel.lockMap == 'No' ? ctrl.panel.minZoom : ctrl.panel.zoomLevel,
                                maxZoom: ctrl.panel.lockMap == 'No' ? ctrl.panel.maxZoom : ctrl.panel.zoomLevel
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
                }, {
                    key: 'plotSites',
                    value: function plotSites() {
                        var ctrl = this;
                        var options = {
                            radius: 10, // Radius of the circle marker, in pixels
                            stroke: true, // Whether to draw stroke along the path. Set it to false to disable borders on polygons or circles.
                            color: '#3388ff', // Stroke color
                            weight: 3, // Stroke width in pixels
                            opacity: 1.0, // Stroke opacity
                            lineCap: 'round', // A string that defines shape to be used at the end of the stroke.
                            lineJoin: 'round', // A string that defines shape to be used at the corners of the stroke.
                            dashArray: null, // A string that defines the stroke dash pattern. Doesn't work on Canvas-powered layers in some old browsers.
                            dashOffset: null, // A string that defines the distance into the dash pattern to start the dash. Doesn't work on Canvas-powered layers in some old browsers.
                            fill: true, // Whether to fill the path with color. Set it to false to disable filling on polygons or circles.
                            fillColor: '#3388ff', // Fill color. Defaults to the value of the color option
                            fillOpacity: 0.2, // Fill opacity.
                            fillRule: 'evenodd', // A string that defines how the inside of a shape is determined.
                            bubblingMouseEvents: true, // When true, a mouse event on this path will trigger the same event on the map (unless L.DomEvent.stopPropagation is used).
                            renderer: null, // Use this specific instance of Renderer for this path. Takes precedence over the map's default renderer.
                            className: null // 	Custom class name set on an element. Only for SVG renderer.
                        };
                        _.each(ctrl.metaData, function (element, index, list) {
                            L.circleMarker([element.Latitude, element.Longitude], options).addTo(ctrl.$scope.mapContainer);
                        });
                    }
                }, {
                    key: 'plotContour',
                    value: function plotContour() {}
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

                    // #endregion

                    // #region Options Functions

                }, {
                    key: 'changeMapBackground',
                    value: function changeMapBackground() {
                        var ctrl = this;

                        ctrl.$scope.tileLayer.remove();
                        ctrl.$scope.tileLayer = L.tileLayer(ctrl.panel.tileServer.Options.url, ctrl.panel.tileServer.Options.options);
                        ctrl.$scope.tileLayer.addTo(this.$scope.mapContainer);
                    }
                }, {
                    key: 'updateZoom',
                    value: function updateZoom() {
                        var ctrl = this;

                        ctrl.$scope.mapContainer.options.minZoom = ctrl.panel.lockMap == 'No' ? ctrl.panel.minZoom : ctrl.panel.zoomLevel;
                        ctrl.$scope.mapContainer.options.maxZoom = ctrl.panel.lockMap == 'No' ? ctrl.panel.maxZoom : ctrl.panel.zoomLevel;

                        ctrl.$scope.mapContainer.setZoom(ctrl.panel.zoomLevel);
                    }
                }, {
                    key: 'updateMapView',
                    value: function updateMapView() {
                        var ctrl = this;

                        ctrl.$scope.mapContainer.fitBounds([[ctrl.panel.maxLatitude, ctrl.panel.maxLongitude], [ctrl.panel.minLatitude, ctrl.panel.minLongitude]]);
                    }
                }, {
                    key: 'lockMap',
                    value: function lockMap() {
                        var ctrl = this;

                        ctrl.$scope.mapContainer.remove();
                        ctrl.$scope.mapContainer = null;
                        ctrl.createMap();
                    }
                }, {
                    key: 'boundToMarkers',
                    value: function boundToMarkers() {
                        var ctrl = this;

                        var markerGroup = new L.featureGroup(ctrl.$scope.circleMarkers);
                        if (markerGroup.getBounds().isValid()) ctrl.$scope.mapContainer.fitBounds(markerGroup.getBounds());

                        var bounds = ctrl.$scope.mapContainer.getBounds();
                        ctrl.panel.maxLongitude = bounds._southWest.lng;
                        ctrl.panel.maxLatitude = bounds._northEast.lat;
                        ctrl.panel.minLatitude = bounds._southWest.lat;
                        ctrl.panel.minLongitude = bounds._northEast.lng;
                    }
                }, {
                    key: 'getRange',
                    value: function getRange(min, max, step) {
                        step = step || 1;
                        var input = [];
                        for (var i = min; i <= max; i = i + step) {
                            input.push(i);
                        }
                        return input;
                    }
                }]);

                return ContourMapCtrl;
            }(MetricsPanelCtrl));

            _export('ContourMapCtrl', ContourMapCtrl);

            ContourMapCtrl.templateUrl = 'partials/module.html';
        }
    };
});
//# sourceMappingURL=contourMap_ctrl.js.map
