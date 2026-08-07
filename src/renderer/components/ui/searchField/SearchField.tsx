// src\renderer\components\ui\searchField\SearchField.tsx
import React, { forwardRef } from "react";
import * as styles from "./searchField.css";

export type SearchFieldProps = React.InputHTMLAttributes<HTMLInputElement>;

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  ({ className, placeholder = "検索...", ...props }, ref) => (
    <div className={styles.inner}>
      <input
        {...props}
        ref={ref}
        type="search"
        placeholder={placeholder}
        className={`${styles.searchField} ${className ?? ""}`.trim()}
      />
    </div>
  ),
);

SearchField.displayName = "SearchField";
