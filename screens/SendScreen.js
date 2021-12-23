import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  Text,
  View,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import CurrencyInput from 'react-native-currency-input';
import {Avatar, Button, Input} from 'react-native-elements';
import {sendMoneyToUser} from '../firebase/functions';
import auth from '@react-native-firebase/auth';

const SendScreen = ({route, navigation}) => {
  const [amount, setAmount] = useState('0.00');
  const {phoneNumber, contactName} = route.params;
  const [description, setDescription] = useState('');
  const baseImgUrl =
    'https://347xj63da3uu3x11jfmmklg9-wpengine.netdna-ssl.com/wp-content/uploads/2020/10/';
  const [image, setImage] = useState(
    'https://thumbs.dreamstime.com/b/default-avatar-profile-icon-vector-social-media-user-portrait-176256935.jpg',
  );
  const [isKeyboardOpen, setKeyboardStatus] = useState(false);
  const [inputCharacter, setInputCharacter] = useState(0);
  const inputLimit = 25;

  const randomImage = () => {
    let randomNumber = Math.floor(Math.random() * 10) + 1;

    return setImage(baseImgUrl + randomNumber + '.png');
  };

  const handleSendMoney = async () => {
    if (!phoneNumber) {
      alert('Error sending money');
      return;
    }

    if (!description) {
      alert('Please add some description');
      return;
    }

    if (amount == 0) {
      alert('Please insert some money');
      return;
    }

    const currentUserId = auth().currentUser.displayName;
    if (currentUserId) {
      const response = await sendMoneyToUser(
        currentUserId,
        phoneNumber,
        description,
        amount,
      );

      if (response) {
        alert('Money Sent Successfully!');
        navigation.navigate('Dashboard', {amount});
      }
    } else {
      alert('Error sending money');
    }

    return;
  };

  useEffect(() => {
    navigation.setOptions({
      title: 'Send Money to ' + contactName,
    });

    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardStatus(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardStatus(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      randomImage();
    };
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS == 'ios' ? 'padding' : 'height'}>
      <View style={styles.container}>
        {!isKeyboardOpen ? (
          <Avatar
            rounded
            size={100}
            containerStyle={styles.avatar}
            title={contactName}
            source={{
              uri: image,
            }}
          />
        ) : null}
        <Text style={styles.text}>Value to send</Text>

        <CurrencyInput
          style={styles.input}
          value={amount}
          onChangeValue={value => setAmount(value)}
          prefix="€"
          allowNegativeValue={false}
          maxValue={100}
          delimiter="."
          separator=","
          precision={2}
          onChangeText={text => {
            if (text <= 0.0) {
              setAmount(0.0);
            }
          }}
        />
        <Text style={[styles.text, {fontWeight: 'bold'}]}>Description</Text>
        <View>
          <TextInput
            style={[styles.textinput]}
            placeholder="Ex. Compras no shopping"
            value={description}
            onChangeText={text => {
              setInputCharacter(text.length);
              setDescription(text);
            }}
            placeholderTextColor="#949494"
            underlineColorAndroid="#0782F9"
            spellCheck={false}
            keyboardType="visible-password"
            autoCorrect={false}
            maxLength={inputLimit}
          />
          {inputCharacter > 0 ? (
            <Text
              style={{
                fontSize: 10,
                color: '#949494',
                position: 'absolute',
                right: 10,
                top: 25,
              }}>
              {inputCharacter}/{inputLimit}
            </Text>
          ) : null}
        </View>

        <Button
          buttonStyle={styles.button}
          type="solid"
          iconPosition="right"
          icon={{
            name: 'arrow-right',
            size: 30,
            color: 'white',
          }}
          title="Send Money"
          onPress={handleSendMoney}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default SendScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  text: {
    color: 'gray',
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 10,
    fontSize: 30,
    color: '#5b5b5b',
    fontWeight: 'bold',
  },
  avatar: {
    marginBottom: 10,
  },
  contactName: {
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  phoneNumber: {
    marginBottom: 10,
    fontWeight: 'bold',
    fontSize: 18,
  },
  button: {
    paddingTop: 15,
    paddingBottom: 15,
    paddingRight: 25,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#0782F9',
  },
  textinput: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
    marginTop: 5,
    fontWeight: 'bold',
    color: '#5b5b5b',
  },
});
