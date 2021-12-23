import React, { useState, useEffect } from 'react'
import {
    TextInput,
    FlatList,
    StyleSheet,
    PermissionsAndroid,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
  } from 'react-native'
  import { getLocalData, storeLocalData } from '../asyncStorage/functions';
import { Icon, Badge, Overlay } from 'react-native-elements';

const NotificationScreen = ({ route, navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const notificationKey = 'notifications';

    useEffect(() => {
        async function getUserNotifications() {
            let notificationsStorage = await getLocalData(notificationKey)
            if(notificationsStorage != null) {
                let convertToArray = Object.entries(JSON.parse(notificationsStorage));
                setNotifications(convertToArray.reverse())
            }
        }

        getUserNotifications()
    }, [])

    const renderEmpty = () => {
        return(
          <View
            style={{
              paddingVertical: 20,
              borderTopWidth: 1,
              borderColor: '#CED0CE',
              alignItems:'center'
            }}>
          <Text style={styles.text}>You have no notifications</Text>
        </View>
        );
      };

      const renderItem = ({ item }) => {
        let data = item[1]

        return(
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', width:'100%', padding: 10, margin: 1,
            backgroundColor: data.is_read ? 'white' : 'gray'
            }}
            onPress={ async () => {
                let convertToObject = Object.fromEntries(notifications);
                // mark as read
                convertToObject[item[0]].is_read = true;

                let data = JSON.stringify(convertToObject);
                await storeLocalData(notificationKey,data)
                setNotifications(Object.entries(convertToObject))
                navigation.navigate('Transactions');
               }}
            >


            <View style={{alignItems: 'flex-start', padding: 20, borderRadius: 10}}>
            <Icon
            reverse
                name='bell'
                type='font-awesome'
                color='black'
                size={15}
                    />
            </View>


            <View style={{ width:'80%' }}>
                <Text style={[styles.text, styles.title, {fontSize: 15, paddingTop: 15}]}>{data.title}</Text>
                <Text style={[styles.text,{fontSize: 15}]}>{data.body}</Text>
            </View>

          </TouchableOpacity >
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS == "ios" ? "padding" : "height"}
            >
        <SafeAreaView style={{width:'100%',height:'100%'}}>

          <FlatList
            style={styles.flatList}
            ListEmptyComponent={renderEmpty}
            data={notifications}
            keyExtractor={item => item[0]}
            renderItem={renderItem}
            />
          </SafeAreaView>
        </KeyboardAvoidingView>
    )
}

export default NotificationScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor:'#fff'
      },
    text: {
        color: '#000'
    },
    title: {
        fontWeight: 'bold'
    },
})
