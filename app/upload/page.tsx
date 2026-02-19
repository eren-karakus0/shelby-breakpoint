"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { VideoUploadForm } from "@/components/video-upload-form";
import useWalletUploadBlobs from "@/mutations/useWalletUploadBlobs";
import { VideoPreview } from "@/components/video-preview";
import { createShelbyDownloadURL } from "@/lib/shelby";
import { saveVideo } from "@/actions/videos";
import { Button } from "@/components/ui/button";
import { CheckIcon, PlayIcon, UploadIcon } from "@radix-ui/react-icons";
import { VideoRecorder } from "@/components/video-recorder";
import ClientOnly from "@/components/client-only";
import { toast } from "sonner";
import { UPLOAD_ALLOWLIST_ADDRESSES, BLOB_EXPIRATION_DAYS } from "@/lib/constants";
import Loader from "@/components/ui/loader";
import Link from "next/link";

type Step = "record" | "preview" | "uploading" | "complete";
type UploadProgress = "processing" | "uploading";

export default function Upload() {
  const [step, setStep] = useState<Step>("record");
  const [fileId, setFileId] = useState<string | null>(null);
  const [mediaBlobUrl, setMediaBlobUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] =
    useState<UploadProgress>("processing");
  const [description, setDescription] = useState("");

  const router = useRouter();
  const { account } = useWallet();

  const { mutateAsync: uploadBlobs } = useWalletUploadBlobs();

  // Process and upload mutation
  const { mutate: processAndUpload, isPending: isProcessing } = useMutation({
    mutationFn: async ({
      mediaBlobUrl,
      fileId,
      accountAddress,
      description,
    }: {
      mediaBlobUrl: string;
      fileId: string;
      accountAddress: string;
      description: string;
    }) => {
      // Step 1: Fetch the raw video blob
      setUploadProgress("processing");
      const response = await fetch(mediaBlobUrl);
      const blobData = new Uint8Array(await response.arrayBuffer());

      // Step 2: Upload to Shelby
      setUploadProgress("uploading");
      const expirationMicros = (Date.now() + BLOB_EXPIRATION_DAYS * 24 * 60 * 60 * 1000) * 1000;
      const blobName = `${fileId}/video.mp4`;
      await uploadBlobs({
        blobs: [{ blobName, blobData }],
        expirationMicros,
      });

      const url = createShelbyDownloadURL(accountAddress, blobName);
      await saveVideo({
        fileId,
        url,
        description,
      });

      return { fileId, url };
    },
    onSuccess: () => setStep("complete"),
    onError: (error) => {
      console.error("Upload failed:", error);
      // The gas station sponsor is out of funds.
      if (
        error.message.includes("INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE") &&
        error.message.includes("sponsor")
      ) {
        const sponsorAddress = error.message
          .split("sponsor: ")[1]
          .split(",")[0]
          .trim();
        toast.error(
          <div>
            The sponsor does not have enough APT to cover the transaction fee.
            Please fund with APT at{" "}
            <Link
              href={`https://docs.shelby.xyz/apis/faucet/aptos?address=${sponsorAddress}`}
              target="_blank"
              className="underline text-primary font-bold"
            >
              https://docs.shelby.xyz/apis/faucet/aptos?address=
              {sponsorAddress}
            </Link>{" "}
          </div>
        );
        // The user does not have enough ShelbyUSD
      } else if (
        error.message.includes("E_INSUFFICIENT_FUNDS") &&
        error.message.includes("Move abort")
      ) {
        toast.error(
          <div>
            The user does not have enough ShelbyUSD to cover the transaction
            fee. Please fund with ShelbyUSD at{" "}
            <Link
              href={`https://docs.shelby.xyz/apis/faucet/shelbyusd?address=${account?.address}`}
              target="_blank"
              className="underline text-primary font-bold"
            >
              https://docs.shelby.xyz/apis/faucet/shelbyusd?address=
              {account?.address?.toString()}
            </Link>{" "}
          </div>
        );
      } else {
        toast.error(error.message || "Upload failed. Please try again.");
      }
      setStep("preview");
    },
  });

  // Handle recording complete
  const handleRecordingComplete = (blobUrl: string, id: string) => {
    setMediaBlobUrl(blobUrl);
    setFileId(id);
    setStep("preview");
  };

  // Handle retake
  const handleRetake = () => {
    if (mediaBlobUrl) {
      URL.revokeObjectURL(mediaBlobUrl);
    }
    setMediaBlobUrl(null);
    setFileId(null);
    setStep("record");
  };

  // Handle process and upload
  const handleProcessAndUpload = (description: string) => {
    if (!mediaBlobUrl || !fileId || !account?.address) return;

    // Check if the account address is in the upload allowlist
    const accountAddress = account.address.toString();
    if (
      UPLOAD_ALLOWLIST_ADDRESSES.length > 0 &&
      !UPLOAD_ALLOWLIST_ADDRESSES.includes(accountAddress)
    ) {
      toast.error(
        `Account address ${accountAddress} is not in the upload allowlist`
      );
      return;
    }

    setStep("uploading");
    processAndUpload({
      mediaBlobUrl,
      fileId,
      accountAddress: account.address.toString(),
      description,
    });
  };

  function getUploadProgressMessage(progress: UploadProgress): string {
    switch (progress) {
      case "processing":
        return "Processing...";
      case "uploading":
        return "Uploading to Shelby...";
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-y-auto pb-8">
      {step === "record" ? (
        <div className="h-full w-full flex items-center justify-center md:p-8">
          <div className="w-full md:max-w-md lg:max-w-lg h-full">
            <ClientOnly>
              <VideoRecorder onRecordingComplete={handleRecordingComplete} />
            </ClientOnly>
          </div>
        </div>
      ) : step === "preview" && mediaBlobUrl ? (
        <div className="h-fit p-4 pb-24">
          <div className="w-full md:max-w-md lg:max-w-lg h-full mx-auto flex flex-col gap-6">
            <VideoUploadForm
              onConfirm={(description: string) =>
                handleProcessAndUpload(description)
              }
              onRetake={handleRetake}
              isProcessing={isProcessing}
              processingLabel="Processing..."
              onDescriptionChange={setDescription}
            >
              <VideoPreview
                mediaBlobUrl={mediaBlobUrl}
                description={description}
              />
            </VideoUploadForm>
          </div>
        </div>
      ) : step === "uploading" ? (
        <div className="flex-1 h-full p-4 pb-24 overflow-y-auto">
          <div className="w-full md:max-w-md lg:max-w-lg h-full mx-auto flex flex-col gap-6">
            <div className="flex flex-col gap-4 h-full w-full bg-card rounded-lg p-6 border">
              <div className="space-y-4 w-full">
                <div>
                  <h2 className="text-xl font-gt-planar font-bold mb-1">
                    Uploading Video
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {getUploadProgressMessage(uploadProgress)}
                  </p>
                </div>
                <div className="aspect-9/16 bg-muted/20 rounded-lg flex items-center justify-center mx-auto w-full border-2 border-dashed border-muted">
                  <div className="text-center">
                    <Loader size="lg" className="mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm font-medium">
                      {getUploadProgressMessage(uploadProgress)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : step === "complete" ? (
        <div className="h-fit p-4 pb-24">
          <div className="w-full md:max-w-md lg:max-w-lg h-full mx-auto flex flex-col gap-6">
            <div className="flex flex-col gap-4 w-full bg-card rounded-lg p-6 border">
              <div className="space-y-4 w-full">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <CheckIcon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <h2 className="text-xl font-gt-planar font-bold">
                      Upload Complete!
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your video has been uploaded to Shelby.
                  </p>
                </div>

                {/* Video Preview */}
                {mediaBlobUrl && (
                  <div className="relative aspect-9/16 bg-muted/20 rounded-lg overflow-hidden w-full border border-border">
                    <video
                      src={mediaBlobUrl}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2">
                  <Button
                    onClick={() => {
                      if (mediaBlobUrl) {
                        URL.revokeObjectURL(mediaBlobUrl);
                      }
                      router.push(`/?id=${fileId}`);
                    }}
                    size="lg"
                  >
                    <PlayIcon className="w-4 h-4 mr-2" />
                    Watch Video
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (mediaBlobUrl) {
                        URL.revokeObjectURL(mediaBlobUrl);
                      }
                      setStep("record");
                      setFileId(null);
                      setMediaBlobUrl(null);
                      setUploadProgress("processing");
                    }}
                    size="lg"
                  >
                    <UploadIcon className="w-4 h-4 mr-2" />
                    Upload Another
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
