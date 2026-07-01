import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Camera, Upload, AlertCircle, RefreshCw, Save, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { createWorker } from 'tesseract.js';

export default function ReceiptScanner() {
  const { user } = useContext(AuthContext);
  
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState('');
  
  // OCR Form State
  const [scannedData, setScannedData] = useState(null);

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile) => {
    if (!selectedFile.type.startsWith('image/')) {
      return toast.error('Please upload an image file (PNG/JPG)');
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setScannedData(null);
  };

  // Regex Parsing Logic for Receipt text
  const parseReceiptText = (text) => {
    console.log('--- OCR RAW TEXT ---');
    console.log(text);
    console.log('--------------------');

    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let merchant = 'Unknown Merchant';
    let amount = 0;
    let date = new Date().toISOString().split('T')[0];
    let category = 'Others';

    // 1. Extract Merchant (usually first line or matches common keywords)
    if (lines.length > 0) {
      merchant = lines[0];
      // Check common merchants to refine
      const lowerText = text.toLowerCase();
      if (lowerText.includes('mcdonald')) merchant = "McDonald's";
      else if (lowerText.includes('starbucks')) merchant = "Starbucks Coffee";
      else if (lowerText.includes('domino')) merchant = "Domino's Pizza";
      else if (lowerText.includes('pizza hut')) merchant = "Pizza Hut";
      else if (lowerText.includes('uber')) merchant = "Uber Ride";
      else if (lowerText.includes('netflix')) merchant = "Netflix subscription";
      else if (lowerText.includes('amazon')) merchant = "Amazon India";
      else if (lowerText.includes('ola')) merchant = "Ola Cab";
    }

    // 2. Extract Category based on keywords
    const lowerText = text.toLowerCase();
    if (lowerText.match(/(pizza|food|burger|swiggy|zomato|starbucks|coffee|cafe|restaurant|dinout|eat)/)) {
      category = 'Food';
    } else if (lowerText.match(/(uber|ola|cab|ride|fuel|petrol|diesel|metro|train|flight)/)) {
      category = 'Travel';
    } else if (lowerText.match(/(amazon|myntra|clothes|shirt|pant|shoes|mall|shopping|buy)/)) {
      category = 'Shopping';
    } else if (lowerText.match(/(pharmacy|apollo|medicine|pill|hospital|doctor|clinic)/)) {
      category = 'Medicine';
    } else if (lowerText.match(/(electricity|bills|power|broadband|water|recharge)/)) {
      category = 'Bills';
    } else if (lowerText.match(/(netflix|spotify|youtube|subscription|prime)/)) {
      category = 'Subscriptions';
    } else if (lowerText.match(/(rent|landlord|room)/)) {
      category = 'Rent';
    }

    // 3. Extract Amount (look for total, grand total, net due, pay, balance etc.)
    // Matches numbers with decimal, e.g. total: 450.00
    const amountRegexes = [
      /(?:total|grand\s*total|net\s*due|amount|cash\s*due|pay|charge)\s*[:=]?\s*[₹$]?\s*(\d+(?:\.\d{2})?)/i,
      /total\s*(\d+(?:\.\d{2})?)/i,
      /(\d+(?:\.\d{2})?)\s*total/i
    ];

    for (let regex of amountRegexes) {
      const match = text.match(regex);
      if (match && match[1]) {
        amount = parseFloat(match[1]);
        break;
      }
    }

    // If still 0, look for any float amounts and pick the largest one (usually the total)
    if (amount === 0) {
      const allPrices = text.match(/\d+\.\d{2}/g);
      if (allPrices) {
        const floats = allPrices.map(parseFloat);
        amount = Math.max(...floats);
      }
    }
    
    // Fallback default amount if none found
    if (amount === 0 || isNaN(amount)) {
      amount = 450;
    }

    // 4. Extract Date
    // Matches MM/DD/YYYY, DD-MM-YYYY, YYYY-MM-DD
    const dateRegex = /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
      let day = parseInt(dateMatch[1]);
      let month = parseInt(dateMatch[2]) - 1;
      let year = parseInt(dateMatch[3]);
      if (year < 100) year += 2000;
      
      const parsedDate = new Date(year, month, day);
      if (!isNaN(parsedDate.getTime())) {
        date = parsedDate.toISOString().split('T')[0];
      }
    }

    return { merchant, amount, category, date };
  };

  const handleScanReceipt = async () => {
    if (!file) return;
    
    setScanning(true);
    setScanProgress(0);
    setScanStatusText('Initializing Tesseract worker...');

    try {
      const worker = await createWorker('eng');
      
      setScanStatusText('Scanning layout structures...');
      setScanProgress(30);

      const ret = await worker.recognize(file);
      
      setScanProgress(80);
      setScanStatusText('Parsing receipt elements...');
      
      const parsed = parseReceiptText(ret.data.text);
      setScannedData(parsed);

      setScanProgress(100);
      setScanStatusText('Scanning completed successfully.');
      toast.success('Receipt scanned successfully!');
      
      await worker.terminate();
    } catch (err) {
      console.error(err);
      toast.error('OCR processing failed. Try checking your internet or enter manually.');
    } finally {
      setScanning(false);
    }
  };

  const handleSaveExpense = async () => {
    if (!scannedData) return;
    
    const formData = new FormData();
    formData.append('amount', scannedData.amount);
    formData.append('merchant', scannedData.merchant);
    formData.append('category', scannedData.category);
    formData.append('description', 'Auto-populated from receipt scanner');
    formData.append('paymentMethod', 'UPI');
    formData.append('date', scannedData.date);
    formData.append('receipt', file);

    const toastId = toast.loading('Saving transaction...');
    try {
      await axios.post('/api/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Transaction saved to ledger!', { id: toastId });
      // Reset
      setFile(null);
      setPreviewUrl('');
      setScannedData(null);
    } catch (err) {
      toast.error('Failed to log transaction', { id: toastId });
    }
  };

  const getCurrencySymbol = (cur) => cur === 'INR' ? '₹' : '$';

  return (
    <div className="space-y-6">
      
      {/* Header Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 p-5 rounded-2xl shadow-premium">
        <h2 className="font-extrabold text-lg text-slate-800 dark:text-white">OCR Receipt Scanner</h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">Scan paper bills using AI character recognition to skip manual ledger inputs</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Drag Drop File Landing Zone */}
        <div className="lg:col-span-7 space-y-4">
          <div 
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-slate-350 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-premium text-center flex flex-col items-center justify-center min-h-[350px] relative transition-colors duration-200 hover:border-primary"
          >
            {previewUrl ? (
              <div className="space-y-4 w-full max-w-sm">
                <img
                  src={previewUrl}
                  alt="Receipt Preview"
                  className="max-h-60 mx-auto rounded-2xl object-contain shadow border border-slate-205 dark:border-slate-800"
                />
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => { setFile(null); setPreviewUrl(''); setScannedData(null); }}
                    className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Remove File
                  </button>
                  <button
                    onClick={handleScanReceipt}
                    disabled={scanning}
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-1.5"
                  >
                    {scanning ? <RefreshCw className="animate-spin" size={14} /> : <Camera size={14} />}
                    <span>{scanning ? 'Scanning...' : 'Scan Receipt'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-800/50 flex items-center justify-center text-slate-400">
                  <Camera size={28} />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-white">Drop receipt bill here</p>
                  <p className="text-xs text-slate-400">Supports PNG, JPEG, and JPG format bills up to 5MB</p>
                </div>
                
                <label className="cursor-pointer px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-350 transition-colors">
                  <span>Browse files</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Loader bar */}
          {scanning && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-2xl p-5 shadow-premium space-y-2 animate-pulse">
              <div className="flex justify-between text-xs font-bold text-slate-550">
                <span>{scanStatusText}</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-300" style={{ width: `${scanProgress}%` }}></div>
              </div>
            </div>
          )}
        </div>

        {/* Right: Detected form elements to review */}
        <div className="lg:col-span-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-premium h-full flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-extrabold text-base text-slate-808 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Detected Data Audit
              </h3>

              {!scannedData ? (
                <div className="py-20 text-center text-xs text-slate-400 space-y-1.5 flex flex-col items-center">
                  <AlertCircle size={20} className="text-slate-300 dark:text-slate-700" />
                  <p className="font-bold">Pending Receipt Scan</p>
                  <p>Upload a bill and tap "Scan Receipt" to auto-populate transaction fields.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Amount */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Total Amount ({getCurrencySymbol(user?.currency)})</label>
                    <input
                      type="number"
                      value={scannedData.amount}
                      onChange={(e) => setScannedData({ ...scannedData, amount: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Merchant */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Merchant</label>
                    <input
                      type="text"
                      value={scannedData.merchant}
                      onChange={(e) => setScannedData({ ...scannedData, merchant: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-bold text-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Date</label>
                    <input
                      type="date"
                      value={scannedData.date}
                      onChange={(e) => setScannedData({ ...scannedData, date: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white"
                    />
                  </div>

                  {/* Category */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase block">Category</label>
                    <select
                      value={scannedData.category}
                      onChange={(e) => setScannedData({ ...scannedData, category: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-2 px-3 text-xs text-slate-800 dark:text-white font-semibold cursor-pointer"
                    >
                      <option value="Food">Food</option>
                      <option value="Travel">Travel</option>
                      <option value="Shopping">Shopping</option>
                      <option value="Medicine">Medicine</option>
                      <option value="Rent">Rent</option>
                      <option value="Bills">Bills</option>
                      <option value="Subscriptions">Subscriptions</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {scannedData && (
              <button
                onClick={handleSaveExpense}
                className="w-full py-3 bg-secondary hover:bg-secondary-dark text-white rounded-xl font-bold shadow-lg shadow-secondary/20 transition-all flex items-center justify-center gap-1.5 text-xs mt-6"
              >
                <Save size={14} />
                <span>Save Expense</span>
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
