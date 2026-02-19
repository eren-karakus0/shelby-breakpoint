"use client";

import { QRCodeSVG } from "qrcode.react";
import { Share2, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import GeometricAvatar from "./geometric-avatar";
import { Input } from "./ui/input";
import CopyButton from "./copy-button";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  title?: string;
  address: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  url,
  title = "Share Video",
  address,
}: ShareDialogProps) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          text: `Check out this video on Shelby Social: ${url}!`,
        });
      } catch {
        // User cancelled the share dialog - expected, not an error
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success(
          "Link copied to clipboard (sharing not supported in this browser)"
        );
      } catch {
        toast.error("Failed to copy link to clipboard");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border font-gt-planar p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Share2 className="w-5 h-5 text-primary" />
              {title}
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 p-6 py-8 font-gt-planar">
          <p className="text-sm text-muted-foreground text-center">
            Scan QR code below to share
          </p>

          <div className="p-4 bg-card border relative rounded-lg">
            <QRCodeSVG value={url} size={180} marginSize={0} level={"H"} />
            <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] bg-card p-2 rounded-full">
              <GeometricAvatar size={48} name={address} />
            </div>
            <p className="text-sm text-muted-foreground text-center"></p>
          </div>

          <div className="flex w-full items-center gap-4 py-3">
            <div className="flex-1 bg-border h-px" />
            <p className="text-sm text-muted-foreground text-center">
              or copy link below manually
            </p>
            <div className="flex-1 bg-border h-px" />
          </div>

          <div className="w-full space-y-2 flex flex-col items-center justify-center ">
            <div className="flex items-center gap-2 w-full">
              <Input value={url} readOnly className="flex-1" />

              <CopyButton text={url} />

              <Button size="icon" variant="outline" onClick={handleShare}>
                <Share />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
