import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

import * as Sharing from 'expo-sharing';
import * as Clipboard from 'expo-clipboard';
import Icon from '@expo/vector-icons/FontAwesome';

export default function ShareButton({ soundData, filename }) {
  async function Share() {
    const title = `Programa ${soundData.title}\n*Rádio Educadora FM 90.9 — Jacarezinho - PR*`;

    await Clipboard.setStringAsync(title);
    await Sharing.shareAsync(filename, {
      dialogTitle: title,
      mimeType: 'audio/mpeg',
    });
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.button} onPress={Share}>
        <Icon name="share-alt" size={20} color="white" />
        <Text style={styles.buttonText}>Compartilhar</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20
  },
  button: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#36c936",
    padding: 10,
    paddingHorizontal: 25,
    borderRadius: 10,
    elevation: 5
  },
  buttonText: {
    color: "white",
    fontSize: 22,
    marginLeft: 15,
  }
});