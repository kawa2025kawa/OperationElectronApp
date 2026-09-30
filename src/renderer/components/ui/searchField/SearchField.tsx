// src/renderer/components/ui/searchField/SearchField.tsx

import type { InputHTMLAttributes, Ref } from "react";

import * as styles from "./searchField.css";

export interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

export const SearchField = ({
  className,
  placeholder = "検索...",
  ref,
  ...props
}: SearchFieldProps) => (
  <div className={styles.inner}>
    <input
      {...props}
      ref={ref}
      type="search"
      placeholder={placeholder}
      className={`${styles.searchField} ${className ?? ""}`.trim()}
    />
  </div>
);
