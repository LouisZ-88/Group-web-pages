import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Role } from '../types';

interface FileImporterProps {
  onDataImported: (type: 'leader' | 'member' | 'guest', data: string) => void;
}

const FileImporter: React.FC<FileImporterProps> = ({ onDataImported }) => {
  const processData = (results: any[]) => {
    let leaders: string[] = [];
    let members: string[] = [];
    let guests: string[] = [];

    results.forEach((row: any) => {
      const name = row['姓名'] || row['Name'] || Object.values(row)[0];
      const industry = row['產業'] || row['Industry'] || Object.values(row)[1];
      const roleStr = (row['身分'] || row['Role'] || row['身份'] || '').toString();

      if (!name || !industry) return;

      const formatted = `${name}, ${industry}`;

      if (row['房長'] || roleStr.includes('房長') || roleStr.includes('Leader')) {
        leaders.push(formatted);
      } else if (row['會員'] || roleStr.includes('會員') || roleStr.includes('Member')) {
        members.push(formatted);
      } else if (row['來賓'] || roleStr.includes('來賓') || roleStr.includes('Guest')) {
        guests.push(formatted);
      } else {
        // Default to guest if role not clear
        guests.push(formatted);
      }
    });

    if (leaders.length > 0) onDataImported('leader', leaders.join('\n'));
    if (members.length > 0) onDataImported('member', members.join('\n'));
    if (guests.length > 0) onDataImported('guest', guests.join('\n'));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const data = e.target?.result;
        if (!data) return;

        if (file.name.endsWith('.csv')) {
          Papa.parse(data as string, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => processData(results.data),
          });
        } else {
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json = XLSX.utils.sheet_to_json(worksheet);
          processData(json);
        }
      };

      if (file.name.endsWith('.csv')) {
        reader.readAsText(file);
      } else {
        reader.readAsBinaryString(file);
      }
    });
  }, [onDataImported]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    multiple: false
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-2xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${
        isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'
      }`}
    >
      <input {...getInputProps()} />
      <div className={`p-3 rounded-full ${isDragActive ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
        <Upload className="w-6 h-6" />
      </div>
      <div className="text-center">
        <p className="text-sm font-bold text-slate-700">批次匯入名單 (Excel / CSV)</p>
        <p className="text-xs text-slate-400 mt-1">支援自動辨識 房長、會員、來賓 欄位</p>
      </div>
      <div className="flex gap-4 mt-2">
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <FileSpreadsheet className="w-3 h-3" /> xlsx / csv
        </div>
        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
          <AlertCircle className="w-3 h-3" /> 欄位：姓名, 產業, 身分
        </div>
      </div>
    </div>
  );
};

export default FileImporter;
