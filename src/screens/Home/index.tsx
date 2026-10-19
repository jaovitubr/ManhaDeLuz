import Ionicons from "@expo/vector-icons/Ionicons";
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import * as Sharing from "expo-sharing";
import { useState } from "react";
import { Pressable, RefreshControl, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp, FadeOut, LinearTransition, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import EpisodeCard from "./components/EpisodeCard";
import EpisodeList from "./components/EpisodeList";
import useStyles from "./styles";
import * as WhatsAppShare from "@/modules/whatsapp-share";
import Button from "@/src/components/Button";
import ScreenStatus from "@/src/components/ScreenStatus";
import { MAX_LISTED_EPISODES } from "@/src/constants/soundcloud";
import { theme } from "@/src/constants/theme";
import useAppUpdate from "@/src/hooks/useAppUpdate";
import useDownload from "@/src/hooks/useDownload";
import useEpisodes from "@/src/hooks/useEpisodes";
import { getShareCaption, pickDefaultEpisode } from "@/src/utils/episode";
import { getErrorMessage } from "@/src/utils/error";

interface Notice {
  type: "info" | "error";
  text: string;
}

export default function HomeScreen() {
  const styles = useStyles();
  const { status, episodes, error, reload } = useEpisodes();
  const { isUpdateReady, applyUpdate } = useAppUpdate();
  const [selectedId, setSelectedId] = useState<string>();
  const [notice, setNotice] = useState<Notice | null>(null);

  const episode = episodes.find((item) => item.id === selectedId) ?? pickDefaultEpisode(episodes);
  const download = useDownload(episode);
  const percent = Math.round(download.progress * 100);

  // Avisos de compartilhamento têm prioridade; erros de download e de
  // atualização da lista somem sozinhos quando o estado muda.
  const errorToShow = download.error ?? (status === "ready" && error);
  const visibleNotice = notice ?? (errorToShow ? { type: "error", text: getErrorMessage(errorToShow) } as Notice : null);

  async function shareAudio(toWhatsApp: boolean) {
    if (!episode || !download.file) return;

    try {
      // O WhatsApp não aceita texto junto com áudio, então a legenda vai para a
      // área de transferência e a pessoa só precisa colar.
      const caption = getShareCaption(episode);
      const isCopied = await Clipboard.setStringAsync(caption).catch(() => false);
      setNotice(isCopied ? { type: "info", text: "Legenda copiada! É só colar na conversa." } : null);

      // Abre o WhatsApp direto; sem ele (ou no iOS), cai no compartilhamento padrão.
      if (toWhatsApp && await WhatsAppShare.ShareFile(download.file.uri, download.file.mimeType, caption)) return;

      if (!(await Sharing.isAvailableAsync())) {
        return setNotice({ type: "error", text: "O compartilhamento não está disponível neste aparelho." });
      }

      await Sharing.shareAsync(download.file.uri, {
        dialogTitle: caption,
        mimeType: download.file.mimeType,
        UTI: download.file.uti,
      });
    } catch (shareError) {
      setNotice({ type: "error", text: getErrorMessage(shareError) });
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name="sunny"
          size={22}
          color={theme.primaryColor}
        />
        <Text style={styles.headerTitle}>Manhã de Luz</Text>
      </View>

      {isUpdateReady && (
        <Animated.View entering={FadeInUp.springify()}>
          <Pressable
            onPress={applyUpdate}
            accessibilityRole="button"
            style={({ pressed }) => [styles.updateBanner, pressed && styles.pressed]}>
            <Ionicons
              name="sparkles"
              size={18}
              color={theme.onPrimaryColor}
            />
            <Text style={styles.updateBannerText}>Nova versão disponível · toque para atualizar</Text>
          </Pressable>
        </Animated.View>
      )}

      {/* Cada estado (carregando, erro, conteúdo) entra e sai com fade. */}
      {status === "loading" ? (
        <Animated.View
          key="loading"
          style={styles.container}
          entering={FadeIn}
          exiting={FadeOut}>
          <ScreenStatus
            isLoading
            title="Buscando o programa de hoje…"
          />
        </Animated.View>
      ) : !episode ? (
        <Animated.View
          key="error"
          style={styles.container}
          entering={FadeIn}
          exiting={FadeOut}>
          <ScreenStatus
            title="Não foi possível carregar"
            message={getErrorMessage(error)}
            onRetry={() => reload()}
          />
        </Animated.View>
      ) : (
        <Animated.ScrollView
          key="content"
          entering={FadeIn.duration(400)}
          contentContainerStyle={styles.content}
          refreshControl={(
            <RefreshControl
              refreshing={status === "refreshing"}
              onRefresh={() => reload(true)}
              tintColor={theme.primaryColor}
              colors={[theme.primaryDarkColor]}
              progressBackgroundColor={theme.backgroundColor}
            />
          )}>
          <Animated.View
            key={episode.id}
            entering={FadeInDown.duration(350)}>
            <EpisodeCard episode={episode} />
          </Animated.View>

          <Animated.View
            style={styles.actions}
            layout={LinearTransition}>
            {download.status === "done" ? (
              <Animated.View
                key="share"
                style={styles.buttons}
                entering={ZoomIn.springify()}>
                <Button
                  text="Enviar no WhatsApp"
                  icon="logo-whatsapp"
                  variant="success"
                  onPress={() => shareAudio(true)}
                  accessibilityHint="Abre o WhatsApp para escolher a conversa"
                />
                <Button
                  text="Outros apps"
                  icon="share-social-outline"
                  variant="secondary"
                  size="small"
                  onPress={() => shareAudio(false)}
                />
              </Animated.View>
            ) : download.status === "downloading" ? (
              <Animated.View
                key="downloading"
                style={styles.buttons}
                entering={FadeIn}>
                <Button
                  text={percent > 0 ? `Baixando… ${percent}%` : "Preparando download…"}
                  icon="cloud-download-outline"
                  progress={download.progress}
                  disabled
                />
                <Button
                  text="Cancelar"
                  icon="close"
                  variant="secondary"
                  size="small"
                  onPress={download.cancel}
                />
              </Animated.View>
            ) : (
              <Animated.View
                key="download"
                entering={FadeIn}>
                <Button
                  text={download.status === "error" ? "Tentar baixar de novo" : "Baixar áudio"}
                  icon={download.status === "error" ? "refresh" : "download-outline"}
                  onPress={() => {
                    setNotice(null);
                    download.start();
                  }}
                />
              </Animated.View>
            )}
          </Animated.View>

          {visibleNotice && (
            <Animated.View
              key={visibleNotice.text}
              entering={FadeInDown}
              exiting={FadeOut}
              layout={LinearTransition}
              style={[styles.notice, visibleNotice.type === "error" && styles.errorNotice]}
              accessibilityLiveRegion="polite">
              <Ionicons
                name={visibleNotice.type === "error" ? "alert-circle" : "information-circle"}
                size={18}
                color={visibleNotice.type === "error" ? theme.error : theme.fontSecondaryColor}
              />
              <Text style={[styles.noticeText, visibleNotice.type === "error" && styles.errorNoticeText]}>{visibleNotice.text}</Text>
            </Animated.View>
          )}

          <Animated.View layout={LinearTransition}>
            <EpisodeList
              episodes={episodes.slice(0, MAX_LISTED_EPISODES)}
              selectedId={episode.id}
              onSelect={(item) => {
                setSelectedId(item.id);
                setNotice(null);
              }}
            />
            <Text style={styles.version}>Versão {Constants.expoConfig?.version}</Text>
          </Animated.View>
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
}
