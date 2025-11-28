import React, { useState } from 'react';
import { Upload, CheckCircle, XCircle, FileImage, Shield, User, PenTool, Download, Loader2 } from 'lucide-react';

export default function C2PAImageApp() {
  const [activeTab, setActiveTab] = useState('sign');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [author, setAuthor] = useState('');
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const API_URL =  import.meta.env.VITE_API_URL||'http://localhost:3000';

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
      setError(null);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSign = async () => {
    if (!file || !author || !signature) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('author', author);
    formData.append('signature', signature);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Signing failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      setResult({
        success: true,
        downloadUrl: url,
        filename: `signed_${file.name}`
      });

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!file) {
      setError('Please upload an image to verify');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/verify`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setResult(data);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreview(null);
    setAuthor('');
    setSignature('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Shield className="w-12 h-12 text-blue-600 mr-3" />
            <h1 className="text-4xl font-bold text-gray-800">Signature Credentials</h1>
          </div>
          <p className="text-gray-600">Sign and verify images with cryptographic Credentials</p>
        </div>

        <div className="flex gap-4 mb-6 bg-white rounded-lg p-2 shadow-sm">
          <button
            onClick={() => { setActiveTab('sign'); resetForm(); }}
            className={`flex-1 py-3 px-6 rounded-md font-semibold transition-all ${
              activeTab === 'sign'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <PenTool className="w-5 h-5 inline mr-2" />
            Sign Image
          </button>
          <button
            onClick={() => { setActiveTab('verify'); resetForm(); }}
            className={`flex-1 py-3 px-6 rounded-md font-semibold transition-all ${
              activeTab === 'verify'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CheckCircle className="w-5 h-5 inline mr-2" />
            Verify Image
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          {activeTab === 'sign' ? (
            <div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Image
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload-sign"
                  />
                  <label
                    htmlFor="file-upload-sign"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    {preview ? (
                      <img src={preview} alt="Preview" className="h-full object-contain" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <span className="text-gray-600">Click to upload image</span>
                      </div>
                    )}
                  </label>
                </div>
                {file && (
                  <p className="text-sm text-gray-600 mt-2">
                    <FileImage className="w-4 h-4 inline mr-1" />
                    {file.name}
                  </p>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Author Name
                </label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <PenTool className="w-4 h-4 inline mr-1" />
                  Signature
                </label>
                <input
                  type="text"
                  value={signature}
                  onChange={(e) => setSignature(e.target.value)}
                  placeholder="Enter your signature"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <XCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {result && result.success && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-semibold text-green-800">Image signed successfully!</span>
                  </div>
                  <a
                    href={result.downloadUrl}
                    download={result.filename}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Signed Image
                  </a>
                </div>
              )}

              <button
                onClick={handleSign}
                disabled={loading}
                className="w-full py-3 px-6 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Sign Image
                  </>
                )}
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Upload Image to Verify
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload-verify"
                  />
                  <label
                    htmlFor="file-upload-verify"
                    className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                  >
                    {preview ? (
                      <img src={preview} alt="Preview" className="h-full object-contain" />
                    ) : (
                      <div className="text-center">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <span className="text-gray-600">Click to upload image</span>
                      </div>
                    )}
                  </label>
                </div>
                {file && (
                  <p className="text-sm text-gray-600 mt-2">
                    <FileImage className="w-4 h-4 inline mr-1" />
                    {file.name}
                  </p>
                )}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                  <XCircle className="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                  <span className="text-red-700">{error}</span>
                </div>
              )}

              {result && (
                <div className={`mb-6 p-6 rounded-lg border-2 ${
                  result.signed && result.verified
                    ? 'bg-green-50 border-green-200'
                    : result.signed
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center mb-4">
                    {result.signed && result.verified ? (
                      <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
                    ) : result.signed ? (
                      <XCircle className="w-6 h-6 text-yellow-600 mr-2" />
                    ) : (
                      <XCircle className="w-6 h-6 text-gray-600 mr-2" />
                    )}
                    <span className="font-bold text-lg">
                      {result.signed && result.verified
                        ? 'Verified ✓'
                        : result.signed
                        ? 'Signed but Not Verified'
                        : 'Not Signed'}
                    </span>
                  </div>
                  
                  {result.message && <p className="text-gray-700 mb-4">{result.message}</p>}
                  
                  {result.content && (
                    <div className="space-y-4">
                      <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <h3 className="font-semibold mb-3 text-gray-800 flex items-center">
                          <FileImage className="w-4 h-4 mr-2" />
                          {result.content.filename}
                        </h3>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium text-gray-600">Title:</span> {result.content.title}</p>
                          <p><span className="font-medium text-gray-600">Issued by:</span> {result.content.issuer}</p>
                          <p><span className="font-medium text-gray-600">Format:</span> {result.content.format}</p>
                        </div>
                      </div>

                      {result.process && result.process.actions && result.process.actions.length > 0 && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h3 className="font-semibold mb-3 text-gray-800">Process</h3>
                          <p className="text-sm mb-3">
                            <span className="font-medium text-gray-600">App or device used:</span> {result.process.appOrDeviceUsed}
                          </p>
                          <div className="space-y-2">
                            <p className="font-medium text-gray-700 text-sm">Actions:</p>
                            {result.process.actions.map((action, idx) => (
                              <div key={idx} className="ml-4 p-3 bg-gray-50 rounded text-sm border-l-2 border-blue-400">
                                <div className="flex items-center mb-1">
                                  <Shield className="w-3 h-3 mr-2 text-blue-600" />
                                  <span className="font-medium">{action.type.replace('c2pa.', '')}</span>
                                </div>
                                <p className="text-gray-600 text-xs">{action.tool}</p>
                                {action.timestamp && (
                                  <p className="text-gray-500 text-xs mt-1">
                                    {new Date(action.timestamp).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.ingredients && result.ingredients.length > 0 && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h3 className="font-semibold mb-3 text-gray-800">Ingredients</h3>
                          <div className="space-y-2">
                            {result.ingredients.map((ing, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 rounded text-sm">
                                <p className="font-medium">{ing.title}</p>
                                <p className="text-gray-600 text-xs">{ing.issuer}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {result.author && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h3 className="font-semibold mb-2 text-gray-800 flex items-center">
                            <User className="w-4 h-4 mr-2" />
                            Author
                          </h3>
                          <p className="text-sm">{result.author.name}</p>
                          {result.author.identifier && (
                            <p className="text-xs text-gray-500 mt-1">{result.author.identifier}</p>
                          )}
                        </div>
                      )}

                      {result.note && (
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <h3 className="font-semibold mb-2 text-gray-800">Note</h3>
                          <p className="text-sm text-gray-700">{result.note}</p>
                        </div>
                      )}

                      {result.credential && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h3 className="font-semibold mb-2 text-blue-900 flex items-center">
                            <Shield className="w-4 h-4 mr-2" />
                            About this Content Credential
                          </h3>
                          <div className="space-y-1 text-sm text-blue-800">
                            <p><span className="font-medium">Issued by:</span> {result.credential.issuedBy}</p>
                            <p><span className="font-medium">Algorithm:</span> {result.credential.algorithm.toUpperCase()}</p>
                            {result.credential.timestamp && (
                              <p><span className="font-medium">Timestamp:</span> {new Date(result.credential.timestamp).toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full py-3 px-6 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Verify Image
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Powered by C2PA (Coalition for Content Provenance and Authenticity)</p>
          <p className="mt-2">All signing happens securely in memory - no data is stored</p>
        </div>
      </div>
    </div>
  );
}