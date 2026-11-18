// src/renderer/components/ui/tabs/AnimatedTabs.tsx

import { memo, type ReactNode } from "react";
import { motion } from "motion/react";
import { Tabs } from "@base-ui/react/tabs";
import * as styles from "./animatedTabs.css";

export interface AnimatedTabItem {
  readonly id: number;
  readonly label: string;
}

export interface AnimatedTabsProps {
  readonly layoutId: string;
  readonly tabs: readonly AnimatedTabItem[];
  readonly selectedIndex: number;
  readonly onChange: (index: number) => void;
  readonly children: ReactNode;
}

export const AnimatedTabs = memo(function AnimatedTabs({
  layoutId,
  tabs,
  selectedIndex,
  onChange,
  children,
}: AnimatedTabsProps) {
  return (
    <Tabs.Root
      className={styles.root}
      value={selectedIndex}
      onValueChange={(value) => onChange(Number(value))}
    >
      <Tabs.List className={styles.tabBar}>
        {tabs.map((tab) => {
          const isActive = selectedIndex === tab.id;

          return (
            <Tabs.Tab key={tab.id} value={tab.id} className={styles.tabButton}>
              {isActive && (
                <motion.div
                  layoutId={layoutId}
                  className={styles.tabSlider}
                  transition={{
                    type: "spring",
                    stiffness: 380,
                    damping: 30,
                  }}
                />
              )}

              <span className={styles.buttonText}>{tab.label}</span>
            </Tabs.Tab>
          );
        })}
      </Tabs.List>

      <Tabs.Panel className={styles.panel} value={selectedIndex}>
        {children}
      </Tabs.Panel>
    </Tabs.Root>
  );
});

AnimatedTabs.displayName = "AnimatedTabs";