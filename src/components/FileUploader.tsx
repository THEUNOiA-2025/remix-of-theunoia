import { useState } from "react";
import { Upload, X, FileIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface FileUploaderProps {
  type: "image" | "file";
  maxFiles?: number;
  maxSizeInMB?: number;
  onFilesChange: (files: UploadedFile[]) => void;
  currentFiles?: UploadedFile[];
  accept?: string;
}

export const FileUploader = ({
  type,
  maxFiles = 5,
  maxSizeInMB = 10,
  onFilesChange,
  currentFiles = [],
  accept
}: FileUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const bucketName = type === "image" ? "project-images" : "project-files";
  const defaultAccept = type === "image" ? "image/*" : ".pdf,.doc,.docx,.xls,.xlsx";

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabase.storage
      .from(bucketName)
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
      .from(bucketName)
      .getPublicUrl(fileName);

    return {
      name: file.name,
      url: publicUrl,
      type: file.type,
      size: file.size,
    };
  };

  const handleFiles = async (files: FileList) => {
    if (currentFiles.length + files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
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
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    const uploadPromises = validFiles.map(file => uploadFile(file));
    const uploadedFiles = await Promise.all(uploadPromises);
    const successfulUploads = uploadedFiles.filter((f): f is UploadedFile => f !== null);
    
    onFilesChange([...currentFiles, ...successfulUploads]);
    setUploading(false);

    if (successfulUploads.length > 0) {
      toast({
        title: "Upload successful",
        description: `${successfulUploads.length} file(s) uploaded`,
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

  const removeFile = (index: number) => {
    const newFiles = currentFiles.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id={`file-upload-${type}`}
          className="hidden"
          onChange={handleChange}
          accept={accept || defaultAccept}
          multiple
          disabled={uploading || currentFiles.length >= maxFiles}
        />
        <label htmlFor={`file-upload-${type}`} className="cursor-pointer">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag and drop {type === "image" ? "images" : "files"} here, or click to select
          </p>
          <p className="text-xs text-muted-foreground">
            Max {maxFiles} files, {maxSizeInMB}MB each
          </p>
        </label>
      </div>

      {currentFiles.length > 0 && (
        <div className="space-y-2">
          {currentFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted rounded-lg"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {type === "image" ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="h-12 w-12 object-cover rounded"
                  />
                ) : (
                  <FileIcon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {uploading && (
        <p className="text-sm text-muted-foreground text-center">Uploading...</p>
      )}
    </div>
  );
};
