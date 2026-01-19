// app/state/textStyles.ts
import { useFlyerState } from "./flyerState";

// global selectors, safe anywhere (JSX, helpers, nested components)
export const useTextStyles = () => useFlyerState.getState().textStyles;
export const useSetTextStyle = () => useFlyerState.getState().setTextStyle;

