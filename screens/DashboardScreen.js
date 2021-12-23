import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  ImageBackground,
  RefreshControl,
  ScrollView,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import {Icon, Button} from 'react-native-elements';
import {getLocalData, storeLocalData} from '../asyncStorage/functions';
import {
  getCurrentBalance,
  RemoveUserFromDatabase,
  round,
} from '../firebase/functions';

const DashboardScreen = ({route, navigation}) => {
  const [cardExist, setCardExist] = useState(true);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [vaultBalance, setVaultBalance] = useState(0);
  const image = {
    uri: 'https://media.istockphoto.com/vectors/subtle-winter-seamless-pattern-christmas-background-with-small-vector-id1207332367?k=20&m=1207332367&s=170667a&w=0&h=BE7WszPzBZu5KuJLfCiwhGoh8HJuI9ZblftoSmeBhFs=',
  };
  const vaultKey = 'vault_balance';
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      //console.log("refreshing component")
      setRefreshing(false);
    }, 2000);
  };

  const saveLeftoversToPiggyBank = async (vMoney, amount) => {
    //let totalAmount = parseFloat(vMoney) + parseFloat(leftAmount);
    let floor = parseFloat('0.' + amount.toString().split('.')[1]);

    let totalVaultBankAmount = parseFloat(vMoney) + parseFloat(floor);
    await storeLocalData(vaultKey, totalVaultBankAmount);
  };

  async function fetchCurrentBalance() {
    if (phoneNumber) {
      await getCurrentBalance(phoneNumber)
        .then(async balance => {
          let vaultMoney = await getLocalData(vaultKey);
          if (vaultMoney != null && !isNaN(vaultMoney)) {
            balance = round(balance - parseFloat(vaultMoney));
            //setVaultBalance(balance)
          }

          await saveLeftoversToPiggyBank(vaultMoney, balance);

          setCurrentBalance(balance);
          setLoading(false);
        })
        .catch(error => {
          //alert('Could not get current balance')
          console.log(error);
        });
    }
  }

  const handleSignOut = () => {
    auth()
      .signOut()
      .then(() => {
        navigation.replace('Login');
      })
      .catch(error => alert(error.message));
  };

  const handleDeleteCard = () => {
    if (cardExist) {
      if (currentBalance != 0) {
        Alert.alert(
          'Delete Card',
          'The account balance must be 0 to remove the card ',
          [
            {
              text: 'Ok',
              onPress: () => {},
              style: 'cancel',
            },
          ],
        );
      } else {
        Alert.alert(
          'Delete Card',
          'Are you sure you want to delete your card',
          [
            {
              text: 'Cancel',
              onPress: () => {},
              style: 'cancel',
            },
            {
              text: 'Delete',
              onPress: async () => {
                //var resp = RemoveUserFromDatabase(phoneNumber)

                storeLocalData('vault_balance', 0);
                setCardExist(false);
                handleSignOut();
              },
            },
          ],
        );
      }
    } else {
      setCardExist(true);
    }
  };

  const handleLongPressSendMoney = () => {
    if (cardExist) {
      Alert.alert(
        'Send to New Contact',
        'Are you sure you want to send money to a new contact without saving it?',
        [
          {
            text: 'No',
            onPress: () => {},
            style: 'cancel',
          },
          {
            text: 'Yes',
            onPress: async () => {
              navigation.navigate('Add Contact');
            },
            style: 'default',
          },
        ],
      );
    }
  };

  useEffect(() => {
    if (auth().currentUser.displayName) {
      setPhoneNumber(auth().currentUser.displayName);
    } else {
      setPhoneNumber(route.params.routePhoneNumber);
    }

    async function getbalance() {
      await fetchCurrentBalance();
    }

    getbalance();
  }, []);

  useEffect(() => {
    if (currentBalance >= 0) {
      setLoading(false);
    }

    async function getbalance() {
      await fetchCurrentBalance();
    }

    getbalance();
  });

  if (loading) {
    return (
      <View style={[styles.container, {backgroundColor: '#000034'}]}>
        <ActivityIndicator animating size="large" color="white" />
        <Text style={{color: 'white'}}>Loading...</Text>
      </View>
    );
  }

  return (
    <ImageBackground source={image} resizeMode="cover" style={styles.image}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.container}>
        <View style={styles.container}>
          <Button
            buttonStyle={{
              borderRadius: 5,
              backgroundColor: 'gray',
              display: currentBalance <= 0 || !cardExist ? 'flex' : 'none',
            }}
            type="solid"
            title={cardExist ? 'Remove Card' : 'Add Card'}
            icon={{
              name: cardExist ? 'trash' : 'plus',
              type: 'font-awesome',
              size: 12,
              color: 'white',
            }}
            iconRight
            iconContainerStyle={{marginLeft: 10}}
            titleStyle={{fontSize: 12}}
            onPress={handleDeleteCard}
          />

          {cardExist ? (
            <Image
              style={styles.card}
              size={styles.card}
              PlaceholderContent={<ActivityIndicator />}
              source={{
                uri: 'https://www.pngall.com/wp-content/uploads/2/Black-Credit-Card-PNG-Image.png',
              }}
            />
          ) : (
            <>
              <View style={styles.cardUnavailable}>
                <Text style={styles.textCard}>No card available!</Text>
              </View>
            </>
          )}

          <Text style={styles.phoneNumber}>{phoneNumber}</Text>
          <Text
            style={[
              styles.currentBalance,
              {color: currentBalance == 0 ? '#aa0e0e' : 'black'},
            ]}>
            {currentBalance > 0 ? currentBalance : 0} €
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate('Contacts');
              }}
              style={styles.columnCenter}
              onLongPress={() => handleLongPressSendMoney()}
              disabled={!cardExist || currentBalance == 0}>
              <Icon
                containerStyle={[
                  styles.mainButton,
                  {
                    backgroundColor:
                      !cardExist || currentBalance == 0 ? 'gray' : '#1e6091',
                  },
                ]}
                name="persons"
                type="fontisto"
                color="white"
                size={30}
              />
              <Text style={styles.iconText}>Send Money</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                navigation.navigate('PiggyBankVault', {
                  phoneNumber: phoneNumber,
                  balance: currentBalance,
                });
              }}
              style={styles.columnCenter}
              disabled={!cardExist}>
              <Icon
                containerStyle={styles.mainButton}
                name="dollar"
                type="fontisto"
                color="white"
                size={30}
              />
              <Text style={styles.iconText}>Vaul Bank</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                navigation.navigate('Transactions', {
                  phoneNumber: phoneNumber,
                });
              }}
              style={styles.columnCenter}
              disabled={!cardExist}>
              <Icon
                containerStyle={styles.mainButton}
                name="list-bullet"
                type="foundation"
                color="white"
                size={30}
              />
              <Text style={styles.iconText}>Transactions</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSignOut}
            style={styles.buttonSignOut}>
            <Text style={{color: '#6a6a6a'}}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </ImageBackground>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    //backgroundColor: '#fff'
  },
  mainButton: {
    backgroundColor: '#1e6091',
    width: 80,
    height: 80,
    justifyContent: 'center',
    borderRadius: 5,
  },
  iconText: {
    color: '#333437',
    fontSize: 12,
    fontWeight: '500',
  },
  button: {
    paddingTop: 15,
    paddingBottom: 15,
    paddingRight: 25,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#0782F9',
  },
  card: {
    width: 260,
    height: 160,
  },
  textCard: {
    color: 'gray',
  },
  buttonSignOut: {
    backgroundColor: '#d0d0d0',
    paddingTop: 13,
    paddingBottom: 13,
    paddingRight: 30,
    paddingLeft: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 50,
  },
  cardUnavailable: {
    borderColor: 'gray',
    borderRadius: 20,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 50,
    marginBottom: 20,
  },
  currentBalance: {
    color: '#000',
    fontWeight: '700',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 25,
  },
  phoneNumber: {
    color: '#000',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  columnCenter: {
    flexDirection: 'column',
    alignContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
  },
  image: {
    flex: 1,
    justifyContent: 'center',
  },
});
