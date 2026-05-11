import { Plus } from "lucide-react";
import { motion } from "framer-motion";

export function FAB({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className="fixed z-30 bottom-20 md:bottom-8 right-5 md:right-8 h-14 w-14 rounded-2xl gradient-primary text-primary-foreground grid place-items-center shadow-[var(--shadow-glow)] animate-glow"
      aria-label="Quick add task"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </motion.button>
  );
}
