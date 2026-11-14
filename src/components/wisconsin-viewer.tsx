import textureUrls from "@/lib/wasm/viewer/wisconsin-textures";
import { ShipViewer } from "@/components/ship-viewer";

export function WisconsinViewer() {
  return <ShipViewer name="USS WISCONSIN" objUrl="/models/wisconsin/Wisconsin%202025v2.obj" mtlUrl="/models/wisconsin/Wisconsin_2025v2.mtl" sizeLabel="18 MB" textureUrls={textureUrls} />;
}
