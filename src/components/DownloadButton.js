import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import * as Progress from 'react-native-progress';
import Icon from 'react-native-vector-icons/FontAwesome';

import soundcloud_downloader from '../modules/soundcloud_downloader';

export default (props) => {
  const soundData = props.soundData;
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(-1);

  async function Download() {
    const file_name = ".\\audio.mp3";
    const stream_url = soundData.media.transcodings.find(val => val.format.protocol == "hls").url;
    if (!stream_url) return alert("Não foi encontrado uma stream url");

    setIsLoading(true);
    console.log("stream url:", stream_url);

    soundcloud_downloader(stream_url, file_name, props.client_id)
      .on("started", file_length => {
        console.log("Starting downloading... " + file_length);
      })
      .on("progress", percentage => {
        setProgress(percentage);
      })
      .on("error", error => {
        setIsLoading(false);
        alert("Ocorreu um erro ao tentar baixar a track: " + error);
      })
      .on("end", filename => {
        setIsLoading(false);
        if (props.onDownloaded) props.onDownloaded(filename);
      })
  }

  return (
    <View style={styles.container}>
      {isLoading ? <Progress.Bar progress={progress} width={200} indeterminate={progress < 0} color="#36c936" borderColor="black" backgroundColor="white" /> :
        <TouchableOpacity style={styles.button} onPress={Download}>
          <Icon name="download" size={20} color="black" />
          <Text style={styles.buttonText}>Baixar</Text>
        </TouchableOpacity>
      }
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