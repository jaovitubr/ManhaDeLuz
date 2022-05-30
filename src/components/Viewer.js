import {
  StyleSheet,
  View,
  Text
} from 'react-native';

import Image from 'react-native-image-progress';

export default (props) => {
  const soundData = props.soundData;

  return (
    <View style={styles.container}>
      { soundData ?
        <>
          <Text style={styles.title}>{soundData.title}</Text>
          <View style={styles.imageContainer}>
            <Image
              indicatorProps={{size: 50, color:"white"}}
              source={{ uri: soundData.artwork_url }}
              style={styles.image}
            />
            </View>
        </>
        : <></>
      }
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    display: "flex",
    alignItems: "center",
  },
  title: {
    width: "100%",
    height: 90,
    textAlignVertical: "center",
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    color: "white",
    textShadowColor: 'rgba(0, 0, 0, 0.9)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 40
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 10,
    overflow: "hidden"
  },
  image: {
    width: 120,
    height: 120,
  }
});