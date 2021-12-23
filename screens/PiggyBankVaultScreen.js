import React, {useState, useEffect} from 'react';
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
  Keyboard,
  TouchableOpacity,
} from 'react-native';
import {
  storeLocalData,
  getLocalData,
  removedKeyLocalData,
} from '../asyncStorage/functions';
import {Button, Icon} from 'react-native-elements';
import CurrencyInput from 'react-native-currency-input';
import {getCurrentBalance} from '../firebase/functions';

const PiggyBankVaultScreen = ({route, navigation}) => {
  const {phoneNumber, balance} = route.params;
  const [vaultBalance, setVaultBalance] = useState('0.00');
  const [amount, setAmount] = useState(0);
  const [maxValue, setMaxValue] = useState(balance ?? 999);
  const [isKeyboardOpen, setKeyboardStatus] = useState(false);
  const vaultKey = 'vault_balance';

  async function handleVaulTransactions(mode = 'Add') {
    if (amount == 0) {
      alert('Please add some money');
      return;
    }

    if (mode == 'Add') {
      if (amount > maxValue) {
        alert('Exceded the limit.');
        return;
      }
    } else {
      if (amount > vaultBalance) {
        alert('Exceded the limit.');
        return;
      }
    }

    let newAmount = parseFloat(vaultBalance) + parseFloat(amount);

    if (mode == 'Redeem' || mode == 'redeem') {
      newAmount = parseFloat(vaultBalance) - parseFloat(amount);
    }

    if (await storeLocalData(vaultKey, newAmount)) {
      setVaultBalance(newAmount);
      alert(mode + ' successfully');

      navigation.navigate('Dashboard', {vaultBalance});
    } else {
      alert('Error ' + mode + ' money to piggy bank');
    }
  }

  useEffect(() => {
    async function getMoneyVault() {
      let vMoney = await getLocalData(vaultKey);
      if (vMoney != null && !isNaN(vMoney)) {
        setVaultBalance(vMoney);
      }
    }

    getMoneyVault();

    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardStatus(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardStatus(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      setKeyboardStatus(false);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Image
        style={
          !isKeyboardOpen
            ? [styles.borderRadius, styles.cardSM]
            : [styles.borderRadius, styles.cardXS]
        }
        PlaceholderContent={<ActivityIndicator />}
        source={{
          uri: 'https://cdn.dribbble.com/users/4362876/screenshots/14773825/artboard_8_2x-100.jpg',
        }}
      />

      <View
        style={{
          borderRadius: 10,
          padding: 5,
          paddingLeft: 20,
          paddingRight: 20,
          alignItems: 'center',
        }}>
        <Text
          style={[
            styles.text,
            {
              paddingTop: 10,
              fontWeight: 'bold',
              fontSize: 17,
              marginBottom: 10,
            },
          ]}>
          Piggy Balance:{' '}
          <Text style={{color: '#012e58'}}>{vaultBalance} €</Text>
        </Text>
      </View>

      <Text style={{color: '#5b5b5b'}}>Insert value</Text>
      <CurrencyInput
        style={styles.input}
        value={amount}
        onChangeValue={value => setAmount(value)}
        prefix="€"
        allowNegativeValue={false}
        delimiter="."
        separator=","
        precision={2}
        onChangeText={text => {
          if (text <= 0.0) {
            setAmount(0.0);
          }
        }}
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}>
        <View style={{marginLeft: 5}}>
          <TouchableOpacity
            onPress={() => handleVaulTransactions('Add')}
            style={styles.columnCenter}>
            <Icon
              style={[styles.mainButton, {width: 120}]}
              name="plus"
              type="feather"
              color="white"
              size={30}
            />
            <Text style={styles.iconText}>Add</Text>
          </TouchableOpacity>
        </View>
        <View style={{marginLeft: 5}}>
          <TouchableOpacity
            onPress={() => handleVaulTransactions('Redeem')}
            style={styles.columnCenter}>
            <Icon
              style={[
                styles.mainButton,
                {width: 70, backgroundColor: '#aa0e0e'},
              ]}
              name="minus"
              type="feather"
              color="white"
              size={30}
            />
            <Text style={styles.iconText}>Redeem</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default PiggyBankVaultScreen;

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
  card: {
    borderRadius: {
      borderRadius: 100,
    },
  },
  cardSM: {
    width: 200,
    height: 200,
  },
  cardXS: {
    width: 100,
    height: 100,
  },
  button: {
    paddingTop: 15,
    paddingBottom: 15,
    paddingRight: 25,
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#012e58',
  },
  input: {
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 20,
    fontSize: 30,
    color: '#5b5b5b',
    fontWeight: 'bold',
  },
  columnCenter: {
    flexDirection: 'column',
    alignContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 10,
  },
  mainButton: {
    backgroundColor: '#1e6091',
    height: 60,
    justifyContent: 'center',
    borderRadius: 5,
  },
  iconText: {
    color: '#333437',
    fontSize: 10,
    fontWeight: '500',
  },
});
