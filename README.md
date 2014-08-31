A topoPoint is a common extension of the google elevation service, and the National Elevation Database.  

-When initialized with a latitude and longitude it delivers elevations from both services (the latter is more accurate, but arrives more slowly).

-Methods to describe the point as a string, and as an infoWindow on a map marker are included.

-The google maps api should be included ( https://maps.googleapis.com/maps/api/js ) unless the user intends to use the National Elevation Data exclusively.