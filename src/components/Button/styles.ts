import ThemedStyleSheet from "@/src/utils/styles";

export const SHIMMER_WIDTH = 90;

const useStyles = ThemedStyleSheet.create(({ theme }) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 56,
    paddingHorizontal: 24,
    borderRadius: 16,
    overflow: "hidden",
  },
  primary: {
    backgroundColor: theme.primaryColor,
  },
  success: {
    backgroundColor: theme.successColor,
  },
  secondary: {
    backgroundColor: theme.secondaryBackgroundColor,
    borderWidth: 1,
    borderColor: theme.borderColor,
  },
  small: {
    minHeight: 46,
  },
  disabled: {
    opacity: 0.6,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: SHIMMER_WIDTH,
  },
  shimmerGradient: {
    flex: 1,
  },
  progressTrack: {
    backgroundColor: theme.progressTrackColor,
    borderWidth: 1,
    borderColor: theme.primaryColor,
  },
  progressFill: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
    backgroundColor: theme.primaryColor,
  },
  progressContent: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  text: {
    fontSize: 18,
    fontWeight: "700",
  },
  smallText: {
    fontSize: 15,
    fontWeight: "600",
  },
}));

export default useStyles;
