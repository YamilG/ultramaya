
console.log("map_logic.js loaded");

function waitForLeaflet(callback) {
    if (window.L) {
        console.log("Leaflet found.");
        callback();
    } else {
        console.log("Leaflet not found yet, waiting...");
        setTimeout(() => waitForLeaflet(callback), 100);
    }
}

function initializeMapInteraction() {
    console.log("Initializing map interaction...");
    let mapInstance;
    const mapElement = document.querySelector('.folium-map');
    const mapId = mapElement ? mapElement.id : null;

     if (mapId && window[mapId] && window[mapId] instanceof L.Map) {
         mapInstance = window[mapId];
         console.log("Map instance found:", mapId);
     } else {
         for (const k in window) {
             if (window[k] instanceof L.Map) {
                 mapInstance = window[k];
                 console.log("Map instance found via fallback search.");
                 break;
             }
         }
     }

    if (!mapInstance) {
        console.error("Could not find Leaflet/Folium map instance. Retrying...");
        setTimeout(initializeMapInteraction, 200);
        return;
    }

    if (typeof ALL_ROUTE_DATA === 'undefined' || typeof DEFAULT_ROUTE === 'undefined') {
        console.error("Route data (ALL_ROUTE_DATA or DEFAULT_ROUTE) not found.");
        return;
    }
     console.log("Route data and default route name loaded.");

    const allData = ALL_ROUTE_DATA;
    const defaultRouteName = DEFAULT_ROUTE;
    const routeSelector = document.getElementById('routeSelector');
    const downloadButton = document.getElementById('downloadGpxButton');
    let currentTrackLayer = null;
    let currentMarkerGroup = null;

    function displayTrack(routeName) {
        console.log("Displaying track:", routeName);

        if (currentTrackLayer) { mapInstance.removeLayer(currentTrackLayer); currentTrackLayer = null; }
        if (currentMarkerGroup) { mapInstance.removeLayer(currentMarkerGroup); currentMarkerGroup = null; }

        const routeData = allData[routeName];
        if (!routeData || !routeData.coords || routeData.coords.length === 0) {
            console.warn(`No data found for route: ${routeName}. Cannot display track.`);
            return;
        }
        console.log(`Processing ${routeData.coords.length} coords, ${routeData.markers ? routeData.markers.length : 0} markers`);

        const routeColor = routeData.color || 'red';

        try {
            currentTrackLayer = L.polyline(routeData.coords, {
                color: routeColor,
                weight: 4,
                opacity: 0.8
            }).addTo(mapInstance);
            console.log("Track polyline added.");
        } catch (e) {
            console.error("Error adding track polyline:", e);
            return;
        }

        currentMarkerGroup = L.featureGroup();
        if (routeData.markers && routeData.markers.length > 0) {
            routeData.markers.forEach(function(markerInfo) {
                if (typeof markerInfo.lat !== 'number' || typeof markerInfo.lon !== 'number') { return; }
                try {
                    const isStartMarker = markerInfo.label === 'Inicio';
                    let iconClass = 'km-marker-label';
                    let iconWidth = 28; let iconHeight = 28;
                    if (isStartMarker) { iconClass += ' start-marker-label'; iconWidth = 32; iconHeight = 32; }

                    const markerIcon = L.divIcon({
                        html: `<div class="${iconClass}">${markerInfo.label}</div>`,
                        className: '',
                        iconSize: [iconWidth, iconHeight],
                        iconAnchor: [iconWidth / 2, iconHeight / 2]
                    });
                    L.marker([markerInfo.lat, markerInfo.lon], { icon: markerIcon }).addTo(currentMarkerGroup);
                } catch (e) {
                     console.error("Error creating marker:", e);
                }
            });
            currentMarkerGroup.addTo(mapInstance);
             console.log(`Added ${currentMarkerGroup.getLayers().length} markers to group.`);
        } else {
             console.log("No markers to add.");
        }

         try {
            if (currentTrackLayer && currentTrackLayer.getBounds().isValid()) {
                 mapInstance.fitBounds(currentTrackLayer.getBounds(), {padding: [30, 30]});
                  console.log("Map bounds fitted to track.");
            } else {
                 console.warn("Cannot fit bounds - track layer invalid or has no valid bounds.")
            }
         } catch(e) {
             console.error("Error during fitBounds:", e);
         }
    }

    routeSelector.addEventListener('change', function() { displayTrack(this.value); });

    downloadButton.addEventListener('click', function() {
        const selectedRouteName = routeSelector.value;
        const routeData = allData[selectedRouteName];
        if (routeData && routeData.filename) {
            const filename = routeData.filename;
            console.log('Attempting to download:', filename);
            const link = document.createElement('a');
            link.href = filename;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.error('Could not find filename for selected route:', selectedRouteName);
            alert('Error: No se pudo encontrar el archivo GPX para la ruta seleccionada.');
        }
    });

    console.log("Performing initial display for:", defaultRouteName);
    displayTrack(defaultRouteName);

     console.log("Map interaction initialized.");

}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded.");
    waitForLeaflet(initializeMapInteraction);
});
