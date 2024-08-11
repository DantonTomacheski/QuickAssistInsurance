import React, { createContext, useContext, useState, useEffect } from "react";
import { useJsApiLoader } from "@react-google-maps/api";
import PropTypes from "prop-types";

const GoogleMapsContext = createContext();

const libraries = ["places", "geometry", "marker"];

export const GoogleMapsProvider = ({ children }) => {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  useEffect(() => {
    if (isLoaded && !loadError) {
      setGoogleMapsLoaded(true);
    }
  }, [isLoaded, loadError]);

  return (
    <GoogleMapsContext.Provider value={{ googleMapsLoaded, loadError }}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

GoogleMapsProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useGoogleMaps = () => useContext(GoogleMapsContext);
