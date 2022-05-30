import { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Text,
  StatusBar,
  Image,
} from 'react-native';

import bgImg from '.../assets/bg.jpg';

import SearchButton from './components/SearchButton';
import DownloadButton from './components/DownloadButton';
import ShareButton from './components/ShareButton';
import Viewer from './components/Viewer';
import GetClientID from './components/GetClientID';

export default () => {
  const [SoundData, setSoundData] = useState(null);
  const [DownloadedFile, setDownloadedFile] = useState(null);
  const [ClientID, setClientID] = useState(null);

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
        {ClientID ? <>
          <Viewer soundData={SoundData} />
          {!SoundData ?
            <SearchButton
              client_id={ClientID}
              onFetch={(data, error) => {
                const collection = data?.collection?.find(val => val.title.toLowerCase().includes("manhã de luz"));
                console.log(collection);

                if (error) return alert(`Ocorreu um erro ao tentar pegar os dados: ${error.error || error}`);
                else if (collection) setSoundData(collection);
                else alert(`Collection not found!\nList of collections(${data?.collection?.length || 0}): "${data?.collection?.map(val => val.title).join(`", "`)}"`);
              }} />
            : <></>}
          {SoundData && !DownloadedFile ?
            <DownloadButton
              client_id={ClientID}
              soundData={SoundData}
              onDownloaded={(filename, error) => {
                if (error) alert(`Ocorreu um erro ao tentar fazer download: ${error.error}`);
                else setDownloadedFile(filename);
              }}
            />
            : <></>}
          {DownloadedFile ?
            <ShareButton
              soundData={SoundData}
              filename={DownloadedFile}
            />
            : <></>}
        </> : <GetClientID
          onClientID={client_id => setClientID(client_id)}
        />
        }
        {ClientID ? <Text style={styles.client_id}>ClientID: {ClientID}</Text> : <></>}
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
  client_id: {
    position: "absolute",
    bottom: 10,
    left: 10,
    right: 10,
    textAlign: "center",
    color: "white"
  }
});
