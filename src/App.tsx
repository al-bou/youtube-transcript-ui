// App.tsx
import React, { useState } from "react";
import axios from "axios";
import { TranscriptResult } from "./components/TranscriptResult";

function extractVideoId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function App() {
  const [url, setUrl] = useState("");
  const [proxyHost, setProxyHost] = useState(import.meta.env.VITE_PROXY_HOST);
  const [proxyPort, setProxyPort] = useState(import.meta.env.VITE_PROXY_PORT);
  const [proxyUser, setProxyUser] = useState(import.meta.env.VITE_PROXY_USER);
  const [proxyPass, setProxyPass] = useState(import.meta.env.VITE_PROXY_PASS);

  const [transcript, setTranscript] = useState("");
  const [token, setToken] = useState("");
  const [summary, setSummary] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [hasResults, setHasResults] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
  setError("");
  setTranscript("");
  setSummary("");
  setKeywords([]);
  setActions([]);
  setHasResults(false);
  setLoading(true);

  if (!url || !proxyHost || !proxyPort || !proxyUser || !proxyPass) {
    setError("All fields are required.");
    return;
  }

  const videoId = extractVideoId(url);
  if (!videoId) {
    setError("Invalid YouTube URL.");
    return;
  }

  const API_BASE = "https://yt-summary.alanbouo.com";

  try {
    // 1. Récupérer le transcript
    const transcriptRes = await axios.post("https://yt.alanbouo.com/transcript", {
      video_id: videoId,
      proxy_host: proxyHost,
      proxy_port: Number(proxyPort),
      proxy_username: proxyUser,
      proxy_password: proxyPass
    });

    const transcript = transcriptRes.data.transcript;
    setTranscript(transcript);

    // 2. Appel à /analyze (plus besoin de clé API dans ce scénario, si la sécurité est assurée par IP ou auth serveur)
    const analyzeRes = await axios.post(`${API_BASE}/analyze`, {
      video_id: videoId,
      transcript: transcript
    });
    setToken(analyzeRes.data.token)
    const token = analyzeRes.data.token;
    if (!token) {
      throw new Error("Aucun token reçu depuis /analyze");
    }

    // 3. Attente (tu peux améliorer avec polling ensuite)
    await delay(10000);

    // 4. Récupération du résultat par token
    const resultRes = await axios.get(`${API_BASE}/result`, {
      params: { token }
    });

    setSummary(resultRes.data.summary || "");
    setKeywords(resultRes.data.keywords || []);
    setActions(resultRes.data.actions || []);
    setHasResults(true);
  } catch (err: any) {
    console.error("API Error:", err);

    if (err.response) {
      const status = err.response.status;
      const detail = err.response.data?.detail || JSON.stringify(err.response.data);

      setError(`Erreur API (${status}) : ${detail}`);
    } else {
      setError("Erreur inconnue lors de l'appel API.");
    }
  } finally {
    setLoading(false);
  }
};


  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full space-y-6">
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">YouTube Transcript Tool</h1>
          <p className="mt-2 text-gray-600">Paste a YouTube URL and your proxy info to retrieve the transcript.</p>
        </header>

        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700">YouTube URL</label>
            <input
              type="text"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Proxy Host</label>
              <input
                type="text"
                value={proxyHost}
                onChange={(e) => setProxyHost(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Proxy Port</label>
              <input
                type="number"
                value={proxyPort}
                onChange={(e) => setProxyPort(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <input
                type="text"
                value={proxyUser}
                onChange={(e) => setProxyUser(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={proxyPass}
                onChange={(e) => setProxyPass(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
          >
            Get Transcript & AI Summary
          </button>

          {error && <p className="text-sm text-red-600 text-center mt-2">{error}</p>}
        </div>

        {loading && <p className="text-gray-500 text-center">Loading...</p>}
        
        {hasResults && (
          <TranscriptResult token={token} />
        )}

        {transcript && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-2">Transcript</h2>
            <pre className="whitespace-pre-wrap text-sm text-gray-800 max-h-[500px] overflow-y-auto">
              {transcript}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}
