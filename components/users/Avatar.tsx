import React from "react";
import styles from "./Avatar.module.css";
import Image from "next/image";

const IMAGE_SIZE = 48;

type TAvatarPropType = {
  name: string;
  otherStyles: string;
  // src: string;
};

export function Avatar({ name, otherStyles }: TAvatarPropType) {
  return (
    <div
      className={`${styles.avatar} ${otherStyles} h-9 w-9`}
      data-tooltip={name}
    >
      <Image
        // src={src}
        src={`https://liveblocks.io/avatars/avatar-${Math.floor(Math.random() * 30)}.png`}
        alt={name}
        fill
        // height={IMAGE_SIZE}
        // width={IMAGE_SIZE}
        className={styles.avatar_picture}
      />
    </div>
  );
}
