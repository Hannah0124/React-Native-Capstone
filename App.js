// import { StatusBar } from 'expo-status-bar';

import React, { useEffect, useState } from 'react';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import ReduxThunk from 'redux-thunk';
import { StyleSheet, Text, View } from 'react-native';
import axios from 'axios'; 

import MainStackNavigator from './src/navigation/MainStackNavigator';

import imagesReducer from './src/store/images-reducer';
import { init } from './src/helpers/db';

init()
  .then(() => {
    console.log('Initialized database');
  })
  .catch(err => {
    console.log('Initializing db failed.');
    console.log(err);
  });

const rootReducer = combineReducers({
  images: imagesReducer
});

const store = createStore(rootReducer, applyMiddleware(ReduxThunk));

export default function App() {
  const [images, setImages] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);

  // TEST
  const baseUrl = 'http://192.168.0.38:5000';
  useEffect(() => {
    axios.get(baseUrl + '/images')
      .then(response => {

        // console.log('internal API - success: ', response.data.images)

        const apiData = response.data.images;
        setImages(apiData);
      })
      .catch(err => {
        console.log('internal API - error: ', err)
        setErrorMessage(err.message);
      })
  }, [])

  return (
    <Provider store={store}>
      <MainStackNavigator images={images} />
    </Provider>
  );
};
