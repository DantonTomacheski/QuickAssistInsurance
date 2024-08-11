import React from "react";
import "./App.css";
import { GoogleMapsProvider } from "./context/mapsContext";
import QuickAssist from "./QuickAssist";

function App() {
  return (
    <GoogleMapsProvider>
      <QuickAssist />
    </GoogleMapsProvider>
  );
}

export default App;
