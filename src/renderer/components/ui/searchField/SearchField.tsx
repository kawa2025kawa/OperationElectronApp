// src/renderer/components/ui/searchField/SearchField.tsx

import { memo, type InputHTMLAttributes, type Ref } from "react";
import { clsx } from "clsx";
import * as styles from "./searchField.css";

export interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  ref?: Ref<HTMLInputElement>;
}

export const SearchField = memo(function SearchField({
  className,
  placeholder = "検索...",
  ref,
  ...props
}: SearchFieldProps) {
  return (
    <div className={styles.inner}>
      <input
        {...props}
        ref={ref}
        type="search"
        placeholder={placeholder}
        className={clsx(styles.searchField, className)}
      />
    </div>
  );
});

SearchField.displayName = "SearchField";
