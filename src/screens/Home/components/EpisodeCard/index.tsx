import Ionicons from "@expo/vector-icons/Ionicons";
import { Image } from "expo-image";
import { Text, View } from "react-native";

import useStyles from "./styles";
import { theme } from "@/src/constants/theme";
import { Episode } from "@/src/interfaces/episode";
import { formatDate, formatDuration, formatRelativeDay } from "@/src/utils/format";

export default function EpisodeCard({ episode }: { episode: Episode }) {
  const styles = useStyles();
  const dayLabel = formatRelativeDay(episode.date);
  const duration = formatDuration(episode.durationMs);

  return (
    <View style={styles.container}>
      <View style={styles.artworkShadow}>
        <Image
          source={episode.artworkUrl ? { uri: episode.artworkUrl } : require("@/assets/icon.png")}
          placeholder={require("@/assets/icon.png")}
          style={styles.artwork}
          contentFit="cover"
          transition={250}
        />
      </View>
      {!!dayLabel && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{dayLabel.toUpperCase()}</Text>
        </View>
      )}
      <Text
        style={styles.title}
        numberOfLines={2}
        accessibilityRole="header">
        {episode.title}
      </Text>
      <View style={styles.meta}>
        {episode.date && (
          <View style={styles.metaItem}>
            <Ionicons
              name="calendar-outline"
              size={14}
              color={theme.fontSecondaryColor}
            />
            <Text style={styles.metaText}>{formatDate(episode.date)}</Text>
          </View>
        )}
        {!!duration && (
          <View style={styles.metaItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color={theme.fontSecondaryColor}
            />
            <Text style={styles.metaText}>{duration}</Text>
          </View>
        )}
      </View>
    </View>
  );
}
