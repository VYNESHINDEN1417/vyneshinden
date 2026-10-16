import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Minus, Plus, RotateCcw, X } from "lucide-react";
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
  const stripRef = useRef<HTMLDivElement>(null);
  const [fadeStart, setFadeStart] = useState(false);
  const [fadeEnd, setFadeEnd] = useState(false);
  const image = project.images[selected];

  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const updateFades = () => {
      const maxScroll = strip.scrollWidth - strip.clientWidth;
      setFadeStart(strip.scrollLeft > 1);
      setFadeEnd(strip.scrollLeft < maxScroll - 1);
    };
    updateFades();
    strip.addEventListener("scroll", updateFades, { passive: true });
    const observer = new ResizeObserver(updateFades);
    observer.observe(strip);
    return () => {
      strip.removeEventListener("scroll", updateFades);
      observer.disconnect();
    };
  }, [project.images.length]);

  if (!image) return null;
  const filename = image.src.split("/").at(-1);
  return (
    <figure className="work-figure">
      <Button variant="ghost" className={`work-image-button${project.images.length > 1 ? " gallery-main-image" : ""}`} aria-label={`Preview ${image.alt}`} onPointerDown={playClickSoundOnPointerDown} onClick={() => setOpen(true)}>
        <img src={image.src} alt={image.alt} />
      </Button>
      {project.images.length > 1 && (
        <div className="gallery-strip-wrap">
          <div className={`gallery-fade gallery-fade-start${fadeStart ? " is-visible" : ""}`} aria-hidden="true" />
          <div className="gallery-strip" role="group" aria-label="Gallery images" ref={stripRef}>
            {project.images.map((thumbnail, index) => (
              <Button key={thumbnail.src} variant="ghost" className="gallery-thumbnail" aria-label={`Select image ${index + 1}`} aria-pressed={selected === index} onPointerDown={playClickSoundOnPointerDown} onClick={() => setSelected(index)}>
                <img src={thumbnail.src} alt={thumbnail.alt} loading="lazy" />
              </Button>
            ))}
          </div>
          <div className={`gallery-fade gallery-fade-end${fadeEnd ? " is-visible" : ""}`} aria-hidden="true" />
        </div>
      )}
      <h2 className="work-title">{project.title}</h2>
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
