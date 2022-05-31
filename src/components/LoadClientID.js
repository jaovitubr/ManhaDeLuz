import { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import Icon from '@expo/vector-icons/FontAwesome';

import { GetClientID } from "../modules/SoundCloud";

export default function LoadClientID({ onClientID }) {
  const [Error, setError] = useState();

  useEffect(() => {
    GetClientID().then(onClientID).catch(setError);
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {!Error ? 'Procurando por um Client ID' : Error}
      </Text>
      {!Error ? (
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
