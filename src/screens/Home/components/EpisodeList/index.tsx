import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import useStyles from "./styles";
import { theme } from "@/src/constants/theme";
import { Episode } from "@/src/interfaces/episode";
import { formatDate, formatRelativeDay } from "@/src/utils/format";

interface EpisodeListProps {
  episodes: Episode[];
  selectedId: string;
  onSelect: (episode: Episode) => void;
}

export default function EpisodeList({ episodes, selectedId, onSelect }: EpisodeListProps) {
  const styles = useStyles();

  if (episodes.length < 2) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Outros dias</Text>
      <View style={styles.list}>
        {episodes.map((episode, index) => {
          const isSelected = episode.id === selectedId;
          const dayLabel = formatRelativeDay(episode.date) || "Episódio";

          return (
            <Pressable
              key={episode.id}
              onPress={() => onSelect(episode)}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${dayLabel}, ${episode.title}`}
              style={({ pressed }) => [
                styles.row,
                index > 0 && styles.divider,
                isSelected && styles.selectedRow,
                pressed && styles.pressedRow,
              ]}>
              <View style={styles.texts}>
                <Text style={[styles.day, isSelected && styles.selectedDay]}>{dayLabel}</Text>
                <Text
                  style={styles.date}
                  numberOfLines={1}>
                  {episode.date ? formatDate(episode.date) : episode.title}
                </Text>
              </View>
              <Ionicons
                name={isSelected ? "radio-button-on" : "chevron-forward"}
                size={20}
                color={isSelected ? theme.primaryColor : theme.fontTertiaryColor}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
