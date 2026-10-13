import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playClickSoundOnPointerDown } from "@/components/portfolio";

export function ShipImage() {
  const [open, setOpen] = useState(false);
  return (
    <figure className="work-figure">
      <h2 className="work-title">1. USS WISCONSIN 1.5:1</h2>
      <Button variant="ghost" className="work-image-button" aria-label="Preview USS Wisconsin image" onPointerDown={playClickSoundOnPointerDown} onClick={() => setOpen(true)}>
        <img src="/media/Ship1.jpg" alt="USS Wisconsin block-built battleship, with overhead, side, bow, and stern views" />
      </Button>
      <div className="work-caption-row">
        <figcaption>Click the image to pinch zoom</figcaption>
        <Button variant="link" className="image-download" asChild><a href="/media/Ship1.jpg" download="Ship1.jpg" onPointerDown={playClickSoundOnPointerDown}>Download image</a></Button>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="image-preview-overlay" />
          <Dialog.Content className="image-preview" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">USS Wisconsin image preview</Dialog.Title>
            <TransformWrapper minScale={1} maxScale={8} centerOnInit wheel={{ step: 0.08 }}>
              {({ zoomIn, zoomOut, resetTransform }) => <>
                <div className="image-preview-toolbar">
                  <Button variant="ghost" size="icon" aria-label="Zoom in" title="Zoom in" onPointerDown={playClickSoundOnPointerDown} onClick={() => zoomIn()}><Plus /></Button>
                  <Button variant="ghost" size="icon" aria-label="Zoom out" title="Zoom out" onPointerDown={playClickSoundOnPointerDown} onClick={() => zoomOut()}><Minus /></Button>
                  <Button variant="ghost" size="icon" aria-label="Reset zoom" title="Reset zoom" onPointerDown={playClickSoundOnPointerDown} onClick={() => resetTransform()}><RotateCcw /></Button>
                  <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close image preview" title="Close" onPointerDown={playClickSoundOnPointerDown}><X /></Button></Dialog.Close>
                </div>
                <TransformComponent wrapperClass="image-zoom-surface" contentClass="image-zoom-content">
                  <img src="/media/Ship1.jpg" alt="USS Wisconsin detailed image" draggable={false} />
                </TransformComponent>
              </>}
            </TransformWrapper>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </figure>
  );
}