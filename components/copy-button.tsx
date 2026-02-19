import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export default function CopyButton({ text }: { text: string }) {
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (isCopied) {
      const timeout = setTimeout(() => {
        setIsCopied(false);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [isCopied]);

  return (
    <Button
      size="icon"
      variant="outline"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
        setIsCopied(true);
      }}
      disabled={isCopied}
    >
      <AnimatePresence mode="wait">
        {isCopied ? (
          <motion.div
            key="check"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
          >
            <CheckIcon />
          </motion.div>
        ) : (
          <motion.div
            key="copy"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.1 }}
          >
            <CopyIcon />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
