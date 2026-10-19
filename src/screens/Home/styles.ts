import ThemedStyleSheet from "@/src/utils/styles";

const useStyles = ThemedStyleSheet.create(({ theme }) => ({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: theme.fontColor,
  },
  updateBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: theme.primaryColor,
  },
  updateBannerText: {
    fontSize: 14,
    fontWeight: "700",
    color: theme.onPrimaryColor,
  },
  pressed: {
    opacity: 0.8,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  actions: {
    gap: 12,
    marginTop: 32,
  },
  buttons: {
    gap: 12,
  },
  notice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    padding: 12,
    borderRadius: 10,
    backgroundColor: theme.secondaryBackgroundColor,
  },
  errorNotice: {
    backgroundColor: theme.errorBackgroundColor,
  },
  noticeText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: theme.fontSecondaryColor,
  },
  errorNoticeText: {
    color: theme.error,
  },
  version: {
    marginTop: 32,
    fontSize: 12,
    textAlign: "center",
    color: theme.fontTertiaryColor,
  },
}));

export default useStyles;
