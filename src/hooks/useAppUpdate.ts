import * as Updates from "expo-updates";
import { useEffect, useState } from "react";

// Baixa atualizações OTA em segundo plano e só reinicia quando o usuário quiser,
// para não interromper um download em andamento.
export default function useAppUpdate() {
  const [isUpdateReady, setIsUpdateReady] = useState(false);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    let isActive = true;

    Updates.checkForUpdateAsync()
      .then(({ isAvailable }) => isAvailable ? Updates.fetchUpdateAsync() : null)
      .then((result) => isActive && result?.isNew && setIsUpdateReady(true))
      .catch(() => {
        // Sem internet ou servidor fora do ar: tenta de novo na próxima abertura.
      });

    return () => {
      isActive = false;
    };
  }, []);

  const applyUpdate = () => Updates.reloadAsync().catch(() => setIsUpdateReady(false));

  return { isUpdateReady, applyUpdate };
}
