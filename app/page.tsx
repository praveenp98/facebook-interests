'use client';
import { useState } from 'react';
import '98.css';

interface Interest {
  name: string;
  audience_size: number;
  path: string;
  topic: string;
  id: string;
}

export default function Home() 
  const [keyword, setKeyword] = useState('');
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [copySuccess, setCopySuccess] = useState('');
  const resultsPerPage = 50;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    setError(null);
    setInterests([]);
    setSearchCompleted(false);
    setCurrentPage(1);
    setCopySuccess('');

    try {{
      console.log('Starting search...'); // Debug log

      const response = await fetch('/api/search-interests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword }),
      });

      console.log('Got response:', response.status); // Debug log

      const data = await response.json();
      console.log('Got data:', data); // Debug log

      if (data.interests) {
        setInterests(data.interests);
      } else {
        setError('No data received from API');
      }
    } catch (err) {
      console.error('Search error:', err); // Debug log
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setSearchCompleted(true);
    }

  const handleCopyToClipboard = async () => {
    try {
      const csvContent = [
        ['Name', 'Audience Size', 'Category Path', 'Topic', 'ID'].join(','),
        ...interests.map(interest => [
          `"${interest.name}"`,
          interest.audience_size,
          `"${interest.path}"`,
          `"${interest.topic}"`,
          `"${interest.id}"`
        ].join(','))
      ].join('\n');

      await navigator.clipboard.writeText(csvContent);
      setCopySuccess('All results copied to clipboard!');
      setTimeout(() => setCopySuccess(''), 3000);
    } catch (err) {
      setCopySuccess('Failed to copy');
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(interests.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentInterests = interests.slice(startIndex, endIndex);

  return (
    <main className="min-h-screen bg-gray-900 p-8">
      <div className="window max-w-6xl mx-auto shadow-lg">
        <div className="title-bar">
          <div className="title-bar-text">
            Facebook Ads Interest Explorer v1.0
          </div>
          <div className="title-bar-controls">
            <button aria-label="Minimize"></button>
            <button aria-label="Maximize"></button>
            <button aria-label="Close"></button>
          </div>
        </div>
        
        <div className="window-body">
          <div className="status-bar mb-4">
            <p className="status-bar-field">Ready</p>
            <p className="status-bar-field">CPU Usage: 12%</p>
            <p className="status-bar-field">RAM: 64MB</p>
          </div>

          <form onSubmit={handleSearch} className="field-row mb-4">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter keyword to search interests..."
              className="w-80"
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading || !keyword.trim()}
              className="ml-2"
            >
              {loading ? 'Searching...' : 'Search Interests'}
            </button>
          </form>

          {loading && (
            <div className="sunken-panel p-4 text-center">
              <div className="loading-indicator"></div>
              <p>Searching for interests...</p>
            </div>
          )}

          {error && (
            <div className="sunken-panel p-4 bg-red-50 text-red-600">
              <pre>{error}</pre>
            </div>
          )}

          {searchCompleted && !loading && interests.length === 0 && !error && (
            <div className="sunken-panel p-4">
              <p>No interests found for "{keyword}"</p>
            </div>
          )}

          {interests.length > 0 && (
            <>
              <div className="field-row mb-4">
                <p>
                  Showing {startIndex + 1}-{Math.min(endIndex, interests.length)} of {interests.length} results
                </p>
                <button
                  onClick={handleCopyToClipboard}
                  className="ml-auto"
                >
                  Copy All Results to Clipboard
                </button>
              </div>

              {copySuccess && (
                <div className="message-box">
                  <p>{copySuccess}</p>
                </div>
              )}

              <div className="sunken-panel">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Audience Size</th>
                      <th className="px-4 py-2 text-left">Category Path</th>
                      <th className="px-4 py-2 text-left">Topic</th>
                      <th className="px-4 py-2 text-left">ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentInterests.map((interest, index) => (
                      <tr key={index} className="hover:bg-[#000080] hover:text-white">
                        <td className="px-4 py-2">{interest.name}</td>
                        <td className="px-4 py-2">{interest.audience_size.toLocaleString()}</td>
                        <td className="px-4 py-2">{interest.path}</td>
                        <td className="px-4 py-2">{interest.topic}</td>
                        <td className="px-4 py-2">{interest.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="field-row mt-4 justify-between">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <p>Page {currentPage} of {totalPages || 1}</p>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Next
                </button>
              </div>
            </>
          )}

          {/* Debug Panel */}
          <div className="sunken-panel mt-8 p-4">
            <details>
              <summary className="debug-summary">Debug Information</summary>
              <div className="tree-view debug-content">
                <div className="debug-item">
                  <span className="debug-label">Loading:</span> 
                  <span className="debug-value">{loading ? 'Yes' : 'No'}</span>
                </div>
                <div className="debug-item">
                  <span className="debug-label">Search Completed:</span> 
                  <span className="debug-value">{searchCompleted ? 'Yes' : 'No'}</span>
                </div>
                <div className="debug-item">
                  <span className="debug-label">Number of Results:</span> 
                  <span className="debug-value">{interests.length}</span>
                </div>
                {error && (
                  <div className="debug-item">
                    <span className="debug-label">Error:</span> 
                    <span className="debug-value error">{error}</span>
                  </div>
                )}
              </div>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
}