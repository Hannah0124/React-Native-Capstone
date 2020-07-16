import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Button, TouchableOpacity, ScrollView, Alert } from 'react-native'; 

import * as ImageManipulator from "expo-image-manipulator"; // npm i expo-image-manipulator
import axios from 'axios'; 
import * as Speech from 'expo-speech';
import { AntDesign } from '@expo/vector-icons';
import * as Localization from 'expo-localization'; // TODO: TEST
import i18n from 'i18n-js';

import Colors from '../constants/Colors';
import LANGUAGES from '../constants/Languages';
import URLS from '../constants/Urls';

import ImagePicker from '../components/ImagePicker';

// import ENV from '../../env'; // npm i expo-env
// import { useDispatch } from 'react-redux'; // TEST
// import * as imagesActions from '../store/images-actions';
import LineButton from '../components/LineButton';
// import * as FileSystem from 'expo-file-system';

const defaultLanguage = Localization.locale.includes("-") ? Localization.locale.split("-")[0] : Localization.locale

i18n.locale = defaultLanguage; // Set the locale once at the beginning of your app.

// console.log('i18n.locale: ', i18n.locale)

const PhotoTranslator = (props) => {

  // console.log("props in PhotoTranslator.js: ", props)

  const id = props.route.params.currentId; // || 1; // dummy data
  // console.log('id??? ', id);
  const signedIn = props.route.params.signedIn;

  const [apiPhoto, setApiPhoto] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [getText, setGetText] = useState(null);
  const [translatedText, setTranslatedText] = useState(null);
  const [currLanguage, setCurrLanguage] = useState('ko');
  const [favorite, setFavorite] = useState(false);

  
  const initialStateForm = {
    image_url: null,
    text: null,
    translated_text: null,
    favorite: false,
    original_lang: i18n.locale,
    language: null,
    user_id: props.route.params.currentId
  }

  

  const { route, navigation } = props;
  
  const getLanguage = () => {
    
    if (!route.params.item) {
      Alert.alert(
        "Need to select Language",
        "Please change a language setting",
        [
          { text: "OK", 
            onPress: () => console.log("OK Pressed") 
          }
        ]
      )
    }

    const { item } = route.params;
    const { language } = item;

    setCurrLanguage(language);
    getTranslated(getText, language);
    setFavorite(false);

    return language 
  }; 

  // const dispatch = useDispatch(); // TEST


  // TODO: TEST
  const imageTakenHandler = async imagePath => {
    setSelectedImage(imagePath);

    // a promise 
    let photo = await ImageManipulator.manipulateAsync(
      imagePath,
      [{ resize: { width: 420 }}],
      {
        base64: true
      }
    );

    setApiPhoto(photo.base64);
  };



  // TEST
  const saveImageHandler = () => {

    // console.log('state in PhotoTranslator.js: ', props.route.params);

    const body = {
      image_url: selectedImage, // apiPhoto, 
      favorite: true,
      original_lang: displayLanguage(i18n.locale),
      language: displayLanguage(currLanguage),
      text: getText,
      translated_text: translatedText,
      user_id: id,
    };


    console.log('body!! ', body)
    setFavorite(true);

    axios.post(`${URLS.BASE_URL}/add_image`, body)
      .then(response => {
        console.log('internal API - success: ', response.data)
      })
      .catch(err => {
        console.log('3. internal API - error: ', err)

        Alert.alert(
          "Unique value needed",
          "Oops. The same picture or text exists in your favorite list. Please update a unique value.",
          [
            { 
              text: "OK",
              onPress: () => console.log("OK pressed")
            }
          ]
        )
      })

    // dispatch(imagesActions.addImage(selectedImage, getText, translatedText, true, 'Korean'));
  };


  const getWords = () => {
    // edge case
    if (!apiPhoto) {
      Alert.alert(
        "Image Needed",
        "Please select a picture from gallery or take a picture",
        [
          { 
            text: "OK",
            onPress: () => console.log("OK pressed")
          }
        ]
      )
    }
    
    const body = {
      requests: [
        {
          features: [
            {
              maxResults: 5,  // TODO: 1 for now due to API charge
              type: "LABEL_DETECTION"
            },
          ],
          //
          image: {
            content: apiPhoto
          },
        }
      ]
    }

    axios.post(URLS.GOOGOLE_VISION_URL, body)
      .then(response => {
        console.log('response.data: ', response.data.responses[0].labelAnnotations)

        const apiData = response.data.responses[0].labelAnnotations;

        const descriptions = apiData.map(data => {
          return data.description;
        })

        console.log('SUCCESS 4', descriptions);
        setGetText(descriptions.join(', '));
        setTranslatedText(null);

        // // TODO (TEST)
        // getLanguage();
        getTranslated(descriptions.join(', '), currLanguage);
      })
      .catch(err => {
        console.log('(1) ERROR - Vision API: ', err);
      })
  };

  const getTranslated = (word, targetLang) => {

    const body = {
        q: word,
        source: "en",
        target: targetLang, // e.g. "es",
        format: "text"
      }

    axios.post(URLS.GOOGOLE_TRANSLATION_URL, body)
      .then(response => {
        // console.log('response.data: ', response.data.data.translations[0].translatedText);

        setTranslatedText(response.data.data.translations[0].translatedText);
      })
      .catch(err => {
        Alert.alert(
          "Need to select Language",
          "Please change a language setting",
          [
            { text: "OK", 
              onPress: () => console.log("OK Pressed") 
            }
          ]
        )

        console.log('(2) ERROR - Translation API: ', err);
      })
  };


  const displayLanguage = (target) => {
    return Object.keys(LANGUAGES).find(label => {
      return LANGUAGES[label] == target;
    })
  };

  const speak = (targetText, selectedLanguage) => {
    Speech.speak(targetText, {language: selectedLanguage});
  };
  
  const languageButtons = (marginTop) => {
    return (
      <View style={styles.buttonContainer} marginTop={marginTop}>
        <TouchableOpacity
          style={styles.languageBtn}
          onPress={() => {
            navigation.navigate('Settings', { item: 'photo' })
          }}
        >
          <Text style={styles.buttonText}>Language</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.languageBtn}
          onPress={getLanguage} // onPress={() => {getTranslated(getText, currLanguage)}}   
        >
          <Text style={styles.buttonText}> Let's translate! </Text>
        </TouchableOpacity>
      </View>
    )
  };


  const reset = () => {
    setFavorite(false);
    setApiPhoto(null);
    setGetText(null);
    setTranslatedText(null);
  }

  return (
    <ScrollView>
      <View style={styles.container}>

        <View style={styles.favoriteButton}>
          {signedIn &&
            <Button 
            title="My Favorites" 
            color={Colors.primary} 
            onPress={() => {
              navigation.navigate('List', 
              {
                currentId: id, 
              })
            }}
          />
          } 
        </View>

        <ImagePicker 
          onImageTaken={imageTakenHandler} 
          resetCallback={reset}
          root="photo"
        />

        <View style={styles.buttonContainer}>
          {signedIn && apiPhoto && currLanguage && getText && translatedText && (favorite === true) && 
            <AntDesign 
              name="star" 
              size={30} 
              color="#C99B13" 
              backgroundColor="#fff"
            >
            </AntDesign>
          }
          
          {signedIn && apiPhoto && currLanguage && getText && translatedText && (favorite === false) && 
            <AntDesign.Button 
            name="staro" 
            size={30} 
            color="#C99B13" 
            backgroundColor="#fff"
            onPress={saveImageHandler}
            >
            </AntDesign.Button>
          }


          {apiPhoto &&
            <LineButton 
              title="Get Words"
              color={Colors.primary}
              onPress={getWords}
            />
          }
        </View>


        { (translatedText || getText)  &&
          <View style={styles.cardsContainer}> 
            <View style={styles.cardContainer}>
              <Text style={styles.cardText}>{displayLanguage(i18n.locale)}</Text>
              <Text style={styles.card}>
                {getText && getText}
              </Text>

              <AntDesign.Button 
                name="sound" 
                size={24} 
                color={Colors.primary} 
                backgroundColor='#fff'
                onPress={() => speak(getText, i18n.locale)}
              />
            </View>

            <View style={styles.cardContainer}>
              <Text style={styles.cardText}>{displayLanguage(currLanguage)}</Text>
              <Text style={styles.card}>
                {translatedText}
              </Text>
              <AntDesign.Button 
                name="sound" 
                size={24} 
                color={Colors.primary} 
                backgroundColor='#fff'
                onPress={() => speak(translatedText, currLanguage)}
              />
            </View>
          </View>
        }


        {
          apiPhoto && getText && languageButtons(60)  
        }
        
      </View>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingBottom: '100%',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageBtn: {
    right: 0,
    backgroundColor: Colors.primary,
    color: "#fff",
    borderRadius: 30,
    padding: 10,
    margin: 20,
    paddingVertical: 12,
    paddingHorizontal: 15
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
  },
  favoriteButton: {
    position: 'absolute',
    top: 0,
    right: 0
  },
  cardsContainer: {
    marginTop: 20
  },
  cardContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  cardText: {
    marginRight: 20,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    borderRadius: 5,
    backgroundColor: '#FAFAFA',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginVertical: 5,
    width: 220
  },
  flash: {
    backgroundColor: '#fff3cd',
    color: '#856404',
    borderColor: '#ffeeba',
    padding: 10,
    marginBottom: 2,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  }
})

export default PhotoTranslator;

// reference - picker: https://snack.expo.io/S1_ipbwSL
// reference - speech: https://docs.expo.io/versions/latest/sdk/speech/
// reference - icon: https://docs.expo.io/guides/icons/