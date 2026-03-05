import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQRScanner } from "@/qr-code/useQRScanner";
import { CameraOff, Loader2, RefreshCw, ScanLine, X } from "lucide-react";
import { useEffect } from "react";

interface QRScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export default function QRScannerModal({
  open,
  onClose,
  onScan,
}: QRScannerModalProps) {
  const {
    qrResults,
    isScanning,
    isActive,
    isSupported,
    error,
    isLoading,
    canStartScanning,
    startScanning,
    stopScanning,
    switchCamera,
    clearResults,
    videoRef,
    canvasRef,
  } = useQRScanner({
    facingMode: "environment",
    scanInterval: 100,
    maxResults: 1,
  });

  // Auto-start when modal opens
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run only when open changes
  useEffect(() => {
    if (open && canStartScanning) {
      void startScanning();
    }
    return () => {
      if (isActive) {
        void stopScanning();
      }
    };
  }, [open]);

  // Handle scan result
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run only when qrResults changes
  useEffect(() => {
    if (qrResults.length > 0) {
      const result = qrResults[0];
      onScan(result.data);
      void stopScanning();
      clearResults();
      onClose();
    }
  }, [qrResults]);

  const handleClose = () => {
    if (isActive) {
      void stopScanning();
    }
    clearResults();
    onClose();
  };

  const isMobile =
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent
        className="max-w-sm p-0 overflow-hidden"
        data-ocid="qr.scanner.modal"
      >
        <DialogHeader className="p-4 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display flex items-center gap-2">
              <ScanLine className="w-5 h-5" />
              Scan Bundle QR Code
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              data-ocid="qr.scanner.close_button"
              className="h-8 w-8 p-0"
              onClick={handleClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="p-4 space-y-3">
          {/* Camera preview */}
          <div
            className="relative w-full rounded-lg overflow-hidden bg-muted"
            style={{ aspectRatio: "1 / 1" }}
          >
            <video
              ref={videoRef}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Scanning overlay */}
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-primary rounded-lg relative">
                  <span className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl" />
                  <span className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr" />
                  <span className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl" />
                  <span className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br" />
                </div>
              </div>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}

            {/* Not supported */}
            {isSupported === false && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted text-muted-foreground gap-2">
                <CameraOff className="w-10 h-10 opacity-50" />
                <p className="text-sm text-center px-4">
                  Camera not supported in this browser
                </p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted gap-2 p-4">
                <CameraOff className="w-10 h-10 text-destructive opacity-70" />
                <p className="text-sm text-center text-muted-foreground">
                  {error.message}
                </p>
              </div>
            )}
          </div>

          {/* Status text */}
          {isScanning && (
            <p className="text-xs text-center text-muted-foreground">
              Point camera at the bundle QR code...
            </p>
          )}

          {/* Controls */}
          <div className="flex gap-2">
            {!isActive && !isLoading && (
              <Button
                className="flex-1 gap-2"
                onClick={() => void startScanning()}
                disabled={!canStartScanning}
              >
                <ScanLine className="w-4 h-4" />
                Start Scanning
              </Button>
            )}
            {isActive && (
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={() => void stopScanning()}
                disabled={isLoading}
              >
                Stop
              </Button>
            )}
            {error && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void startScanning()}
                className="gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry
              </Button>
            )}
            {isActive && isMobile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void switchCamera()}
                disabled={isLoading}
              >
                Flip
              </Button>
            )}
          </div>

          {/* Instructions */}
          <p className="text-xs text-muted-foreground text-center">
            The bundle ID will be automatically filled when QR is scanned
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
