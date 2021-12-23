import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Image, DrawerLayoutAndroid, Switch, NativeModules } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { getLocalData, storeLocalData } from './asyncStorage/functions';

import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import ContactsScreen from './screens/ContactsScreen';
import SendScreen from './screens/SendScreen';
import PiggyBankVaultScreen from './screens/PiggyBankVaultScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import NotificationScreen from './screens/NotificationScreen';
import AddContact from './screens/AddContactScreen';

import { Icon, Badge, Divider } from 'react-native-elements';
import {useNetInfo} from "@react-native-community/netinfo";

const Stack = createNativeStackNavigator();

export default function App() {
  const [loading, setLoading] = useState(true);
  const [hasNotification, setHasNotification] = useState(false);
  const [initialRoute, setInitialRoute] = useState('Login');
  const drawer = useRef(null);
  const [notificationsOn, setnotificationOn] = useState(true)
  const netInfo = useNetInfo();
  const notificationsAllowed = 'notificationsAllowed';

  const onDisplayNotification = async (title, body,image) => {
    // Create a channel
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });

    // Display a notification
    await notifee.displayNotification({
      title,
      body,
      //picture: image,
      android: {
        channelId
      },
    });
  }

  async function checkUnReadNotificons() {
    let notificationsStorage = await getLocalData('notifications');

    if ( notificationsStorage != null ) {
      let notificationObject = Object.entries(JSON.parse(notificationsStorage));

      let result = notificationObject.filter((e) => e[1].is_read == false);

      if(result.length > 0){
          setHasNotification(true);
          return true
      }

      setHasNotification(false);
      return true
    }
}


  const saveNotification = async (id, content) => {
    const Notification_key = 'notifications';
    if( id && content) {
      let storeData = {};


      let notificationStored = await getLocalData(Notification_key);

      if (notificationStored != null) {
        storeData = JSON.parse(notificationStored);
      }

      storeData[id] = content;
      storeData[id]['is_read'] = false;

      storeData = JSON.stringify(storeData)

      await storeLocalData(Notification_key,storeData)

    }
  }



  useEffect(() => {
    return async () => {
      let isNotificationsAllowed = await getLocalData(notificationsAllowed);
      if (isNotificationsAllowed != null) {
        setnotificationOn(isNotificationsAllowed == 'true')
      } else {
        setnotificationOn(notificationsOn)
      }

      if(isNotificationsAllowed == 'true'){
        messaging().onMessage(async remoteMessage => {
          console.log('A new FCM message arrived!', JSON.stringify(remoteMessage));

          saveNotification(remoteMessage.sentTime, remoteMessage.notification);

          onDisplayNotification(
            remoteMessage.notification.title,
            remoteMessage.notification.body,
            remoteMessage.notification.imageUrl
          );
        });


        messaging().onNotificationOpenedApp(remoteMessage => {
          console.log(
            'Notification caused app to open from background state:',
            remoteMessage.notification,
          );
        });
      }
    }
  },[[], notificationsOn]);

  useEffect(() => {
    async function checkIfHasUnreadNotification() {
      await checkUnReadNotificons();
    }

    checkIfHasUnreadNotification();

    // Check whether an initial notification is available
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          console.log(
            'Notification caused app to open from quit state:',
            remoteMessage.notification,
          );
          setInitialRoute(remoteMessage.data.type); // e.g. "Settings"
        }
        setLoading(false);
      });
  }, []);


  // Do loading stuff here
  if (loading) {
    return null;
  }


  const navigationView = () => (
    <View style={[styles.NavigationContainer]}>
      <Text style={[styles.text, { padding:20, textAlign: 'center', fontWeight: 'bold'}]}>Definitions</Text>
      <Divider orientation="vertical" width={5} />

      <View style={{flexDirection:'row', padding:20}}>
        <Text style={[styles.text, { paddingRight:10}]}>Notifications in App:</Text>
        <Switch
        trackColor={{ false: "#c8c8c8", true: "#1e6091" }}
        thumbColor={notificationsOn ? "#1e6091" : "gray"}
        ios_backgroundColor="#1e6091"
        onValueChange={(value) => {
          storeLocalData(notificationsAllowed, value);
          setnotificationOn(value);
          NativeModules.DevSettings.reload();
        }}
        value={notificationsOn}
      />
      </View>

    </View>
  );

    //Check if internet is connected
    if(netInfo.isConnected != null && netInfo.isConnected == false ){
      return(
        <View style={styles.container}>
          <Icon
                  name='wifi-off'
                  type='feather'
                  color='#0782F9'
                  size={60}
                  onPress={() => { navigation.navigate('Notifications') }}
                  />
          <Text style={{marginTop: 10 ,color: 'gray', fontSize: 16, padding: 10}}>There is no Internet Connection!</Text>
        </View>
      )
    }

  return (
      <NavigationContainer>
        <DrawerLayoutAndroid
      ref={drawer}
      drawerWidth={300}
      drawerPosition="right"
      renderNavigationView={navigationView}
    >
        <Stack.Navigator>
          <Stack.Screen options={{ headerShown: false }} name="Login" component={LoginScreen} />
          <Stack.Screen options={({ navigation, route }) => ({
           headerBackVisible: false,
           headerShadowVisible: false,
           title: 'Card Info',
           headerTitleAlign: 'center',
           headerRight: () => (
            <View style={{flexDirection: 'row'}}>
              <View>
                <Icon
                  name='bell'
                  type='font-awesome'
                  color='black'
                  size={25}
                  onPress={() => { navigation.replace('Notifications') }}
                  />
                <Badge
                  status="success"
                  containerStyle={{ position: 'absolute', top: -3, right: -3, display: hasNotification ? 'flex' : 'none'  }}
                />
              </View>
                <View style={{marginLeft:20}}>
                <Icon
                  name='gear'
                  type='font-awesome'
                  color='black'
                  size={30}
                  onPress={() => drawer.current.openDrawer()}
                  />
                </View>
            </View>
              ),
            })}
            name="Dashboard"
            component={DashboardScreen}
            />
          <Stack.Screen options={{ headerShadowVisible: false,  title: 'My Contacts', headerTitleAlign: 'center' }} name="Contacts" component={ContactsScreen} />
          <Stack.Screen options={{ headerShadowVisible: false,  title: 'Send Money', headerTitleAlign: 'center' }} name="SendMoney" component={SendScreen} />
          <Stack.Screen options={{ headerShadowVisible: false,  title: 'Piggy Bank', headerTitleAlign: 'center'}} name="PiggyBankVault" component={PiggyBankVaultScreen} />
          <Stack.Screen options={{ headerShadowVisible: false,  title: 'Send Money To', headerTitleAlign: 'center' }} name="SendScreen" component={SendScreen} />
          <Stack.Screen options={{ headerShadowVisible: false,  title: 'Transactions', headerTitleAlign: 'center' }} name="Transactions" component={TransactionsScreen} />
          <Stack.Screen options={({ navigation, route }) => ({ headerShadowVisible: false,  title: '  Notifications', headerTitleAlign: 'left', headerLeft: () => (
            <Icon name='arrowleft' type='ant-design' color='black' onPress={() => { navigation.replace('Dashboard') }}/>)
            })} name="Notifications" component={NotificationScreen} />
          <Stack.Screen options={{ headerShadowVisible: false,  title: 'Add Contact', headerTitleAlign: 'center' }} name="Add Contact" component={AddContact} />

        </Stack.Navigator>
        </DrawerLayoutAndroid>
      </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#000',
  },
  navigationContainer: {
    backgroundColor: "#ecf0f1"
  },
  logo: {
    width: '100%',
    height: 200,
  },
});
