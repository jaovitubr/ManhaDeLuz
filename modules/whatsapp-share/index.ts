import { NativeModule, requireOptionalNativeModule } from "expo";

declare class WhatsAppShareModule extends NativeModule {
  shareFile(fileUri: string, mimeType: string, text: string | null): Promise<boolean>;
}

const WhatsAppShare = requireOptionalNativeModule<WhatsAppShareModule>("WhatsAppShare");

// Retorna false quando não dá para abrir o WhatsApp direto (iOS, WhatsApp não
// instalado ou build sem o módulo), para o app cair no compartilhamento padrão.
export async function ShareFile(fileUri: string, mimeType: string, text?: string) {
  return await WhatsAppShare?.shareFile(fileUri, mimeType, text ?? null) ?? false;
}
