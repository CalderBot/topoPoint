//gloabal constants
var boulder = new google.maps.LatLng( 40.01591464708541, -105.27925729751587 );
var meters2feet = 3.28084;

 // The basic unit of elevation data:
var TopoPoint = function(lat,lng){
	this.lat=lat;
	this.lng=lng;
	this.location={lat:this.lat, lng:this.lng}
	// Data that will be set by the prototype method 'init'
	// Elevation from the google elvation service:
	this.gElev = undefined;
	// Elevation from the National Elevation Database:
	this.NEDElev = undefined;
}


// Error callback for getCurrentLocationAndAltitude
TopoPoint.prototype.handleGeoLocationError = function(error) {
	this.usePosition(boulder);

    switch(error.code) {
        case error.PERMISSION_DENIED:
            alert("You denied the request for geolocation.  If you want to allow geolocation try clicking the target at the right side of your adress bar.  In the meantime, we will start you off in Boulder, CO.")
            break;
        case error.POSITION_UNAVAILABLE:
            console.log("Location information is unavailable. \nCentering map at the default location");
            break;
        case error.TIMEOUT:
            console.log("The request to get user location timed out. \nCentering map at the default location.");
            break;
        case error.UNKNOWN_ERROR:
            console.log("An unknown getCurrentPosition error occurred. \nCentering map at the default location.");
            break;
    }
}

// Set lat/lng, then call getElevations(argCallback). Accepts any object with coord.latitude/longitude, or k/B, or lat/lng as properties. 
TopoPoint.prototype.usePosition = function(position, argCallback){
	// This is the type of object returned by navigator.geolocation.getCurrentPosition
	if(position.coords){
		var lat = position.coords.latitude;
	  	var lng = position.coords.longitude;
	}
	// This type is returned my google maps
	else if(position instanceof google.maps.LatLng){
		var lat = position.k;
		var lng = position.B;
	}
	// This would be if a lat/lng literal was passed in
	else{
		var lat = position.lat;
		var lng = position.lng;
	}
	// Set the values on the topoPoint
	this.lat = lat;
	this.lng = lng;
	this.getElevation(argCallback);
}

// Get elevation by posting request to USGS Elevation Point Query Service:
TopoPoint.prototype.getNEDElev=function(argCallback){
	var self = this;
	if(argCallback){ var boundCallback = argCallback.bind(this); }
	$.post('/getNED',{lat:this.lat,lng:this.lng},function(NEDElevationResponse,status){
		self.NEDElev = NEDElevationResponse.elevation;
		if(boundCallback) boundCallback(NEDElevationResponse,status);		
	})
}

// Callback for request to google elevation service
TopoPoint.prototype.useGElev = function(gElevResult, status){
	if(status == google.maps.ElevationStatus.OK) this.gElev = meters2feet*gElevResult[0].elevation; 
	else handleGElevError(status);
}

// Get elevation using google maps api, then apply callback on success:
TopoPoint.prototype.getGElev = function(argCallback){
	var location = new google.maps.LatLng(this.lat,this.lng);
	var GElevCallback = this.useGElev.bind(this);
	if(argCallback){ var boundCallback = argCallback.bind(this); }
	var combinedCallback = function(gElevResult, status){
		GElevCallback(gElevResult,status);
		if(boundCallback){ boundCallback(gElevResult); }
	}
	// Inititate google elevation get request
	var elevator = new google.maps.ElevationService();
	elevator.getElevationForLocations( {'locations':[location]} , combinedCallback )
}

// Error handler for google.maps.ElevationStatus != 'OK'
TopoPoint.prototype.handleGElevError = function(status){
	switch(status){
		case google.maps.ElevationStatus.INVALID_REQUEST:
			console.log("This google.maps elevation request was invalid.");
			break;
		case google.maps.ElevationStatus.REQUEST_DENIED:
			console.log("The webpage is not allowed to use the elevation service for some reason.");
			break;		
		case google.maps.ElevationStatus.UNKNOWN_ERROR:
			console.log("A geocoding, directions or elevation request could not be successfully processed, yet the exact reason for the failure is not known.");
			break;
	}	
}

// Round a latitude or longitude to 6 decimal places for display
TopoPoint.prototype.roundLoc = function(x){ 
	return Math.round(1000000*x)/1000000; 
}

// List the topoPoint's properties
TopoPoint.prototype.toString = function(){
	return 	"Latitude: "+this.roundLoc(this.lat)+
			"\nLongitude: "+this.roundLoc(this.lng)+ 
			"\nUSGS altitude: "+Math.round(this.NEDElev)+" ft"+
			"\nGoogle altitude: "+Math.round(this.gElev)+" ft";
}

// Create the HTML for an infoWindow when the topoPoint is displayed on a map
TopoPoint.prototype.infoWindowContent = function(){
	return 	'<p> Latitude:  '+this.roundLoc(this.lat)
			+'<br> Longitude: '+this.roundLoc(this.lng)
			+'<br> USGS altitude: '+Math.round(this.NEDElev)+' ft'
			+'<br> Google altitude: '+Math.round(this.gElev)+' ft</p>';
}

// Get elevations from NED and google, then apply the argCallback
TopoPoint.prototype.getElevation = function(argCallback){
	var boundGElev = this.getGElev.bind(this);
	if(argCallback){var boundCallback = argCallback.bind(this);}
	this.getNEDElev(function(){
		boundGElev(boundCallback);
	})
}

 // Find user's location if possible (otherwise set default location), then apply argCallback
TopoPoint.prototype.getCurrentLocationAndAltitude = function(argCallback){
	var boundUsePosition = this.usePosition.bind(this);
	if(argCallback) var boundCallback = argCallback.bind(this);
	var navCallback = function(position){
		boundUsePosition(position,boundCallback)	
	}
	if (navigator.geolocation) {
		// call getCurrentPosition, first parameter is the callback to use on success, second parameter is the callback for error 
		var errorHandler = this.handleGeoLocationError.bind(this);
    	navigator.geolocation.getCurrentPosition(navCallback, errorHandler, {enableHighAccuracy:true});
    } 
  	// !navigator.geolocation means the browser doesn't support geolocation, and thus we won't get detailed error information.  This case is handled as follows:
    else {
    	navCallback(boulder);
    	alert("Geolocation is not supported by this browser,<br> so we will start you off in Boulder, CO.");
    }
}



