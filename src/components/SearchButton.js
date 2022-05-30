import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';

import Icon from 'react-native-vector-icons/FontAwesome';

export default (props) => {
  const [isLoading, setIsLoading] = useState(false);

  async function FetchNew() {
    setIsLoading(true);

    if (props.onFetch) fetch(`https://api-v2.soundcloud.com/users/391691502/tracks?client_id=${props.client_id}&limit=25`)
    .then((res) => res.json()).then(data => {
      setIsLoading(false)
      props.onFetch(data || {});
    }).catch(err => {
      setIsLoading(false)
      props.onFetch({}, err);
    });
  }

  return (
    <View style={styles.container}>
      {isLoading ? <ActivityIndicator size={50} color="white" /> :
        <TouchableOpacity style={styles.button} onPress={FetchNew}>
          <Icon name="search" size={20} color="black" />
          <Text style={styles.buttonText}>Procurar</Text>
        </TouchableOpacity>
      }
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
  }
});