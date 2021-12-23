import React, { useState, useEffect, useRef } from 'react'
import {
    StyleSheet,
    Text,
    View,
    TextInput,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    KeyboardAvoidingView,
    PermissionsAndroid,
} from 'react-native'
import DeviceInfo from 'react-native-device-info';
import { useNavigation } from '@react-navigation/native';
import auth from '@react-native-firebase/auth';
import { createUserInDatabase, requestNotificationPermission, createUserTransactionInDatabase } from '../firebase/functions';


const LoginScreen = () => {
    const navigation = useNavigation()
    const [phoneNumber, setPhoneNumber] = useState('');
    const [btnLoginDisable, setBtnLoginDisabled] = useState(true)
    const [canEdit, setcanEdit] = useState(false)
    const validPhoneNumber = /^9[1236]{1}[0-9]{7}$|^2[3-9]{2}[0-9]{6}$|^2[12]{1}[0-9]{7}$/;
    const prefix = '+351';
    const [loading, setLoading] = useState(false)

    const handleLogin =  () => {
      setLoading(true)

      auth()
      .signInAnonymously()
      .then(async (response) => {
        const phone_number = prefix + phoneNumber;
        //console.log('User signed in anonymously', user);
        await response.user.updateProfile({
          displayName : phone_number
        })

        await createUserInDatabase(phone_number, {
          current_balance: 50
        }).then(async () => {
          await createUserTransactionInDatabase(phone_number).then(() => {
            setLoading(false)
            navigation.navigate('Dashboard', {
              routePhoneNumber: phone_number
            })
          })
        }).catch((error) => {
          console.log(error);
          setLoading(false)
          alert('Erro while trying to sign in');
          return;
        });

      })
      .catch(error => {
        if (error.code === 'auth/operation-not-allowed') {
          console.log('Enable anonymous in your firebase console.');
        }
        setLoading(false)
        alert(error);
      });
    }

    const resquestPermissionPhone = async() => {
        try {
          await PermissionsAndroid.requestMultiple([
            PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
            PermissionsAndroid.PERMISSIONS.READ_SMS,
          ]);
          const permissionsPhone = await  PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE);

            if (permissionsPhone === PermissionsAndroid.RESULTS.GRANTED) {
              return true;
            } else {
              return false;
            }
          } catch (err) {
            console.warn(err);
          }
    }

    const getPhoneNumber = async () => {
      const allowed = await resquestPermissionPhone();
        if (allowed) {
          DeviceInfo.getPhoneNumber().then((phoneNumber) => {
            // Android: null return: no permission, empty string: unprogrammed or empty SIM1, e.g. "+15555215558": normal return value
            var phoneNumber_noPRefix = phoneNumber.replace(prefix, '');
              if (phoneNumber
                  && phoneNumber !== 'unknown'
                  && validPhoneNumber.test(phoneNumber_noPRefix)
              ) {
                  setPhoneNumber(phoneNumber_noPRefix);
                  setcanEdit(false)
                  setBtnLoginDisabled(false)
              } else{
                  setcanEdit(true)
                  setBtnLoginDisabled(true)
              }
          });
        }
       };

    useEffect( () => {
        const checkUserAuth = auth().onAuthStateChanged(user => {
            if (user) {
              let authPhone = auth().currentUser.displayName;
              if(authPhone|| phoneNumber.length > 0) {
                navigation.navigate('Dashboard', {
                  routePhoneNumber: prefix + phoneNumber
                })
              }
            }
      }, [])

        async function fetchPhoneNumber() {
          await getPhoneNumber()
          await requestNotificationPermission();

          setPhoneNumber(phoneNumber.replace(prefix, ''))

        }

        checkUserAuth
        fetchPhoneNumber()
    }, [])

    if (loading) {
      return (
        <View
            style={{
              flexDirection: 'column',
              paddingVertical: 20,
              borderTopWidth: 1,
              backgroundColor: '#000034',
              justifyContent: 'center',
              alignItems:'center',
              flex: 1
            }}>
              <ActivityIndicator animating size='large' color="white" />
        </View>
      );
    }

    return (
        <View style={styles.container}>
        <KeyboardAvoidingView style={styles.container} behavior={Platform.OS == "ios" ? "padding" : "height"}>

         <Image PlaceholderContent={<ActivityIndicator />}
            style={styles.logo}
            source={{
                uri: 'https://i.pinimg.com/originals/2b/d7/8d/2bd78dd4de99571a78efa8d23c5e5181.png',
            }}
            />
        <TextInput
            placeholder="Insert Phone Number"
            placeholderTextColor="gray"
            value={phoneNumber}
            onChangeText={(number) => {
              setPhoneNumber(number)

              if(validPhoneNumber.test(number)) {
                setBtnLoginDisabled(false)
                //setcanEdit(true)
              } else {
                //setcanEdit(true)
                setBtnLoginDisabled(true)
              }

            }}
            maxLength={13}
            style={styles.input}
            editable={canEdit}
            keyboardType='phone-pad'
            />
        <TouchableOpacity
            onPress={handleLogin}
            style={!btnLoginDisable ? [styles.button, styles.buttonEnabled] :[styles.button, styles.buttonDisabled]}
            disabled={btnLoginDisable}
        >
            <Text style={styles.buttonText}>Add Card</Text>
        </TouchableOpacity>

    </KeyboardAvoidingView>
    </View>
    )
}

export default LoginScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000034'
      },
    input: {
        backgroundColor: 'white',
        color: 'black',
        paddingVertical: 15,
        width: 220,
        borderRadius: 10,
        marginTop: 5,
        fontSize: 17,
        textAlign: 'center'
    },
    logo: {
        width: 300,
        height: 200,
    },
    button: {
        padding: 15,
        width: 150,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 40,
      },
      buttonEnabled: {
        backgroundColor: '#05c7e4',
      },
      buttonDisabled: {
        backgroundColor: 'gray',
      },
      buttonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 16,
      },
})
