import ThemedStyleSheet from "@/src/utils/styles";

const useStyles = ThemedStyleSheet.create(({ theme }) => ({
  container: {
    alignItems: "center",
    paddingTop: 16,
  },
  artworkShadow: {
    borderRadius: 24,
    backgroundColor: theme.secondaryBackgroundColor,
    boxShadow: "0 12px 24px rgba(0, 0, 0, 0.5)",
  },
  artwork: {
    width: 200,
    height: 200,
    borderRadius: 24,
  },
  badge: {
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: theme.highlightBackgroundColor,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: theme.primaryColor,
  },
  title: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
    color: theme.fontColor,
  },
  meta: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 14,
    color: theme.fontSecondaryColor,
  },
}));

export default useStyles;
