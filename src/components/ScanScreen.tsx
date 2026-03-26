import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { CloudUpload, FileText, ChevronRight, Sparkles, ScanLine, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { parseTimetableImage } from '../services/geminiService';
import { db, auth } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

export const ScanScreen: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const triggerUpload = () => fileInputRef.current?.click();
  const triggerCamera = () => cameraInputRef.current?.click();

  const handleScan = async () => {
    if (!selectedFile || !auth.currentUser) return;

    setIsScanning(true);
    setScanStatus("Analyzing image with AI...");

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);
      const base64Image = await base64Promise;

      setScanStatus("Extracting prayer times...");
      const parsedData = await parseTimetableImage(base64Image, selectedFile.type);

      if (parsedData && parsedData.length > 0) {
        setScanStatus("Saving to database...");
        // Assuming all dates are in the same month, get the month from the first date
        const firstDate = new Date(parsedData[0].dateStr);
        const monthId = `${firstDate.getFullYear()}-${String(firstDate.getMonth() + 1).padStart(2, '0')}`;
        const monthName = firstDate.toLocaleString('default', { month: 'long', year: 'numeric' });

        await setDoc(doc(db, 'schedules', monthId), {
          month: monthName,
          uploadedBy: auth.currentUser.uid,
          uploadedAt: new Date().toISOString(),
          days: parsedData
        });

        setScanStatus("Success! Schedule updated for all users.");
        setTimeout(() => {
          setSelectedFile(null);
          setPreviewUrl(null);
          setScanStatus(null);
        }, 3000);
      } else {
        throw new Error("No data extracted");
      }
    } catch (error) {
      console.error("Scan error:", error);
      setScanStatus("Failed to parse image. Please try again.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      <section className="text-center">
        <h2 className="font-headline text-3xl font-extrabold text-primary mb-3 tracking-tight">Scan Timetable</h2>
        <p className="text-on-surface-variant leading-relaxed max-w-md mx-auto text-sm">
          Upload your local prayer room's printed schedule. Our AI will automatically extract and sync the Athan and Iqama times.
        </p>
      </section>

      {/* Upload Area */}
      <div className="space-y-6">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          onChange={handleFileChange} 
        />
        <input 
          type="file" 
          ref={cameraInputRef} 
          className="hidden" 
          accept="image/*" 
          capture="environment" 
          onChange={handleFileChange} 
        />

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={triggerUpload}
            className="bg-surface-container-lowest rounded-2xl p-6 flex flex-col items-center justify-center border-2 border-dashed border-outline-variant hover:border-primary/40 transition-all group cursor-pointer active:scale-95 shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <ImageIcon className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-headline font-bold text-sm text-on-surface">Upload Image</h3>
            <p className="text-[9px] text-on-surface-variant mt-1">Gallery</p>
          </button>

          <button 
            onClick={triggerCamera}
            className="bg-surface-container-lowest rounded-2xl p-6 flex flex-col items-center justify-center border-2 border-dashed border-outline-variant hover:border-primary/40 transition-all group cursor-pointer active:scale-95 shadow-sm"
          >
            <div className="w-12 h-12 rounded-full bg-tertiary-container flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Camera className="w-6 h-6 text-tertiary" />
            </div>
            <h3 className="font-headline font-bold text-sm text-on-surface">Take Picture</h3>
            <p className="text-[9px] text-on-surface-variant mt-1">Camera</p>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Preview */}
          <div className="bg-surface-container rounded-xl overflow-hidden aspect-[3/4] relative group border border-outline-variant/10 shadow-inner">
            {previewUrl ? (
              <img 
                alt="Preview" 
                className="w-full h-full object-contain"
                src={previewUrl}
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center opacity-40">
                <ScanLine className="w-12 h-12 mb-4" />
                <p className="text-xs font-medium">No image selected</p>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-on-surface/5 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="bg-surface-container-lowest/90 px-4 py-2 rounded-full text-[10px] font-bold text-primary shadow-sm uppercase tracking-widest">
                {previewUrl ? 'Ready to Parse' : 'Waiting for Upload'}
              </span>
            </div>
          </div>

          {/* Smart Parsing Info */}
          <div className="bg-surface-container-low rounded-xl p-6 flex flex-col justify-between border border-outline-variant/5">
            <div>
              <div className="flex items-center gap-2 mb-4 text-tertiary">
                <Sparkles className="w-4 h-4" />
                <span className="font-bold text-[10px] tracking-wide uppercase">Smart Parsing</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed mb-6">
                For best results, ensure the image is well-lit and the text is clearly legible.
              </p>
              <ul className="space-y-3">
                {[
                  "Prayer Names (Fajr, Dhuhr...)",
                  "Athan & Iqama Times",
                  "Monthly Date Columns"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-[11px] font-medium text-on-secondary-container">
                    <span className="w-5 h-5 rounded-full bg-secondary-container flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <button 
              disabled={!selectedFile || isScanning}
              onClick={handleScan}
              className={cn(
                "w-full py-4 font-bold rounded-full flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 mt-4",
                selectedFile && !isScanning ? "bg-primary text-on-primary hover:shadow-md" : "bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed"
              )}
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {scanStatus || "Processing..."}
                </>
              ) : (
                <>
                  <ScanLine className="w-5 h-5" />
                  Extract Schedule
                </>
              )}
            </button>
            {scanStatus && !isScanning && (
              <p className="text-center text-xs mt-2 font-medium text-primary">{scanStatus}</p>
            )}
          </div>
        </div>
      </div>

      {/* History */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline font-bold text-lg text-primary">Upload History</h3>
          <button className="text-xs font-semibold text-primary/70 hover:text-primary transition-colors">View All</button>
        </div>
        <div className="space-y-3">
          <HistoryItem 
            name="Ramadan_Schedule_2024.pdf" 
            status="Successfully Synced" 
            date="March 12, 2024" 
          />
          <HistoryItem 
            name="Friday_Special_Timings.jpg" 
            status="Archived" 
            date="Feb 28, 2024" 
          />
        </div>
      </section>
    </div>
  );
};

const HistoryItem = ({ name, status, date }: { name: string, status: string, date: string }) => (
  <div className="bg-surface-container-lowest p-4 rounded-xl flex items-center justify-between hover:bg-surface-container transition-colors cursor-pointer group shadow-sm border border-outline-variant/5">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center">
        <FileText className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h4 className="font-bold text-on-surface text-sm">{name}</h4>
        <p className="text-[10px] text-on-surface-variant">Uploaded {date} • {status}</p>
      </div>
    </div>
    <ChevronRight className="w-5 h-5 text-outline group-hover:text-primary transition-colors" />
  </div>
);
