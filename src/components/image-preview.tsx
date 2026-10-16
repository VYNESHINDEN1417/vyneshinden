import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ArrowLeft, ArrowRight, Minus, Plus, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { playClickSoundOnPointerDown } from "@/components/portfolio";
import { PROJECTS, type PortfolioProject } from "@/lib/projects";

export function ShipImage() {
  const project = PROJECTS[0];
  return project ? <ProjectGallery project={project} /> : null;
}

export function ProjectGallery({ project }: { project: PortfolioProject }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(0);
  const [start, setStart] = useState(0);
  const image = project.images[selected];
  if (!image) return null;
  const maxStart = Math.max(0, project.images.length - 4);
  const filename = image.src.split("/").at(-1);
  return (
    <figure className="work-figure">
      <h2 className="work-title">{project.title}</h2>
      <Button variant="ghost" className={`work-image-button${project.images.length > 1 ? " gallery-main-image" : ""}`} aria-label={`Preview ${image.alt}`} onPointerDown={playClickSoundOnPointerDown} onClick={() => setOpen(true)}>
        <img src={image.src} alt={image.alt} />
      </Button>
      {project.images.length > 1 && <div className="gallery-selection" role="group" aria-label="Gallery images">
        {start > 0 && <Button variant="game" size="icon" className="gallery-arrow" aria-label="Previous thumbnails" title="Previous thumbnails" onPointerDown={playClickSoundOnPointerDown} onClick={() => setStart(Math.max(0, start - 4))}><span><ArrowLeft /></span></Button>}
        <div className="gallery-thumbnails">
          {project.images.slice(start, start + 4).map((thumbnail, offset) => <Button key={thumbnail.src} variant="ghost" className="gallery-thumbnail" aria-label={`Select image ${start + offset + 1}`} aria-pressed={selected === start + offset} onPointerDown={playClickSoundOnPointerDown} onClick={() => setSelected(start + offset)}>
            <img src={thumbnail.src} alt={thumbnail.alt} loading="lazy" />
          </Button>)}
        </div>
        <Button variant="game" size="icon" className="gallery-arrow" aria-label="Next thumbnails" title="Next thumbnails" disabled={start >= maxStart} onPointerDown={playClickSoundOnPointerDown} onClick={() => setStart(Math.min(maxStart, start + 4))}><span><ArrowRight /></span></Button>
      </div>}
      <div className="work-caption-row">
        <figcaption>Click the image to pinch zoom</figcaption>
        <Button variant="link" className="image-download" asChild><a href={image.src} download={filename} onPointerDown={playClickSoundOnPointerDown}>Download image</a></Button>
      </div>

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="image-preview-overlay" />
          <Dialog.Content className="image-preview" aria-describedby={undefined}>
            <Dialog.Title className="sr-only">{project.title} image preview</Dialog.Title>
            <TransformWrapper minScale={1} maxScale={8} centerOnInit wheel={{ step: 0.08 }}>
              {({ zoomIn, zoomOut, resetTransform }) => <>
                <div className="image-preview-toolbar">
                  <Button variant="ghost" size="icon" aria-label="Zoom in" title="Zoom in" onPointerDown={playClickSoundOnPointerDown} onClick={() => zoomIn()}><Plus /></Button>
                  <Button variant="ghost" size="icon" aria-label="Zoom out" title="Zoom out" onPointerDown={playClickSoundOnPointerDown} onClick={() => zoomOut()}><Minus /></Button>
                  <Button variant="ghost" size="icon" aria-label="Reset zoom" title="Reset zoom" onPointerDown={playClickSoundOnPointerDown} onClick={() => resetTransform()}><RotateCcw /></Button>
                  <Dialog.Close asChild><Button variant="ghost" size="icon" aria-label="Close image preview" title="Close" onPointerDown={playClickSoundOnPointerDown}><X /></Button></Dialog.Close>
                </div>
                <TransformComponent wrapperClass="image-zoom-surface" contentClass="image-zoom-content">
                  <img src={image.src} alt={image.alt} draggable={false} />
                </TransformComponent>
              </>}
            </TransformWrapper>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </figure>
  );
}