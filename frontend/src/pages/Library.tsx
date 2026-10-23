// src/pages/Library.tsx
import { useEffect, useState } from "react";
import VideoCard from "../components/video/VideoCard";
import { getVideos, VideoData } from "../services/videoService";
import {
  Library as LibraryIcon,
  Search,
  Plus,
  SortDesc,
  Grid,
  List,
  Film,
  Download,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

export const Library = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const data = await getVideos();
        if (Array.isArray(data)) {
          setVideos(data);
        } else {
          setVideos([]);
          setError("Failed to load videos: invalid response format");
        }
      } catch (err) {
        setError("Failed to load videos");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const videoList = Array.isArray(videos) ? videos : [];
  const filteredVideos = videoList.filter((video) =>
    (video?.title || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedVideos = [...filteredVideos].sort((a, b) => {
    const timeA = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (sortBy === "newest") {
      return timeB - timeA;
    } else if (sortBy === "oldest") {
      return timeA - timeB;
    } else if (sortBy === "title") {
      return (a?.title || "").localeCompare(b?.title || "");
    }
    return 0;
  });

  return (
    <div className="min-h-screen pt-28 sm:pt-32 pb-16 px-4 sm:px-8 select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl border border-[var(--glass-border)] bg-[var(--glass-fill)] backdrop-blur-xl flex items-center justify-center text-cyan-400 shadow-sm">
              <LibraryIcon className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-[var(--heading)]">
                SHORTS MEDIA VAULT
              </h1>
              <p className="text-xs font-sans text-[var(--body-muted)]">
                Stored generative 9:16 video artifacts ({sortedVideos.length} items)
              </p>
            </div>
          </div>

          <Link to="/create" className="btn-pill-white flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>New Short</span>
          </Link>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-950/60 border border-red-800/60 text-red-200 text-xs font-sans flex items-center gap-2 backdrop-blur-xl">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span>VAULT WARNING: {error}</span>
          </div>
        )}

        {/* Search & Filter Toolbar in Glass Bar */}
        <div className="p-3 rounded-full border border-[var(--glass-border)] bg-[var(--glass-fill)] backdrop-blur-xl flex flex-col md:flex-row gap-3 items-center justify-between shadow-sm">
          <div className="relative w-full md:max-w-md pl-2">
            <Search className="absolute left-5 top-2.5 h-4 w-4 text-[var(--body-muted)]" />
            <input
              type="text"
              placeholder="Search narrative titles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 h-9 bg-black/30 border border-white/10 rounded-full text-xs font-sans text-white placeholder:text-[var(--body-muted)]/60 focus:outline-none focus:border-white/30 transition-all"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end pr-2">
            {/* Sort Select */}
            <div className="flex items-center gap-1.5 text-xs font-sans text-[var(--body-muted)] bg-black/30 px-3 py-1.5 rounded-full border border-white/10">
              <SortDesc className="h-3.5 w-3.5 text-cyan-400" />
              <select
                aria-label="Sort videos by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent text-white focus:outline-none cursor-pointer"
              >
                <option value="newest" className="bg-[#0c0e18]">Newest First</option>
                <option value="oldest" className="bg-[#0c0e18]">Oldest First</option>
                <option value="title" className="bg-[#0c0e18]">Title (A-Z)</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-black/30 rounded-full p-0.5 border border-white/10">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-[#2f2f33]"
                    : "text-[var(--body-muted)] hover:text-white"
                }`}
                title="Grid View"
              >
                <Grid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-full cursor-pointer transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-[#2f2f33]"
                    : "text-[var(--body-muted)] hover:text-white"
                }`}
                title="List View"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {Array(4)
              .fill(0)
              .map((_, i) => (
                <div
                  key={i}
                  className="aspect-[9/16] rounded-2xl bg-white/5 border border-white/10 animate-pulse flex flex-col justify-between p-4"
                >
                  <div className="w-16 h-3 bg-white/10 rounded-full" />
                  <div className="space-y-2">
                    <div className="w-3/4 h-4 bg-white/10 rounded-full" />
                    <div className="w-1/2 h-3 bg-white/10 rounded-full" />
                  </div>
                </div>
              ))}
          </div>
        ) : sortedVideos.length > 0 ? (
          viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {sortedVideos.map((video) => (
                <VideoCard key={video.id} video={video} />
              ))}
            </div>
          ) : (
            /* Monolithic Table List View */
            <div className="rounded-2xl border border-white/10 bg-[var(--glass-fill)] backdrop-blur-xl overflow-hidden shadow-lg">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-black/40 border-b border-white/10 text-[var(--body-muted)] uppercase tracking-wider">
                  <tr>
                    <th className="p-4">Video Title</th>
                    <th className="p-4 hidden sm:table-cell">Format</th>
                    <th className="p-4 hidden md:table-cell">Created</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sortedVideos.map((video) => (
                    <tr key={video.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <Film className="h-4 w-4 text-cyan-400 shrink-0" />
                        <span className="font-medium text-white truncate max-w-xs">
                          {video.title}
                        </span>
                      </td>
                      <td className="p-4 hidden sm:table-cell text-[var(--body-muted)]">
                        <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[10px] text-cyan-300">
                          9:16 VERTICAL
                        </span>
                      </td>
                      <td className="p-4 hidden md:table-cell text-[var(--body-muted)]">
                        {video.createdAt ? new Date(video.createdAt).toLocaleDateString() : "Recent"}
                      </td>
                      <td className="p-4 text-right">
                        <a
                          href={video.url}
                          download={`${video.title.replace(/[^a-z0-9]/gi, "_")}.mp4`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white text-white hover:text-[#2f2f33] border border-white/15 transition-all cursor-pointer font-medium"
                        >
                          <Download className="h-3 w-3" />
                          <span>MP4</span>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Composed Empty State */
          <div className="py-20 text-center rounded-3xl border border-dashed border-white/15 bg-white/[0.02] backdrop-blur-xl p-8 space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-cyan-400 mx-auto shadow-inner">
              <Film className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-medium text-[var(--heading)] tracking-tight">
                NO SHORTS IN VAULT
              </h3>
              <p className="text-xs text-[var(--body-muted)] leading-relaxed">
                {searchTerm
                  ? `No video artifacts matched "${searchTerm}".`
                  : "Synthesize your first 9:16 short in the studio to populate your media vault."}
              </p>
            </div>
            <Link to="/create" className="btn-pill-white">
              Launch Studio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Library;