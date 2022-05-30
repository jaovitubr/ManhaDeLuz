import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Icon from 'react-native-vector-icons/FontAwesome';
import soundcloud_client_id, { CheckClientID } from '../modules/soundcloud_client_id';

export default ({ onClientID }) => {
  const [ClientIDError, setClientIDError] = useState(null);

  function FindClientID() {
    const savedClientId = await AsyncStorage.getItem('client_id');

    CheckClientID(savedClientId).then(validClientId => {
      if (validClientId) onClientID(savedClientId);
      else {
        soundcloud_client_id()
          .then((client_id) => {
            if (client_id) {
              await AsyncStorage.setItem('client_id', client_id);
              onClientID(client_id);
            } else {
              setClientIDError('Falha ao procurar por um Client ID');
            }
          })
          .catch((error) => {
            setClientIDError(error.toString());
          });
      }
    })
  }

  useEffect(() => {
    FindClientID();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {ClientIDError == null ? 'Procurando por um Client ID' : ClientIDError}
      </Text>
      {ClientIDError == null ? (
        <ActivityIndicator size={50} color="white" />
      ) : (
        <Icon name="times" size={50} color="red" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontSize: 22,
    marginBottom: 20,
  },
});
