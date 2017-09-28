function initMap() {
    var map = new google.maps.Map(document.getElementById('stations-map'), {
        center: {lat: 43.653226, lng: -79.3831843},
        zoom: 13,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    // Create the search box and link it to the UI element.
    var input = document.getElementById('pac-input');
    var searchBox = new google.maps.places.SearchBox(input);
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

    map.controls[google.maps.ControlPosition.RIGHT_TOP].push(document.getElementById('legend'));

    // Create legend for Markers
    var legend = document.getElementById('legend');

    var legendStyles= [
        {name: 'Available Bike = 0', icon: "/images/cycling-wht.png"},
        {name: 'Available Bike <= Available Docs', icon: "/images/cycling-ylw.png"},
        {name: 'Available Bike > Available Docs', icon: "/images/cycling-orange.png"},
        {name: 'Available Docs = 0', icon: "/images/cycling-red.png"}
    ];

    for (var i = 0; i < legendStyles.length; i++) {
        var name = legendStyles[i].name;
        var icon = legendStyles[i].icon;
        var div = document.createElement('div');
        div.innerHTML = '<img src="' + icon + '"> ' + name;
        legend.appendChild(div);
    }

    stationManager(map, searchBox); 
}

function stationManager(map, searchBox) {

    // Private:

    var _self = this;

    // Public

    this.infowindow = new google.maps.InfoWindow({});
    // Backbone template
    this.fTemplate = _.template(jQuery('#station-detail-template').html());

    this.canSearch = function(searchBox) {
        // Bias the SearchBox results towards current map's viewport.
        map.addListener('bounds_changed', function() {
            searchBox.setBounds(map.getBounds());
        });

        var markers = [];

        // Listen for change in searcbox input area
        $("#pac-input").off('focus.input').on('focus.input', function(e) {
            $(this).val('');
        });

        // Listen for the event fired when the user selects a prediction and retrieve
        // more details for that place.

        searchBox.addListener('places_changed', function() {
            var places = searchBox.getPlaces();

            if (places.length == 0) {
              return;
            }

            // Clear out the old markers.
            markers.forEach(function(marker) {
              marker.setMap(null);
            });

            // For each place, get the icon, name and location.
            var bounds = new google.maps.LatLngBounds();
            places.forEach(function(place) {
                var icon = {
                    url: place.icon,
                    size: new google.maps.Size(90, 90),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(17, 34),
                    scaledSize: new google.maps.Size(25, 25)
                };
                // Create a marker for each place.
                markers.push(new google.maps.Marker({
                    map: map,
                    icon: icon,
                    title: place.name,
                    position: place.geometry.location
                }));

                if (place.geometry.viewport) {
                    // Only geocodes have viewport.
                    bounds.union(place.geometry.viewport);
                } else {
                    bounds.extend(place.geometry.location);
                }              
            });
            map.fitBounds(bounds);
            var zoom = map.getZoom();
            map.setZoom(zoom > 14 ? 14 : zoom);
        });
    }

    this.createOption = function(value, name) {
        var option = document.createElement('option');
        option.value = value;
        option.text = name;
        return option;
    }

    this.createMarker = function(station) {
        // Create a point with Google LatLng object to pass to marker
        var point = new google.maps.LatLng(station.latitude, station.longitude);

        var iconBase = '../images/';
        var iconSuffix;

        if (station.availableBikes == 0 && station.availableDocks > 0) {
            iconSuffix = 'cycling-wht.png';
        } else if (station.availableBikes <= station.availableDocks && station.availableBikes > 0) {
            iconSuffix = 'cycling-ylw.png';
        } else if (station.availableBikes > station.availableDocks && station.availableDocks > 0) {
            iconSuffix = 'cycling-orange.png';
        } else {
            iconSuffix = 'cycling-red.png';
        }

        // Create the Google Marker Point with the LatLng object
        var marker = new google.maps.Marker({
            position : point,
            map : map,
            title : station.stationName,
            icon : {
                url: iconBase + iconSuffix,
                origin: new google.maps.Point(0, 0),
                //anchor: new google.maps.Point(parseFloat(25),parseFloat(25)),
                scaledSize: new google.maps.Size(parseFloat(30),parseFloat(35))
            }
        });
        return marker;
    }

    this.createInfoWindow = function(name, statusValue, availableBikes, availableDocks) {
        var contentString=
            '<div class="station-window">' +
                // Sets a temporary padding, this helps the station name stay on all one line. Google maps doesn't like the text-transform:uppercase without this
                '<h2 class="temp-padding" style="padding-right: 1.5em">' + name + '</h2>' +
                //Show small message if the station is planned or show the details table
                (statusValue == 'Planned' ? "<i>(planned station)</i>" :
                    //if we have don't have sponsorship info:....
                    '<div class="station-data">' +
                        '<table id="station-table">' + 
                            '<tr><th>Available Bikes:</th><td>' + availableBikes + '</td></tr>' +
                            '<tr><th>Available Docks:</th><td>' + availableDocks + '</td></tr>' +
                        '</table>'  +
                    '</div>'
                ) +
            '</div>';

        var div = document.createElement('div');
        div.innerHTML = contentString;

        // Set the content in the infowindow
        var stationInfoWindow = _self.infowindow.setContent(div);

        return stationInfoWindow;
    }

    this.addCssToInfoWindow = function() {
        // Resets the h2 padding back to zero
        $('.temp-padding').css('padding-right', '0');

        // Get the height of the table, to base the margin of the image and the table off of one another
        var table_height = $('#station-table').height();

        // Set the top margin of the table to a relative value of the image size, if the table is smaller than the image
        var table_margin = ($('.sponsor-img').attr("height") - table_height) / 2;
        table_margin = Math.max(table_margin, 0);
        $('.station-data-w-table').css('margin-top', table_margin);

        // Set the top margin of the image to a relative value of the table size, if the image is smaller than the table
        var img_margin = (table_height - $('.sponsor-img').attr("height")) / 2;
        img_margin = Math.max(img_margin, 0);
        $('.sponsor-img').css('margin-top', img_margin);
    }

    this.changeStationListDetail = function(stationList) {
        //Change the details about stations
        $('#stations-list').change(function() {
            var selectedStationIndex = $(this).val();
            $("#station-details").html(_self.fTemplate($(stationList)[selectedStationIndex]));
        });
    }

    this.getStations = function() {
        jQuery.ajax("/torontoBikes").done(function(data){
            $(data.stationBeanList).each(function(i, station) {
                //Station Details
                var name = station.stationName;
                var lat = station.latitude;
                var lng = station.longitude;
                var availableBikes = station.availableBikes;
                var availableDocks = station.availableDocks;
                var statusValue = station.statusValue;

                //Create option list to select station by name
                var option = _self.createOption(i, name);
                $('#stations-list').append($(option));

                if (statusValue != 'Not In Service'  ) {
                    var marker = _self.createMarker(station);
                    var point = marker.position;

                    // Create a new instance of LatLngBounds to use for re-centering the map after all the stations are loaded
                    var bounds = new google.maps.LatLngBounds();

                    // Add an Event Listener that pops up the infoWindow when a user clicks a station
                    google.maps.event.addListener(marker, 'click', function() {
                        //Create info Window
                        _self.createInfoWindow(name, statusValue, availableBikes, availableDocks);

                        // Open the InfoWindow
                        _self.infowindow.open(map, marker);

                        // Add an event listener that runs when the station infowindow is fully popped-up.
                        google.maps.event.addListener(_self.infowindow, 'domready', function() {
                            _self.addCssToInfoWindow();
                        });
                    });
                    bounds.extend(point);
                }
            });
            //Change the details about stations
            _self.changeStationListDetail(data.stationBeanList);

        }).fail(function(err){
            alert(err);
        });
    }
    _self.canSearch(searchBox);
    _self.getStations();

}

google.maps.event.addDomListener(window, 'load', initMap);