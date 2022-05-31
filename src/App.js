import { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  Image,
} from 'react-native';
import * as Updates from "expo-updates";

import LoadClientID from './components/LoadClientID';
import LoadSoundData from './components/LoadSoundData';
import Viewer from './components/Viewer';
import DownloadButton from './components/DownloadButton';
import ShareButton from './components/ShareButton';

import bgImg from '../assets/bg.jpg';

export default function App() {
  const [soundData, setSoundData] = useState();
  const [downloadedFile, setDownloadedFile] = useState();
  const [clientID, setClientID] = useState();

  useEffect(() => {
    async function updateApp() {
      const { isAvailable } = await Updates.checkForUpdateAsync();

      if (isAvailable) {
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      }
    }

    updateApp();
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.bg}>
        <Image
          style={styles.bgImage}
          resizeMode="cover"
          source={bgImg}
          blurRadius={3}
        />
      </View>
      <SafeAreaView style={styles.container}>
        {!clientID ? (
          <LoadClientID onClientID={setClientID} />
        ) : (
          <>
            {!soundData && (
              <LoadSoundData
                clientId={clientID}
                onSoundData={setSoundData}
              />
            )}
            {!!soundData && <Viewer soundData={soundData} />}
            {!!soundData && !downloadedFile && (
              <DownloadButton
                clientId={clientID}
                soundData={soundData}
                onFinished={setDownloadedFile}
                onError={(error) => alert(`Ocorreu um erro ao tentar baixar: ${error}`)}
              />
            )}
            {!!soundData && downloadedFile && (
              <ShareButton
                soundData={soundData}
                filename={downloadedFile}
              />
            )}
            <Text style={styles.clientId}>ClientID: {clientID}</Text>
          </>
        )}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    height: "100%",
    paddingVertical: 100,
  },
  bg: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "#131314",
  },
  bgImage: {
    width: "100%",
    height: "100%",
    opacity: 0.6,
  },
  clientId: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    textAlign: "center",
    color: "white"
  }
});