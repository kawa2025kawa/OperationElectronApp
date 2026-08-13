// src/renderer/components/ui/searchField/SearchField.tsx

import React from "react";
import * as styles from "./searchField.css";

export interface SearchFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  ref?: React.Ref<HTMLInputElement>;
}

// React 19: forwardRef なしで ref を props として直接受領
export const SearchField: React.FC<SearchFieldProps> = ({
  className,
  placeholder = "検索...",
  ref,
  ...props
}) => (
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

SearchField.displayName = "SearchField";
export default SearchField;
