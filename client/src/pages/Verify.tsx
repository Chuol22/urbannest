// client/src/pages/Verify.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../utils/apiClient';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export default function Verify() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a document to upload');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('document', file);
      await apiClient.post('/users/verification-documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // after successful upload, go to dashboard or info page
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to upload document. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <h2 className="text-center text-3xl font-extrabold text-white">Upload Verification Document</h2>
        <p className="mt-2 text-center text-sm text-gray-300">
          Your account will be reviewed by the admin. You will receive a notification once approved.
        </p>
        {error && <Alert type="error" message={error} onClose={() => setError('')} />}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <Input
              type="file"
              label="Document (PDF, JPG, PNG)"
              required
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              disabled={loading}
            />
          </div>
          <Button type="submit" loading={loading} fullWidth className="bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold">
            Upload Document
          </Button>
        </form>
      </div>
    </div>
  );
}
