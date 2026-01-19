import React from "react";

export const sharedRootRef = React.createRef<HTMLDivElement>();

export const getRootRef = () => sharedRootRef.current;

// only ever update if we receive a real element that is connected
export const setRootRef = (el: HTMLDivElement | null) => {
  if (el && el.isConnected) {
    sharedRootRef.current = el;
  }
};
