import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from "react";

import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
  InfoWindow,
} from "@react-google-maps/api";
import PropTypes from "prop-types";

import { useGoogleMaps } from "./context/mapsContext";
import { Bell, Clock, TruckIcon, Moon, Sun, Target } from "lucide-react";
import deliveryInsuranceIcon from "./assets/delivery-insurance.png";

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

const center = {
  lat: -3.745,
  lng: -38.523,
};

const MAP_ID = process.env.REACT_APP_GOOGLE_MAPS_MAPID;

if (!MAP_ID) {
  console.error("Map ID is not set. Please check your .env file.");
}

const Notification = ({ message, onClose, isDarkMode }) => (
  <div
    className={`fixed top-4 right-4 ${
      isDarkMode ? "bg-gray-800" : "bg-blue-500"
    } shadow-lg rounded-lg p-4 m-2 max-w-sm animate-fade-in-down`}
  >
    <div className="flex items-center">
      <Bell
        className={`mr-2 ${isDarkMode ? "text-gray-300" : "text-gray-100"}`}
      />
      <p className={`${isDarkMode ? "text-gray-300" : "text-gray-100"}`}>
        {message}
      </p>
    </div>
    <button
      onClick={onClose}
      className={`absolute top-1 right-1 ${
        isDarkMode ? "text-gray-300" : "text-gray-100"
      } hover:text-gray-700`}
    >
      &times;
    </button>
  </div>
);

const ETADisplay = ({ eta, isDarkMode }) => (
  <div
    className={`shadow-md rounded-lg p-4 mb-4 flex items-center ${
      isDarkMode ? "bg-gray-800" : "bg-white"
    }`}
  >
    <Clock
      className={`mr-2 ${isDarkMode ? "text-blue-400" : "text-blue-500"}`}
    />
    <div>
      <h3
        className={`text-lg font-semibold ${
          isDarkMode ? "text-gray-300" : "text-gray-800"
        }`}
      >
        Estimated Time of Arrival
      </h3>
      <p
        className={`text-2xl font-bold ${
          isDarkMode ? "text-blue-400" : "text-blue-600"
        }`}
      >
        {eta.toLocaleTimeString()}
      </p>
    </div>
  </div>
);

const ProgressBar = ({ percentage, isDarkMode }) => (
  <div
    className={`shadow-md rounded-lg p-4 mb-4 ${
      isDarkMode ? "bg-gray-800" : "bg-white"
    }`}
  >
    <div className="flex items-center justify-between mb-2">
      <h3
        className={`text-lg font-semibold flex items-center ${
          isDarkMode ? "text-gray-300" : "text-gray-800"
        }`}
      >
        <TruckIcon
          className={`mr-2 ${isDarkMode ? "text-blue-400" : "text-blue-500"}`}
          size={20}
        />
        Insurance Truck Progress
      </h3>
      <span
        className={`${
          isDarkMode ? "text-blue-400" : "text-blue-600"
        } font-bold`}
      >
        {Math.round(percentage)}%
      </span>
    </div>
    <div
      className={`rounded-full h-4 ${
        isDarkMode ? "bg-gray-600" : "bg-gray-200"
      }`}
    >
      <div
        className={`rounded-full h-4 transition-all duration-500 ease-out ${
          isDarkMode ? "bg-blue-400" : "bg-blue-500"
        }`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  </div>
);

const QuickAssist = () => {
  const { googleMapsLoaded, loadError } = useGoogleMaps();

  const [map, setMap] = useState(null);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [insuranceTruck, setInsuranceTruck] = useState(null);
  const [directions, setDirections] = useState(null);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [eta, setEta] = useState(null);
  const [pointsOfInterest, setPointsOfInterest] = useState([]);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isEmergency, setIsEmergency] = useState(false);
  const [truckHeading, setTruckHeading] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [mapZoom] = useState(15);
  const [mapCenter] = useState(center);

  const watchIdRef = useRef(null);
  const animationRef = useRef(null);
  const prevPositionRef = useRef(null);
  const notificationFlags = useRef({
    start: false,
    quarter: false,
    half: false,
    threeQuarters: false,
    arrived: false,
  });

  const customTruckIcon = useMemo(() => {
    if (window.google && window.google.maps) {
      return {
        url: deliveryInsuranceIcon,
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 16),
        rotation: truckHeading,
      };
    }
    return null;
  }, [truckHeading]);

  const onLoad = useCallback(
    function callback(map) {
      setMap(map);
      if (currentPosition) {
        map.panTo(currentPosition);
      }
    },
    [currentPosition]
  );

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const startWatching = useCallback(() => {
    if (navigator.geolocation) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log("Current Position:", newPos); // Verifique se a posição está sendo obtida
          setCurrentPosition(newPos);
          map?.panTo(newPos);
        },
        (error) => {
          console.error("Error getting location:", error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  }, [map]);

  useEffect(() => {
    startWatching();
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [startWatching]);

  const findPointsOfInterest = () => {
    if (currentPosition && window.google) {
      const service = new window.google.maps.places.PlacesService(map);
      const request = {
        location: currentPosition,
        radius: "5000",
        type: ["car_repair"],
      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
          setPointsOfInterest(results);
        }
      });
    }
  };

  const callInsurance = () => {
    if (currentPosition && window.google) {
      findPointsOfInterest();

      // Calcular a posição inicial do caminhão a 10km de distância
      const distanceInMeters = 10000; // 10km
      const bearing = Math.random() * 360; // Direção aleatória em graus

      const truckStart = window.google.maps.geometry.spherical.computeOffset(
        new window.google.maps.LatLng(currentPosition.lat, currentPosition.lng),
        distanceInMeters,
        bearing
      );

      const truckStartPos = truckStart.toJSON();

      setInsuranceTruck(truckStartPos);
      setIsEmergency(false);
      setProgress(0);
      notificationFlags.current = {
        start: false,
        quarter: false,
        half: false,
        threeQuarters: false,
        arrived: false,
      };

      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: truckStartPos,
          destination: currentPosition,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);

            // Define o ETA para exatamente 1 minuto no futuro
            const fixedDuration = 60; // 1 minuto em segundos
            setEta(new Date(Date.now() + fixedDuration * 1000));

            animateTruck(result);
          } else {
            console.error("Directions request failed due to " + status);
          }
        }
      );
    }
  };

  const addNotification = (message) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 5000);
  };

  const calculateHeading = (prevPos, currentPos) => {
    if (!prevPos) return 0;
    return window.google.maps.geometry.spherical.computeHeading(
      new window.google.maps.LatLng(prevPos.lat, prevPos.lng),
      new window.google.maps.LatLng(currentPos.lat, currentPos.lng)
    );
  };

  const updateMapView = (truckPosition) => {
    if (truckPosition && map) {
      // Centraliza o mapa na posição do caminhão
      map.setCenter(truckPosition);
    }
  };

  const animateTruck = (result) => {
    const route = result.routes[0].overview_path;
    let step = 0;
    const numSteps = 2000; // Defina um número de passos que se ajusta ao tempo e à velocidade

    const animate = () => {
      if (step < numSteps) {
        const progress = step / numSteps;
        const currentIndex = Math.floor(progress * (route.length - 1));
        const nextIndex = Math.min(currentIndex + 1, route.length - 1);
        const interpolation = (progress * (route.length - 1)) % 1;

        const position = window.google.maps.geometry.spherical.interpolate(
          route[currentIndex],
          route[nextIndex],
          interpolation
        );

        const newPosition = position.toJSON();

        if (prevPositionRef.current) {
          const newHeading = calculateHeading(
            prevPositionRef.current,
            newPosition
          );
          setTruckHeading(newHeading);
        }
        prevPositionRef.current = newPosition;

        setInsuranceTruck(newPosition);

        // Atualize o progresso
        setProgress(progress * 100);

        // Centraliza o mapa na posição do caminhão
        updateMapView(newPosition);

        step += animationSpeed * (isEmergency ? 2 : 1);
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setInsuranceTruck(currentPosition);
        setProgress(100);
        if (!notificationFlags.current.arrived) {
          addNotification("Insurance truck has arrived");
          notificationFlags.current.arrived = true;
        }
        // Centralizar no ponto final (posição do usuário)
        updateMapView(currentPosition);
      }
    };
    animate();
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const centerMapOnCurrentPosition = () => {
    if (map && currentPosition) {
      map.panTo(currentPosition);
    }
  };

  if (loadError) {
    return <div>Error loading maps: {loadError.message}</div>;
  }

  if (!googleMapsLoaded) {
    return <div>Loading maps...</div>;
  }

  return (
    <div
      className={`${
        isDarkMode ? "dark bg-gray-900 text-gray-300" : "bg-white text-gray-800"
      } p-4 relative min-h-screen`}
    >
      <h1 className="text-2xl font-bold mb-4 flex items-center dark:text-gray-200">
        <TruckIcon className="mr-2" /> Interactive Insurance Assistance Map
      </h1>

      <button
        onClick={toggleDarkMode}
        className="absolute top-4 right-4 p-2 bg-gray-200 dark:bg-gray-800 rounded-full"
      >
        {isDarkMode ? <Sun className="text-yellow-500" /> : <Moon />}
      </button>

      <button
        onClick={centerMapOnCurrentPosition}
        className="absolute bottom-4 right-4 p-2 bg-blue-500 hover:bg-blue-700 text-white rounded-full"
        aria-label="Center map on current location"
      >
        <Target
          className={` ${isDarkMode ? "text-blue-400" : "text-blue-500"}`}
        />
      </button>

      {notifications.map(({ id, message }) => (
        <Notification
          key={id}
          message={message}
          isDarkMode={isDarkMode}
          onClose={() =>
            setNotifications((prev) => prev.filter((n) => n.id !== id))
          }
        />
      ))}

      <div className="mb-4 space-y-4">
        <div className="flex space-x-2">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded dark:bg-blue-400 dark:hover:bg-blue-600"
            onClick={callInsurance}
          >
            Call Insurance
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="range"
            min="0.1"
            max="2"
            step="0.1"
            value={animationSpeed}
            onChange={(e) => setAnimationSpeed(parseFloat(e.target.value))}
            className="w-full"
          />
          <span className="text-sm font-medium dark:text-gray-300">
            Speed: {animationSpeed.toFixed(1)}x
          </span>
        </div>

        {eta && <ETADisplay eta={eta} isDarkMode={isDarkMode} />}

        <ProgressBar percentage={progress} isDarkMode={isDarkMode} />
      </div>

      <GoogleMap
        key={
          currentPosition
            ? `${currentPosition.lat}-${currentPosition.lng}`
            : "initial"
        }
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={mapZoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapId: MAP_ID,
        }}
      >
        {currentPosition && (
          <Marker
            position={currentPosition}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
            }}
          />
        )}

        {insuranceTruck && customTruckIcon && (
          <Marker
            position={insuranceTruck}
            icon={{
              ...customTruckIcon,
              rotation: truckHeading,
            }}
          />
        )}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              preserveViewport: true,
            }}
          />
        )}
        {pointsOfInterest.map((poi, index) => (
          <Marker
            key={index}
            position={poi.geometry.location}
            onClick={() => setSelectedPOI(poi)}
            icon={{
              url: "https://maps.google.com/mapfiles/ms/icons/mechanic.png",
            }}
          />
        ))}
        {selectedPOI && (
          <InfoWindow
            position={selectedPOI.geometry.location}
            onCloseClick={() => setSelectedPOI(null)}
          >
            <div className={isDarkMode ? "text-gray-300" : "text-gray-800"}>
              <h3>{selectedPOI.name}</h3>
              <p>{selectedPOI.vicinity}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

Notification.propTypes = {
  message: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
};

// Para o componente ETADisplay
ETADisplay.propTypes = {
  eta: PropTypes.instanceOf(Date).isRequired,
  isDarkMode: PropTypes.bool.isRequired,
};

// Para o componente ProgressBar
ProgressBar.propTypes = {
  percentage: PropTypes.number.isRequired,
  isDarkMode: PropTypes.bool.isRequired,
};

export default QuickAssist;
