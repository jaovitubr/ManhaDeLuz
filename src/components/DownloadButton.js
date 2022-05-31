import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Bar as ProgressBar} from 'react-native-progress';
import Icon from '@expo/vector-icons/FontAwesome';

import { SoundDownload } from "../modules/SoundCloud";

export default function DownloadButton({ clientId, soundData, onFinished }) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(-1);

  async function Download() {
    setIsLoading(true);

    SoundDownload(soundData, clientId)
      .on("progress", setProgress)
      .on("error", error => {
        setIsLoading(false);
        alert("Ocorreu um erro no download: " + error);
      })
      .on("end", filename => {
        setIsLoading(false);
        onFinished(filename);
      });
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <ProgressBar
          progress={progress}
          width={200}
          indeterminate={progress < 0}
          color="#36c936"
          borderColor="black"
          backgroundColor="white"
        />
      ) : (
        <TouchableOpacity style={styles.button} onPress={Download}>
          <Icon name="download" size={20} color="black" />
          <Text style={styles.buttonText}>Baixar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  button: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 10,
    paddingHorizontal: 25,
    borderRadius: 10,
    elevation: 5
  },
  buttonText: {
    color: "black",
    fontSize: 22,
    marginLeft: 15,
  },
});