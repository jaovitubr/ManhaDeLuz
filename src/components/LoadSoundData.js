import { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import Icon from '@expo/vector-icons/FontAwesome';

import { GetCollection } from "../modules/SoundCloud";

export default function LoadSoundData({ clientId, onSoundData }) {
  const [Error, setError] = useState();

  useEffect(() => {
    if (!Error) {
      GetCollection(clientId).then(onSoundData).catch(setError);
    }
  }, [Error]);


  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {!Error ? 'Procurando dados do audio' : Error}
      </Text>
      {!Error ? (
        <ActivityIndicator size={50} color="white" />
      ) : (
        <TouchableOpacity style={styles.button} onPress={() => setError(null)}>
          <Icon name="search" size={20} color="black" />
          <Text style={styles.buttonText}>Procurar</Text>
        </TouchableOpacity>
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
  button: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 10,
    paddingHorizontal: 25,
    marginTop: 20,
    borderRadius: 10,
    elevation: 5
  },
  buttonText: {
    color: "black",
    fontSize: 22,
    marginLeft: 15,
  }
});