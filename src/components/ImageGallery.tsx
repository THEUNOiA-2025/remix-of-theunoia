import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ImageGalleryProps {
  images: string[];
  coverImageUrl?: string;
  onCoverChange?: (url: string) => void;
  editable?: boolean;
}

export const ImageGallery = ({ 
  images, 
  coverImageUrl, 
  onCoverChange,
  editable = false 
}: ImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  const nextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <>
      <div className="space-y-4">
        {editable && onCoverChange && (
          <div className="space-y-2">
            <Label>Select Cover Image</Label>
            <RadioGroup 
              value={coverImageUrl || images[0]} 
              onValueChange={onCoverChange}
              className="gap-4"
            >
              {images.map((url, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={url} id={`image-${index}`} />
                  <Label 
                    htmlFor={`image-${index}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <img 
                      src={url} 
                      alt={`Option ${index + 1}`}
                      className="h-16 w-16 object-cover rounded"
                    />
                    <span className="text-sm">Image {index + 1}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg"
              onClick={() => openLightbox(index)}
            >
              <img
                src={url}
                alt={`Image ${index + 1}`}
                className="w-full h-full object-cover transition-transform group-hover:scale-110"
              />
              {coverImageUrl === url && (
                <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                  Cover
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative bg-background">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10"
              onClick={() => setLightboxOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>

            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10"
                  onClick={prevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10"
                  onClick={nextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </Button>
              </>
            )}

            <img
              src={images[selectedIndex]}
              alt={`Image ${selectedIndex + 1}`}
              className="w-full max-h-[80vh] object-contain"
            />

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
              {selectedIndex + 1} / {images.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
