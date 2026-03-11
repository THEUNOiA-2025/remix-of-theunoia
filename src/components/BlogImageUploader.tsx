import { useState } from "react";
import { Upload, X, ImageIcon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface BlogImageUploaderProps {
  images: string[];
  coverImageUrl: string;
  onImagesChange: (images: string[]) => void;
  onCoverChange: (url: string) => void;
  maxFiles?: number;
  maxSizeInMB?: number;
}

export const BlogImageUploader = ({
  images,
  coverImageUrl,
  onImagesChange,
  onCoverChange,
  maxFiles = 10,
  maxSizeInMB = 10,
}: BlogImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const uploadFile = async (file: File): Promise<string | null> => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from("blog-images")
      .upload(fileName, file);

    if (error) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("blog-images")
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleFiles = async (files: FileList) => {
    if (images.length + files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} images allowed`,
        variant: "destructive",
      });
      return;
    }

    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    const validFiles = Array.from(files).filter(file => {
      if (file.size > maxSizeInBytes) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${maxSizeInMB}MB limit`,
          variant: "destructive",
        });
        return false;
      }
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    const uploadPromises = validFiles.map(file => uploadFile(file));
    const uploadedUrls = await Promise.all(uploadPromises);
    const successfulUploads = uploadedUrls.filter((url): url is string => url !== null);
    
    const newImages = [...images, ...successfulUploads];
    onImagesChange(newImages);
    
    // Auto-set first image as cover if none selected
    if (!coverImageUrl && successfulUploads.length > 0) {
      onCoverChange(successfulUploads[0]);
    }
    
    setUploading(false);

    if (successfulUploads.length > 0) {
      toast({
        title: "Upload successful",
        description: `${successfulUploads.length} image(s) uploaded`,
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const removeImage = (index: number) => {
    const removedUrl = images[index];
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    
    // If removed image was cover, select first remaining image as cover
    if (removedUrl === coverImageUrl) {
      onCoverChange(newImages[0] || "");
    }
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="blog-image-upload"
          className="hidden"
          onChange={handleChange}
          accept="image/*"
          multiple
          disabled={uploading || images.length >= maxFiles}
        />
        <label htmlFor="blog-image-upload" className="cursor-pointer">
          <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-1">
            Drag and drop images here, or click to select
          </p>
          <p className="text-xs text-muted-foreground">
            Max {maxFiles} images, {maxSizeInMB}MB each
          </p>
        </label>
      </div>

      {uploading && (
        <p className="text-sm text-muted-foreground text-center">Uploading...</p>
      )}

      {images.length > 0 && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">
            Select Cover Image <Star className="inline h-3 w-3 text-primary" />
          </Label>
          <RadioGroup
            value={coverImageUrl}
            onValueChange={onCoverChange}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
          >
            {images.map((url, index) => (
              <div key={index} className="relative group">
                <div
                  className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                    coverImageUrl === url 
                      ? "border-primary ring-2 ring-primary/20" 
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <label htmlFor={`cover-${index}`} className="cursor-pointer block">
                    <img
                      src={url}
                      alt={`Blog image ${index + 1}`}
                      className="h-24 w-full object-cover"
                    />
                    {coverImageUrl === url && (
                      <div className="absolute top-1 left-1 bg-primary text-primary-foreground rounded-full p-1">
                        <Star className="h-3 w-3 fill-current" />
                      </div>
                    )}
                  </label>
                  <RadioGroupItem
                    value={url}
                    id={`cover-${index}`}
                    className="sr-only"
                  />
                </div>
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                  disabled={uploading}
                  type="button"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground">
            Click on an image to set it as the cover image
          </p>
        </div>
      )}

      {images.length === 0 && !uploading && (
        <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No images uploaded yet</p>
        </div>
      )}
    </div>
  );
};
