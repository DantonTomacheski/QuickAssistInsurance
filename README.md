# Interactive Insurance Assistance Map

This project is an interactive map application built with React and Google Maps API. It allows users to track the real-time location of an insurance truck dispatched to their location during an emergency. The app features real-time notifications, a progress tracker, and a dark mode option for better visibility at night.

## Features

- **Real-Time Tracking:** Follow the insurance truck's journey to your location on the map.
- **Progress Bar:** See the progress percentage as the truck gets closer.
- **ETA Display:** Get an estimated time of arrival (ETA) for the insurance truck.
- **Dark Mode:** Switch to dark mode for better visibility at night.
- **Nearby Points of Interest:** Find car repair shops and other services near your location.
- **Automatic Notifications:** Receive real-time updates on the truck's status and arrival.

## Getting Started

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app). Follow the steps below to set up and run the project locally.

### Prerequisites

- Node.js and npm installed on your machine.
- A Google Maps API key with access to Directions, Places, and Geocoding APIs.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/interactive-insurance-map.git
   ```
2. Navigate to the project directory:
   ```bash
   cd interactive-insurance-map
   ```
3. Install the dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory and add your Google Maps API key:
   ```plaintext
   REACT_APP_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   REACT_APP_GOOGLE_MAPS_MAPID=your_map_id
   ```

### Available Scripts

In the project directory, you can run:

- **`npm start`**: Runs the app in development mode. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

- **`npm test`**: Launches the test runner in the interactive watch mode.

- **`npm run build`**: Builds the app for production to the `build` folder. The build is optimized for the best performance.

- **`npm run eject`**: Removes the single build dependency from your project, allowing for full control over the configuration.

## Learn More

To learn more about React, check out the [React documentation](https://reactjs.org/).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

