import React, { useState, useEffect } from 'react'
import { StyleSheet, Text, View, TextInput, PermissionsAndroid } from 'react-native'
import { Button, Divider } from 'react-native-elements';
import Contacts from 'react-native-contacts';

const AddContactScreen = ({ route, navigation}) => {
    const [phoneNumber, setphoneNumber] = useState('')
    const [contactName, setcontactName] = useState('')
    const prefix = '+351';
    const phoneNumberRegex = /^9[1236]{1}[0-9]{7}$|^2[3-9]{2}[0-9]{6}$|^2[12]{1}[0-9]{7}$/;

    async function handleContact() {
        if(phoneNumber.length == 0)  {
            alert('Please fill out all of the fields')
            return;
        }

        var contactInfo = {
            familyName: contactName,
            givenName: contactName,
            phoneNumbers: [{
                label: "mobile",
                number: prefix + phoneNumber.replace(prefix, ''),
              }],
          }

        await Contacts.openContactForm(contactInfo).then(contact => {
            alert('Contact added successfully!')
            navigation.navigate('Contacts')
        })
        .catch((err) => {
            console.log("Error while addding contact:" + err)
            alert("Error while addding contact")
        })
    }

    return (
        <View style={[styles.container, { padding: 30}]}>

            <View style={{ flexDirection: 'row', alignContent:'center', alignItems: 'center', backgroundColor: '#fff', padding: 8, borderRadius: 20 }} >
                <Text style={[styles.text, { fontSize: 18,fontWeight: 'bold', paddingRight: 10}]}>Number</Text>

                <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                value={phoneNumber}
                onChangeText={setphoneNumber}
                placeholder="eg: 912565895"
                placeholderTextColor="gray"
                keyboardType='phone-pad'
                style={{ fontSize: 18, backgroundColor: '#fff', color: '#000', paddingHorizontal: 20 }}
                />
            </View>

            <View style={{alignContent:'center', alignItems: 'center', backgroundColor: '#fff',marginTop: 10}} >
            <Text
            style={{color:'#0782F9', fontSize: 13,fontWeight: 'bold', paddingRight: 10}}
             onPress={() => {

                if(phoneNumber.length >= 9 && phoneNumberRegex.test(phoneNumber)){
                  navigation.navigate("SendScreen", {
                    contactName: phoneNumber,
                    phoneNumber: prefix + phoneNumber
                  })
                } else {
                    alert('Invalid Number')
                }
              }}>Send money without adding</Text>

            <Button
                    buttonStyle={styles.button}
                    type='solid'
                    iconPosition= 'right'
                    icon={{
                        name: "arrow-right",
                        size: 30,
                        color: "white",
                    }}
                    title="Add Contact"
                    onPress={handleContact}
               />
            </View>
        </View>
    )
}

export default AddContactScreen

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'center',
        backgroundColor:'#fff'
    },
    text: {
        color: 'gray'
    },
    button: {
        width: '70%',
        paddingTop: 15,
        paddingBottom: 15,
        paddingRight: 25,
        marginTop: 50,
        borderRadius: 10,
        backgroundColor: '#0782F9',
    },
})
