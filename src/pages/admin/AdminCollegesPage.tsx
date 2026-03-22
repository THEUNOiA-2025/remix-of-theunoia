import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface College {
  name: string;
  state: string;
  city: string;
  country: string;
  is_active: boolean;
}

const AdminCollegesPage = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState<{
    totalRows: number;
    uniqueRows: number;
    inserted: number;
    skippedDuplicates: number;
    invalidRows: number;
    failed: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): { colleges: College[]; totalRows: number; invalidRows: number } => {
    const lines = text.split(/\r?\n/);
    const colleges: College[] = [];
    let totalRows = 0;
    let invalidRows = 0;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      totalRows += 1;

      // Handle CSV with quoted fields
      const matches = line.match(/("([^"]*)"|[^,]+)/g);
      if (!matches || matches.length < 5) {
        invalidRows += 1;
        continue;
      }

      const cleanField = (field: string) => field.replace(/^"|"$/g, '').trim();

      const name = cleanField(matches[0]);
      // Skip header rows
      if (!name || name.toLowerCase() === 'name') continue;

      const state = cleanField(matches[1]);
      const city = cleanField(matches[2]);
      const country = cleanField(matches[3]) || 'India';
      const isActiveStr = cleanField(matches[4]);

      // DB columns are NOT NULL for these
      if (!state || !city) {
        invalidRows += 1;
        continue;
      }

      colleges.push({
        name,
        state,
        city,
        country,
        is_active: isActiveStr ? isActiveStr.toUpperCase() === 'TRUE' : true,
      });
    }

    return { colleges, totalRows, invalidRows };
  };

  const normalizeCollegeKey = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setStats(null);

    try {
      const text = await file.text();
      const { colleges, totalRows, invalidRows } = parseCSV(text);

      if (colleges.length === 0) {
        toast.error('No valid colleges found in CSV');
        setUploading(false);
        return;
      }

      // De-dupe by name (there is a unique constraint on colleges.name)
      const seen = new Set<string>();
      const uniqueColleges: College[] = [];
      let skippedDuplicates = 0;

      for (const c of colleges) {
        const key = normalizeCollegeKey(c.name);
        if (seen.has(key)) {
          skippedDuplicates += 1;
          continue;
        }
        seen.add(key);
        uniqueColleges.push({
          ...c,
          name: c.name.trim(),
          state: c.state.trim(),
          city: c.city.trim(),
          country: (c.country || 'India').trim(),
        });
      }

      toast.info(
        `Parsed ${totalRows.toLocaleString()} rows (${uniqueColleges.length.toLocaleString()} unique). Importing...`
      );

      const batchSize = 1000;
      let insertedCount = 0;
      let failedCount = 0;
      const totalBatches = Math.ceil(uniqueColleges.length / batchSize);

      for (let i = 0; i < uniqueColleges.length; i += batchSize) {
        const batch = uniqueColleges.slice(i, i + batchSize);
        const currentBatch = Math.floor(i / batchSize) + 1;

        // Use upsert + ignoreDuplicates so duplicates never fail the whole batch
        const { error } = await supabase
          .from('colleges')
          .upsert(batch, { onConflict: 'name', ignoreDuplicates: true });

        if (error) {
          console.error(`Batch ${currentBatch} error:`, error);

          // Fallback to row-by-row so one bad row can't drop an entire batch
          for (const row of batch) {
            const { error: rowError } = await supabase
              .from('colleges')
              .upsert([row], { onConflict: 'name', ignoreDuplicates: true });

            if (rowError) {
              failedCount += 1;
              console.error('Row insert error:', rowError, row);
            } else {
              insertedCount += 1;
            }
          }
        } else {
          insertedCount += batch.length;
        }

        const progressPercent = Math.round((currentBatch / totalBatches) * 100);
        setProgress(progressPercent);
      }

      setStats({
        totalRows,
        uniqueRows: uniqueColleges.length,
        inserted: insertedCount,
        skippedDuplicates,
        invalidRows,
        failed: failedCount,
      });

      if (failedCount === 0) {
        toast.success(`Imported ${insertedCount.toLocaleString()} colleges successfully.`);
      } else {
        toast.warning(
          `Imported ${insertedCount.toLocaleString()} colleges, but ${failedCount.toLocaleString()} rows failed.`
        );
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import colleges');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">College Management</h1>
        <p className="text-muted-foreground mt-2">
          Import and manage the list of approved colleges
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Import Colleges from CSV</CardTitle>
          <CardDescription>
            Upload a CSV file with columns: Name, State, CITY, Country, is_active
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload CSV
                </>
              )}
            </Button>
          </div>

          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing colleges...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {stats && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                {stats.failed === 0 ? (
                  <CheckCircle className="h-5 w-5 text-primary" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-destructive" />
                )}
                <span className="font-medium">Import Complete</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Rows parsed:</span>{' '}
                  <span className="font-medium">{stats.totalRows.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Unique:</span>{' '}
                  <span className="font-medium">{stats.uniqueRows.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Inserted:</span>{' '}
                  <span className="font-medium text-primary">{stats.inserted.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Skipped duplicates:</span>{' '}
                  <span className="font-medium">{stats.skippedDuplicates.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Invalid rows:</span>{' '}
                  <span className="font-medium">{stats.invalidRows.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Failed rows:</span>{' '}
                  <span className="font-medium text-destructive">{stats.failed.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCollegesPage;
