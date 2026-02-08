"use client";

import React, { useState } from "react";
import { toast } from "sonner";

export default function MoodSongsPage() {
    const [text, setText] = useState("");
    const [mood, setMood] = useState(null); // full mood object
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [offset, setOffset] = useState(0);

    const fetchSongs = async ({ isLoadMore = false } = {}) => {
        try {
            setLoading(true);

            const res = await fetch("/api/song-recommender-agent", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    text: isLoadMore ? "" : text,
                    mood: isLoadMore ? mood : null, // now full mood object
                    offset: isLoadMore ? offset : 0,
                }),
            });

            const data = await res.json();
            if (!data.success) throw new Error(data.message);

            setMood(data.mood);

            if (isLoadMore) {
                setSongs((prev) => [...prev, ...(data.songs || [])]);
                setOffset((prev) => prev + 5);
            } else {
                setSongs(data.songs || []);
                setOffset(5);
            }
        } catch (err) {
            toast('Oops, we hit a snag, please try again later');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = () => {
        if (!text.trim()) return;
        setMood(null);
        setSongs([]);
        setOffset(0);
        fetchSongs();
    };

    const handleReset = () => {
        setText("");
        setMood(null);
        setSongs([]);
        setOffset(0);
    };

    const handleLoadMore = () => {
        fetchSongs({ isLoadMore: true });
    };

    const getSpotifyLink = (query) =>
        `https://open.spotify.com/search/${encodeURIComponent(query)}`;

    const getYoutubeLink = (query) =>
        `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;


    return (
        <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-6">
            <div className="mx-auto w-full max-w-3xl rounded-xl bg-white p-4 sm:p-6 shadow-sm">
                <h1 className="text-lg sm:text-xl font-bold text-black">
                    Mood → Song Recommender 🎧
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-gray-600">
                    Enter a feeling / vibe and get song recommendations.
                </p>

                {/* Textarea */}
                <textarea
                    className="mt-4 w-full rounded-md border p-3 text-sm sm:text-base outline-none text-black resize-none"
                    rows={4}
                    placeholder='Example: "It’s raining today, I feel romantic, having some beer"'
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />

                {/* Buttons */}
                <div className="mt-4 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={handleGenerate}
                        disabled={loading || !text.trim()}
                        className="w-full sm:w-auto rounded-md bg-black px-4 py-2 text-sm sm:text-base text-white disabled:opacity-50 hover:underline"
                    >
                        {loading ? "Generating..." : "Recommend Songs"}
                    </button>

                    <button
                        onClick={handleReset}
                        className="w-full sm:w-auto rounded-md border px-4 py-2 text-sm sm:text-base bg-gray-400 text-white hover:underline"
                    >
                        Reset
                    </button>
                </div>

                {/* Mood Info */}
                {mood && (
                    <div className="mt-4 rounded-md bg-orange-400 text-white p-3 text-xs sm:text-sm italic">
                        <b>Mood:</b> {mood.primaryMood}
                        {mood.secondaryMood && ` + ${mood.secondaryMood}`}
                        {" | "}
                        <b>Energy:</b> {mood.energyLevel}
                        {" | "}
                        <b>Language:</b> {mood.language}
                    </div>
                )}

                {/* Song List */}
                {songs?.length > 0 && (<div className="mt-4 space-y-3 border p-3 sm:p-4 rounded-xl max-h-60 sm:max-h-72 overflow-y-auto">
                    <span className="py-2 text-black font-bold">Total fetched Songs : {songs?.length}</span>
                    {songs.map((song, idx) => (
                        <div key={idx} className="rounded-md border p-3 bg-white shadow-md">
                            <p className="font-semibold text-black">
                                {idx + 1}. {song.title} — {song.artist}
                            </p>

                            <p className="text-sm text-black italic">{song.reason}</p>

                            <div className="mt-2 flex gap-3 text-sm">
                                <a
                                    href={getSpotifyLink(song.spotifyQuery)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-green-600 font-bold hover:underline"
                                >
                                    🎧 Spotify
                                </a>

                                <a
                                    href={getYoutubeLink(song.youtubeQuery)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-red-500 font-bold hover:underline"
                                >
                                    ▶ YouTube
                                </a>
                            </div>
                        </div>
                    ))}
                </div>)}

                {/* Load More */}
                {songs.length > 0 && (
                    <button
                        onClick={handleLoadMore}
                        disabled={loading}
                        className="mt-4 w-full rounded-md bg-gray-900 px-4 py-2 text-sm sm:text-base text-white disabled:opacity-50 hover:underline"
                    >
                        {loading ? "Loading..." : "Load More"}
                    </button>
                )}
            </div>
        </div>
    );
}
