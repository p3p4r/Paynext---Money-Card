import firestore from '@react-native-firebase/firestore';
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import {getLocalData} from '../asyncStorage/functions';

// Documentation: https://rnfirebase.io/firestore/usage

/*  Get users from Database [ eg. getUsersInfo('94KTE5ZKJBWRQ4NbLvUEhKwj8gv2') ]
 *
 * @param string userId userId
 *
 * @return int of current balance
 */
export const getCurrentBalance = async userId => {
  if (!userId) {
    return 'No user id passed.';
  }
  let balance;
  await firestore()
    .collection('users')
    .doc(userId)
    .get()
    .then(function (doc) {
      if (doc.data()) {
        balance = doc.data().current_balance;
      }
    });

  return balance;
};

// Documentation: https://rnfirebase.io/firestore/usage

/*  Get users from Database
 *
 * @param string userId userId
 * @param array data user data
 *
 * @return string user information data
 */
export const getUsers = async () => {
  let users;
  await firestore()
    .collection('users')
    .get()
    .then(function (doc) {
      users = doc._docs;
    });

  return users;
};

/*
 * @param Add user to firebase [ eg. createUserInDatabase('94KTE5ZKJBWRQ4NbLvUEhKwj8gv2', { dbFieldName: new_value } ) ]
 *
 * @param return bool
 */
export const createUserInDatabase = async (userId, data) => {
  if (!userId) {
    alert('user is not defined');
    return false;
  }
  let device_token = await messaging().getToken();
  const doc = firestore().collection('users').doc(userId);
  const user = await doc.get();

  if (!user._exists) {
    doc
      .set(
        {
          phoneNumber: data.phoneNumber ?? userId,
          current_balance: data.current_balance ?? 0,
          vault_balance: data.vault_balance ?? 0,
          device_token,
          updatedAt: new Date(),
          createdAt: new Date(),
        },
        {merge: false},
      )
      .then(() => {
        /*console.log('User added!');*/
      })
      .catch(error => {
        console.log('Error while add new user', error);
      });
  }
};

/*
* @param Remove user to firebase
* @param string userId userId

* @param return bool
*/
export const RemoveUserFromDatabase = async userId => {
  if (!userId) {
    alert('user is not defined');
    return false;
  }
  firestore()
    .collection('users')
    .doc(userId)
    .delete()
    .then(() => {
      //console.log('User deleted!');
      return true;
    });

  return false;
};

/* Update user data  [eg. UpdateUserData(userId, { current_balance: 20 } ) ]
*
* @param string userId userId
* @param array data user data

* @param return bool
*/
export const UpdateUserData = async (userId, data) => {
  if (!userId) {
    alert('user is not defined');
    return false;
  }
  let status = false;

  await firestore()
    .collection('users')
    .doc(userId)
    .update(data)
    .then(() => {
      console.log('User updated!');
      status = true;
    });

  return status;
};

// Documentation: https://rnfirebase.io/firestore/usage

/*  Get users from Database [ eg. getUsersInfo('94KTE5ZKJBWRQ4NbLvUEhKwj8gv2') ]
 *
 * @param string userId userId
 * @param array data user data
 *
 * @return string user information data
 */
export const getUsersInfo = async userId => {
  if (!userId) {
    return 'No user id passed.';
  }

  let userInfo;
  await firestore()
    .collection('users')
    .doc(userId)
    .get()
    .then(function (doc) {
      userInfo = doc.data();
    })
    .catch(error => {
      console.log(error);
    });

  return userInfo;
};

/*
 * Send money to User
 *
 * @param return void
 */
export const sendMoneyToUser = async (
  userIdSent,
  currentIdReceive,
  description,
  amount,
) => {
  if (!userIdSent && !amount && !currentIdReceive) {
    alert('No Phone number or user balance found');
    return;
  }
  // Check data from user who is sending money
  var userSentInfo = await getUsersInfo(userIdSent);
  if (!userSentInfo) {
    alert('User not Found!');
    return;
  }

  // get data from user who will received the money
  var userReceivingInfo = await getUsersInfo(currentIdReceive);
  if (!userReceivingInfo) {
    alert('User not Found!');
    return;
  }

  var userSentMoney = userSentInfo.current_balance;
  // Remove Vault Balance from user balance

  let vaultMoney = await getLocalData('vault_balance');
  if (vaultMoney != null) {
    userSentMoney = parseFloat(userSentMoney) - parseFloat(vaultMoney);
  }

  var userReceivingMoney = userReceivingInfo.current_balance;

  // update user Sending Money Wallet
  if (userSentMoney == 0) {
    alert('Please insert some money!');
    return;
  }

  if (amount > userSentMoney) {
    alert('Exceeded your limit');
    return;
  }

  if (userIdSent == currentIdReceive) {
    alert('Nice Try xD ...');
    return;
  }

  var respSent = await UpdateUserData(userIdSent, {
    current_balance: userSentMoney - amount,
  });

  if (!respSent) {
    alert('Error sending money');
    return;
  }
  await saveTransaction(
    userIdSent,
    currentIdReceive,
    amount,
    description,
    'Sent',
  );

  // update user Receiving Money Wallet
  let ReceivingMoney = userReceivingMoney + amount;
  if (!ReceivingMoney) {
    alert('Error sending money');
    return;
  }

  var RespReceiving = await UpdateUserData(currentIdReceive, {
    current_balance: ReceivingMoney,
  });
  if (!RespReceiving) {
    alert('Error sending money');
    return;
  }
  await saveTransaction(
    currentIdReceive,
    userIdSent,
    amount,
    description,
    'Received',
  );

  // TODO- save Transaction

  // Sent notification

  let title = 'Money Received';
  let body = 'Happy BDay! ' + userIdSent + ' sent you ' + amount + '€';
  let device_token = userReceivingInfo.device_token;

  if (device_token.length == 0) {
    console.log('user device token not found, unable to send notification');
  }

  sendNotification(device_token, body, title);

  return true;
};

/*
 * @param Add user to firebase [ eg. createUserInDatabase('94KTE5ZKJBWRQ4NbLvUEhKwj8gv2', { dbFieldName: new_value } ) ]
 *
 * @param return bool
 */
export const saveTransaction = async (
  docUser,
  userId,
  amount,
  description,
  type,
) => {
  if (!docUser) {
    alert('User of the document is not defined');
    return false;
  }
  if (!userId) {
    alert('User Id is not defined');
    return false;
  }
  if (!amount) {
    alert('Amount is not defined');
    return false;
  }
  if (!description) {
    alert('Description is not defined');
    return false;
  }
  if (!type) {
    alert('Type is not defined');
    return false;
  }
  let data = {};
  let id_timestamp = Math.round(new Date().getTime() / 1000);
  let content = {
    userId,
    amount,
    type,
    description,
    createdAt: new Date(),
  };
  data[id_timestamp] = content;

  firestore()
    .collection('transactions')
    .doc(docUser)
    .update(data)
    .then(() => {
      console.log('Transation added!');
    })
    .catch(error => {
      console.log('Error while add new user', error);
    });

  return false;
};

export const requestNotificationPermission = async () => {
  // IOS Only
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    //console.log('Authorization status:', authStatus);
    return true;
  } else {
    alert('You wont be warn when you received money.');
  }
  return false;
};

export const sendNotification = async (deviceToken, body, title) => {
  if (!deviceToken) {
    alert('Device Token');
  }
  if (!body) {
    alert('Body empty');
  }

  if (!title) {
    alert('Title empty');
  }
  // 24h token
  const access_token =
    '<your_acess_token_goes_here';
  const headers = {
    Authorization: 'key=' + access_token,
    'Content-Type': 'application/json',
  };

  const url = 'https://fcm.googleapis.com/fcm/send';

  const data = {
    to: deviceToken,
    data: {},
    notification: {
      body: body ?? 'Your received a notification',
      title: title ?? 'Great, you might have received money.',
    },
  };

  axios
    .post(url, data, {headers: headers})
    .then(response => {
      console.log(response);
    })
    .catch(error => {
      console.log(error);
    });
};

export const getUserTransactions = async userId => {
  if (!userId) {
    return 'No user id passed.';
  }

  let transactions;
  await firestore()
    .collection('transactions')
    .doc(userId)
    .get()
    .then(function (doc) {
      transactions = doc._data;
    });

  return transactions;
};

export const createUserTransactionInDatabase = async userId => {
  if (!userId) {
    alert('user is not defined');
    return false;
  }
  const doc = firestore().collection('transactions').doc(userId);
  const user = await doc.get();

  if (!user._exists) {
    doc
      .set({})
      .then(() => {
        /*console.log('User added!');*/
      })
      .catch(error => {
        console.log('Error while add new user in transactions', error);
      });
  }
};

export const round = num => {
  var m = Number((Math.abs(num) * 100).toPrecision(15));
  return (Math.round(m) / 100) * Math.sign(num);
};
