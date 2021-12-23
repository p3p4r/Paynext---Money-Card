/*
* Documentation
* https://react-native-async-storage.github.io/async-storage/docs/usage
*
*/

import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeLocalData = async (key, value) => {
    try {
        await AsyncStorage.setItem(key.toString(), value.toString())
        return true;
    } catch (e) {
        console.log("storeData:",e)
        return false;
    }
}


export const getLocalData = async (key) => {
    try {
        const value = await AsyncStorage.getItem(key.toString())
        if(value !== null || !isNaN(value)) {
            return value;
        }
        return null
    } catch(e) {
        console.log("getData:",e)
        return false;
    }
}

export const removedKeyLocalData = async (key) => {
    try {
        await AsyncStorage.removeItem(key.toString())
        console.log("Removed from store:", key.toString())
        return true;
    } catch(e) {
        console.log("removed:",e)
        return null;
    }
}

export const clearData = async() => {
    AsyncStorage.clear();
}