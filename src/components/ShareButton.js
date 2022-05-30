import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';

import Share from 'react-native-share';
import Clipboard from "@react-native-community/clipboard";
import Icon from 'react-native-vector-icons/FontAwesome';

export default (props) => {
    async function StartShare() {
      Clipboard.setString(`Programa ${props.soundData.title}\n*Rádio Educadora FM 90.9 — Jacarezinho - PR*`);
      Share.open({
          url: "file://" + props.filename,
          subject: 'Music',
      })
      .then((res) => console.log(res))
      .catch((err) => err && console.log(err));
    }

    return (
        <View style={styles.container}>
          <TouchableOpacity style={styles.button} onPress={StartShare}>
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