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
import { Icon, Button, Overlay, Chip  } from 'react-native-elements';
import DatePicker from 'react-native-date-ranges';
import { getUserTransactions } from '../firebase/functions';
import Contacts from 'react-native-contacts';
import auth from '@react-native-firebase/auth';
import {Picker} from '@react-native-picker/picker';


const TransactionsScreen = ({ route, navigation}) => {
      const [transactions, setTransactions] = useState([])
      const [visible, setVisible] = useState(false);
      var today = new Date();
      const contactDetail = useRef();
      const date = contactDetail.current !== undefined ? contactDetail.current.createdAt.toDate() : today;
      const hours = date.getHours() + ':' + date.getMinutes();
      const sign = contactDetail.current !== undefined  && contactDetail.current.type == 'Received' ? '+' : '-'
      const [operationSelect, setOperationSelect] = useState('All');
      const [filterActive, setFilterActive] = useState(false);
      const [filteredData, setFilteredData] = useState();
      const [chosenDate, setChosenDate] = useState();
      const [amountAsc, setamountAsc] = useState(true)
      const month = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sept","Oct","Nov","Dec"];

      const prefix = '+351';

      const getUserTransactionsList = async () => {
        var phoneNumber = auth().currentUser.displayName ?? route.params.phoneNumber;

        if (phoneNumber){
          let user_transactions = await getUserTransactions(phoneNumber);
          let transactionList = Object.entries(user_transactions);

          // check if user has contacts
          let numContact = await Contacts.getCount();

          if (numContact > 0) {
            // Get user name and into the List
            for (let i in transactionList){
              let userID = transactionList[i][1].userId;
              transactionList[i][1]['contactName'] = await getContactsByPhoneNumber(userID);
            }
          }

          setTransactions(transactionList)
          setFilteredData(transactionList)
        }
      }

      const getContactsByPhoneNumber = (phone_number) => {
        return Contacts.getContactsByPhoneNumber(phone_number).then((c) => {
          if(c.length == 0){
            return Contacts.getContactsByPhoneNumber(phone_number.replace(prefix, '')).then((c) => {
              if(c.length == 0) return null

              return c[0].displayName ?? c[0].givenName;
            });
          }

          return c[0].displayName ?? c[0].givenName;
        });
       };

      const filterDate = () => {
        var startDate = new Date(chosenDate.startDate);
        var endDate = new Date(chosenDate.endDate);

        let data = transactions;

        var resultDate = data.filter(a => {
          let curr_date = a[1].createdAt.toDate().toISOString().split('T')[0];

          var date = new Date(curr_date);
          return (date >= startDate && date <= endDate);
        });

        return resultDate;
      }

      const FilterByAmmout = (transactions) => {
        if (amountAsc) {
          return transactions.sort((a, b) => { return a[1].amount < b[1].amount})
        }

        return transactions.sort((a, b) => { return a[1].amount > b[1].amount})
      }

      const ApplyFilters = async() => {
        if(chosenDate) {
          setFilteredData( filterDate())
        }

        if (operationSelect !== 'All' && !chosenDate){
          setFilteredData(transactions.filter(t => t[1].type ===  operationSelect))
        } else if (operationSelect != 'All' && chosenDate){
          setFilteredData(filterDate().filter(t => t[1].type ===  operationSelect))
        } else if(operationSelect == 'All' && chosenDate){
          setFilteredData(filterDate())
        } else {
          setFilteredData(transactions)
        }

        setFilteredData(FilterByAmmout(transactions))

      }

      useEffect(() => {
        getUserTransactionsList();
      }, [])

      const renderItem = ({ item }) => {
        item = item[1];
        const color = item.type == 'Received' ? '#0aa42b' : '#a40a0a';

        return(
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', width:'100%', padding: 10}}
            onPress={() => {
              contactDetail.current = item;
              setVisible(!visible)
            }}
            >
            <View style={{ width:'80%' }}>
              <Text style={{ fontWeight:'bold', fontSize: 17, color: '#000' }}>{item.contactName ?? item.userId}</Text>
              <Text style={{ fontSize: 12, color: '#000', marginTop: 5}}>{item.createdAt.toDate().toISOString().split('T')[0]}</Text>
            </View>
            <View style={{ width:'20%', alignItems: 'center'}}>
              <Text style={{color: color}}>{sign}{item.amount}€</Text>
              <Icon
                name='location-arrow'
                type='font-awesome'
                style={{transform: [{rotateX: item.type == 'Received' ? '180deg' : '0deg'}]}}
                color={color}
                size={30}
                />
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
          <Text style={styles.text}>No transactions found</Text>
        </View>
        );
      };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS == "ios" ? "padding" : "height"}
            >
        <SafeAreaView style={{width:'100%', padding:20, marginTop: 20}}>

        <View style={{flexDirection: 'row', alignSelf: 'flex-end'}}>
        <Button buttonStyle={[styles.button, {backgroundColor: filterActive ? '#f6f6f6' : 'none'}]} type='solid' iconPosition= 'right'
          icon={{ name: "filter-list", size: 30, }}
          titleStyle={styles.titleButton}
          title="Filter"
          onPress={() => setFilterActive(!filterActive)}
        />
        </View>
        <View style={{display: filterActive ? 'flex' : 'none', flexDirection: 'column',height: '100%',width: '100%',
        alignSelf: 'flex-start' }}>
        <View style={{backgroundColor: '#f6f6f6', borderRadius: 10, padding: 20}}>
          <Text style={[styles.text, styles.title]}>Date:</Text>
          <DatePicker
            style={ { width: '100%', borderWidth:0} }
            customStyles = { {
                placeholderText:{ fontSize:20, color:'#000' }, // placeHolder style
                headerStyle : {backgroundColor:'#dedede'  },			// title container style
                headerMarkTitle : {color:'transparent'}, // title mark style
                headerDateTitle: {color:'#000' }, // title Date style
                contentInput: {color:'#000' }, //content text container style
                contentText: {color:'#000' }, //after selected text Style
            } } // optional
            centerAlign // optional text will align center or not
            allowFontScaling = {false} // optional
            placeholder={month[today.getMonth()] + '. '+ today.getDay() +' ,'+ today.getFullYear() +' - '+ month[today.getMonth()] + '. '+ today.getDay() +' ,'+ today.getFullYear()}
            mode={'range'}
            dateSplitter='to'
            ButtonStyle= {{backgroundColor: '#000'}}
            customButton={(onConfirm) => ( <Button
            buttonStyle={styles.button}
                          type='solid'
                          iconPosition= 'right'
                          icon={{
                              name: "arrow-right",
                              size: 30,
                          }}
                          titleStyle={styles.titleButton}
                          title="Apply"
                          onPress={onConfirm}
              />)}
            returnFormat='YYYY/MM/DD'
            outFormat='DD MMM. YYYY'
              onConfirm={date => setChosenDate(date)}
          />
          <Text style={[styles.text, styles.title]}>Operations:</Text>
          <View style={{flexDirection: 'row',paddingTop: 10, marginBottom: 10}}>
          <Chip
              title="All"
              type={ operationSelect == 'All' ? 'solid' : 'outline' }
              onPress={() => setOperationSelect("All")}
          />
          <Chip
              title="Send"
              type={ operationSelect == 'send' ? 'solid' : 'outline' }
              onPress={() => setOperationSelect("send")}
          />
          <Chip
              title="Received"
              type={ operationSelect == 'Received' ? 'solid' : 'outline' }
              onPress={() => setOperationSelect("Received")}
          />
          </View>

          <View>
          <Text style={[styles.text, styles.title]}>Price:</Text>
          <Picker
            style={styles.text}
            dropdownIconColor='black'
            selectedValue={amountAsc ? 'asc' : 'desc'}
            onValueChange={(itemValue, itemIndex) =>{
              if (itemValue == 'asc') {
                setamountAsc(true)
              } else{
                setamountAsc(false)
              }
            }}>
            <Picker.Item label="Ascendant" value="asc" />
            <Picker.Item label="Descendant" value="desc" />
          </Picker>
          </View>

          <Button raised
          color="white"
          title="Filter"
          onPress={() => {
            ApplyFilters()
            setFilterActive(!filterActive)
          }}
        />
        </View>

        </View>
          <FlatList
            style={[{display: filterActive ? 'none' : 'flex'}, styles.flatList]}
            ListEmptyComponent={renderEmpty}
            data={filteredData ?? filteredData}
            keyExtractor={item => item[0]}
            renderItem={renderItem}
            />
          </SafeAreaView>

          { contactDetail.current ?
          <Overlay overlayStyle={styles.overlay}isVisible={visible} onBackdropPress={() => setVisible(!visible)}>
          <View style={{backgroundColor: '#f6f6f6', width:'100%', alignItems: 'center', padding: 20, borderRadius: 10}}>
          <Icon
            reverse
            name='location-arrow'
            type='font-awesome'
            style={{transform: [{rotateX: contactDetail.current.type == 'Received' ? '180deg' : '0deg'}]}}
            color={contactDetail.current.type == 'Received' ? '#0aa42b' : '#a40a0a'}
            size={30}
            />

          {/* Divider start */}
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <View style={{flex: 1, height: 2, backgroundColor: 'gray'}} />
          <Text style={[styles.overlayText, styles.text, {width: 70, textAlign: 'center'}]}>{contactDetail.current.type == 'Received' ? 'From' : 'To'}</Text>
          <View style={{flex: 1, height: 2, backgroundColor: 'gray'}} />
          </View>
          {/* Divider end. */}

          <Text style={[styles.overlayText, styles.text, styles.title, { paddingTop: 5}]}>{contactDetail.current.contactName ?? contactDetail.current.userId}</Text>
          <Text style={[styles.overlayText, styles.text]}>{contactDetail.current.userId}</Text>
          </View>

          <Text style={[styles.text, styles.title, {fontSize: 15, paddingTop: 15}]}>Description</Text>
          <Text style={[styles.text,{fontSize: 15}]}>{contactDetail.current.description}</Text>
          <Text style={[styles.text, styles.title, {fontSize: 15, paddingTop: 15}]}>Date</Text>
          <Text style={[styles.text,{fontSize: 15}]}>{date.toISOString().split('T')[0]}  {hours}</Text>
      </Overlay>
          :null}
        </KeyboardAvoidingView>
    )
}

export default TransactionsScreen

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
      overlayText: {
        fontSize: 18,
      },
      flatList: {
        height: '100%',
      },
      button: {
        backgroundColor: '#fff'
      },
      overlay: {
        margin: 30,
        width: '80%',
        borderRadius: 10,
        paddingBottom: 30,
        alignItems: 'center'
      },
      titleButton: {
        color: '#000',
        fontSize: 15
      }
})
