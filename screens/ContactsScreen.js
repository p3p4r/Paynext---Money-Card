import React, { useState, useEffect, useRef } from 'react'
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
import Contacts from 'react-native-contacts';
import { Icon } from 'react-native-elements';
import { getUsers } from '../firebase/functions';

const ContactsScreen = ({ route, navigation}) => {
    const [contacts, setContacts] = useState()
    const [message, setMessage] = useState('')
    const prefix = '+351';
    const [query, setQuery] = useState('');
    const [searchData, setSearchData] = useState();
    const [registeredContacts, setRegisteredContacts] = useState();
    //const [isFetching, setIsFetching] = useState(false);
    const [loading, setLoading] = useState(true)

    async function hasAndroidPermission() {
        const permission = PermissionsAndroid.PERMISSIONS.READ_CONTACTS;
        const hasPermission = await PermissionsAndroid.check(permission);
        if (hasPermission) {
           return true;
         }
         const status = await PermissionsAndroid.request(permission);
         return status === 'granted';
      }

      const getRegisteredcontactUsers = async (contacts) => {
        const users = await getUsers();

        let contactNumbers = users.map(doc => doc._data.phoneNumber && doc._data.phoneNumber.replace(prefix, ''));

        setRegisteredContacts(contactNumbers);

        // Return only registered contacts
        /*let result = contacts.find(
          contact => contactNumbers.includes(
            (contact.phoneNumbers[1] && contact.phoneNumbers[1].number.replace(prefix, '')) ||
            (contact.phoneNumbers[0] && contact.phoneNumbers[0].number.replace(prefix, ''))
          )
        )

       return result;
       */
      }

      function getUnique(arr, index) {

        const unique = arr
             .map(e => e[index])

             // store the keys of the unique objects
             .map((e, i, final) => final.indexOf(e) === i && i)

             // eliminate the dead keys & store unique objects
            .filter(e => arr[e]).map(e => arr[e]);

         return unique;
      }

      const loadContacts = async () => {
        if (await hasAndroidPermission()) {
           Contacts.getAll().then(async contacts => {

             if (contacts.length != 0){
               await getRegisteredcontactUsers(contacts);
               const sortedContacts = contacts.sort(function(a, b){
                if(a.displayName < b.displayName) { return -1; }
                if(a.displayName > b.displayName) { return 1; }
                return 0;
              });
              let removeDuplicateByName = getUnique(sortedContacts, 'givenName');
              setContacts(removeDuplicateByName)
              setLoading(false)
            }else{
               setMessage('No contacts found.')
               setLoading(false)
            }
               //console.log(contacts.find(element => element.displayName = "Teste1"))
           })
         }
         return
       };

      const handleSearch = text => {
        text = text.toLowerCase();
        text = text.replace(/[^\w\s]/gi,'')

        const filteredData = contacts.filter(contacts => {
          let contactName = contacts.givenName ?? contacts.displayName;
          return contactName.toLowerCase().match(text);
        })

        if (text.length > 0) {
          setSearchData(filteredData);
        } else {
          setSearchData(contacts);
        }
        setQuery(text)
      };

      useEffect(() => {
         hasAndroidPermission()
         loadContacts()
       }, [])

      const renderItem = ({ item }) => {
        let contact_phoneNumber = '';
        let numberIsRegistered = false;
        if (contacts.phoneNumbers){
          contact_phoneNumber =  item.phoneNumbers && item.phoneNumbers[0].replace(prefix, '');
        }else if (item.phoneNumbers[0] ) {
          contact_phoneNumber = item.phoneNumbers && item.phoneNumbers[0].number.replace(prefix, '');
        }else{
          contact_phoneNumber = "No number";
        }

        if(contact_phoneNumber.length > 0 && registeredContacts.find(el => el == contact_phoneNumber.replace(/\s/g, '')) != undefined) {
          numberIsRegistered = true;
        }

        let contact_with_spaced = contact_phoneNumber.toString().replace(/\d{3,4}?(?=...)/g, '$& ');

        return(
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', width:'100%', padding: 10}}
            onPress={() => {
              if(numberIsRegistered){
                navigation.navigate("SendScreen", {
                  contactName: item.displayName ?? item.displayName,
                  phoneNumber: prefix + contact_phoneNumber
                })
              }
            }
          }
            >
            <View style={{ width:'80%' }}>
              <Text style={{ fontWeight:'bold', fontSize: 17, color: '#000' }}>{item.givenName}</Text>
              <Text style={{ fontSize: 15, color: '#000'}}>{prefix +  ' ' + contact_with_spaced}</Text>
            </View>

            <View style={{ width:'20%' }}>
              { numberIsRegistered ?
              <Icon
              name='arrow-right'
              type='font-awesome'
              color='#014586'
              size={28}
              /> : null}
            </View>
          </TouchableOpacity >
        );
      };

      const renderEmpty = () => {
        return(
          <View
            style={{
              paddingVertical: 20,
              borderTopWidth: 1,
              borderColor: '#CED0CE',
              alignItems:'center'
            }}>

            {message ? <Text style={{ fontWeight:'bold', fontSize: 17, color: '#000' }}>{message}</Text> : null}
            {loading ? <ActivityIndicator animating size='large' color="#014586" /> : null}

        </View>
        );
      };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS == "ios" ? "padding" : "height"}
            >
        <SafeAreaView style={{width:'100%', padding:20, marginTop: 20}}>

          <View style={{ flexDirection: 'row', backgroundColor: '#fff', padding: 8, borderRadius: 20 }} >
            <TextInput
              autoCapitalize="none"
              autoCorrect={false}
              clearButtonMode="always"
              value={query}
              onChangeText={(queryText) => handleSearch(queryText)}
              placeholder="Search..."
              placeholderTextColor="gray"
              style={{ width: '90%',backgroundColor: '#fff', color: '#000', paddingHorizontal: 20 }}
            />
             <TouchableOpacity onPress={() => { navigation.navigate('Add Contact') }}>
                <Icon name='person-add' type='ionicons' color='black' size={30} />
             </TouchableOpacity>
          </View>

          <FlatList
            style={styles.flatList}
            ListEmptyComponent={renderEmpty}
            data={searchData ?? contacts}
            keyExtractor={item => item.rawContactId}
            renderItem={renderItem}
            />
          </SafeAreaView>
        </KeyboardAvoidingView>
    )
}

export default ContactsScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor:'#fff'
      },
      flatList: {
        height: '100%',
        flexGrow: 0
      }
})
