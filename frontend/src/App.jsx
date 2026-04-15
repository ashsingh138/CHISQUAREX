import { useState, useEffect } from 'react';

function App() {
  const [meetLink, setMeetLink] = useState('');
  const [status, setStatus] = useState('Idle');
  const [transcript, setTranscript] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  // Poll for transcript updates every 3 seconds if the bot is running
  useEffect(() => {
    let interval;
    if (status === 'Running') {
      interval = setInterval(async () => {
        try {
          const res = await fetch('https://chisquarex.onrender.com/api/bot/transcript');
          const data = await res.json();
          setTranscript(data.transcript);
        } catch (err) {
          console.error("Failed to fetch transcript", err);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [status]);

  const startBot = async () => {
    setStatus('Starting...');
    try {
      await fetch('https://chisquarex.onrender.com/api/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetLink })
      });
      setStatus('Running');
    } catch (err) {
      setStatus('Error starting bot');
    }
  };

  const stopBot = async () => {
    await fetch('https://chisquarex.onrender.com/api/bot/stop', { method: 'POST' });
    setStatus('Idle');
  };

  const generateSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch('https://chisquarex.onrender.com/api/bot/summarize', { method: 'POST' });
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h1 className="text-2xl font-bold mb-4">🤖 AI Meeting Scribe</h1>
          <div className="flex gap-4">
            <input 
              type="text" 
              placeholder="Paste Google Meet Link (https://meet.google.com/...)" 
              className="flex-1 p-3 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
            />
            {status === 'Idle' ? (
              <button onClick={startBot} className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-medium transition">
                Join Meeting
              </button>
            ) : (
              <button onClick={stopBot} className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 font-medium transition">
                Stop Bot
              </button>
            )}
          </div>
          <div className="mt-4 text-sm font-medium text-gray-500">
            Status: <span className={status === 'Running' ? 'text-green-500' : 'text-blue-500'}>{status}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Transcript Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Live Transcript</h2>
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded border text-sm text-gray-700 font-mono whitespace-pre-wrap">
              {transcript || "Waiting for conversation to start..."}
            </div>
          </div>

          {/* Summary Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h2 className="text-lg font-bold">AI Summary</h2>
              <button 
                onClick={generateSummary}
                disabled={!transcript || loading}
                className="bg-gray-800 text-white px-4 py-1.5 rounded text-sm hover:bg-gray-900 disabled:opacity-50 transition"
              >
                {loading ? 'Generating...' : 'Generate Summary'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4 rounded border text-sm text-gray-800 whitespace-pre-wrap">
              {summary ? summary : "Click generate once the meeting has enough content."}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;