"use client";

import { useFocusStore } from "@/features/focus/store/focus.store";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { 
  Play, Pause, SkipForward, SkipBack, ChevronsRight, ChevronsLeft,
  Volume2, Volume1, VolumeX, Repeat, Shuffle, PanelRightOpen, Music, Tv, SlidersHorizontal
} from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface SoundscapeControllerBarProps {
  onExpandZenZone: () => void;
}

export function SoundscapeControllerBar({ onExpandZenZone }: SoundscapeControllerBarProps) {
  const { t } = useTranslation();
  const isPlaying = useFocusStore((s) => s.isPlaying);
  const volume = useFocusStore((s) => s.volume);
  const currentTime = useFocusStore((s) => s.currentTime);
  const duration = useFocusStore((s) => s.duration);
  const isLooping = useFocusStore((s) => s.isLooping);
  const isShuffle = useFocusStore((s) => s.isShuffle);
  const activeVideoTitle = useFocusStore((s) => s.activeVideoTitle);
  const activeVideoAuthor = useFocusStore((s) => s.activeVideoAuthor);
  const activeVideoId = useFocusStore((s) => s.activeVideoId);
  const playerControls = useFocusStore((s) => s.playerControls);
  const setVolume = useFocusStore((s) => s.setVolume);
  const setIsLooping = useFocusStore((s) => s.setIsLooping);
  const setIsShuffle = useFocusStore((s) => s.setIsShuffle);
  const playNextSoundscape = useFocusStore((s) => s.playNextSoundscape);
  const playPrevSoundscape = useFocusStore((s) => s.playPrevSoundscape);
  const isVideoBackground = useFocusStore((s) => s.isVideoBackground);
  const toggleVideoBackground = useFocusStore((s) => s.toggleVideoBackground);
  const videoBgOpacity = useFocusStore((s) => s.videoBgOpacity ?? 75);
  const videoBgBlur = useFocusStore((s) => s.videoBgBlur ?? 2);
  const setVideoBgOpacity = useFocusStore((s) => s.setVideoBgOpacity);
  const setVideoBgBlur = useFocusStore((s) => s.setVideoBgBlur);

  const [prevVolume, setPrevVolume] = useState(volume);
  const [sliderValue, setSliderValue] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handlePlayPause = () => {
    if (!playerControls) return;
    if (isPlaying) {
      playerControls.pause();
    } else {
      playerControls.play();
    }
  };

  const handleMuteToggle = () => {
    if (volume > 0) {
      setPrevVolume(volume);
      setVolume(0);
    } else {
      setVolume(prevVolume || 50);
    }
  };

  const handleTimelineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderValue(val);
  };

  const handleTimelineStartDrag = () => {
    setIsDragging(true);
    setSliderValue(currentTime);
  };

  const handleTimelineChangeEnd = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setIsDragging(false);
    if (!playerControls) return;
    const target = e.target as HTMLInputElement;
    playerControls.seek(Number(target.value));
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const thumbnailSrc = activeVideoId 
    ? `https://img.youtube.com/vi/${activeVideoId}/mqdefault.jpg`
    : null;

  const currentDisplayTime = isDragging ? sliderValue : currentTime;
  const progressPercent = duration ? (currentDisplayTime / duration) * 100 : 0;

  return (
    <div className={cn(
      "h-20 border-t px-4 flex items-center justify-between gap-4 select-none shrink-0 transition-all duration-300 relative z-[40]",
      isVideoBackground 
        ? "bg-sidebar/40 backdrop-blur-md border-sidebar-border/40 shadow-[0_-8px_30px_rgba(0,0,0,0.3)]" 
        : "bg-card/95 border-border shadow-[0_-8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
    )}>
      {/* ── TRÁI: Info bài hát ── */}
      <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
        <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted/80 border border-border/80 flex items-center justify-center shrink-0 shadow-md group relative">
          {thumbnailSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img 
              src={thumbnailSrc} 
              alt={activeVideoTitle} 
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <Music className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors cursor-default drop-shadow-xs" title={activeVideoTitle}>
            {activeVideoTitle || t.flow.player.noTrack}
          </span>
          <span className="text-xs text-muted-foreground truncate cursor-default mt-0.5" title={activeVideoAuthor}>
            {activeVideoAuthor || t.flow.player.myPacePlayer}
          </span>
        </div>
      </div>

      {/* ── GIỮA: Trình điều khiển & Timeline ── */}
      <div className="flex-1 max-w-2xl flex flex-col items-center gap-1.5 py-1">
        {/* Hàng nút bấm */}
        <div className="flex items-center gap-5">
          {/* Nút Trộn (Shuffle) */}
          <button 
            onClick={() => setIsShuffle(!isShuffle)}
            className={cn(
              "p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
              isShuffle && "text-primary hover:text-primary/80 font-bold"
            )}
            title={t.flow.player.shuffle}
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Soundscape Prev */}
          <button 
            onClick={playPrevSoundscape}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={t.flow.player.prevSoundscape}
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Playlist Prev */}
          <button 
            onClick={() => playerControls?.prevTrack()}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={t.flow.player.prevTrack}
            disabled={!playerControls}
          >
            <SkipBack className="w-4.5 h-4.5" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={handlePlayPause}
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 hover:scale-105 transition-all flex items-center justify-center text-white cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.4)]"
            title={isPlaying ? t.flow.player.pause : t.flow.player.play}
          >
            {isPlaying ? (
              <Pause className="w-4.5 h-4.5 fill-white text-white ml-[0.5px]" />
            ) : (
              <Play className="w-4.5 h-4.5 fill-white text-white ml-[2px]" />
            )}
          </button>

          {/* Playlist Next */}
          <button 
            onClick={() => playerControls?.nextTrack()}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={t.flow.player.nextTrack}
            disabled={!playerControls}
          >
            <SkipForward className="w-4.5 h-4.5" />
          </button>

          {/* Soundscape Next */}
          <button 
            onClick={playNextSoundscape}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={t.flow.player.nextSoundscape}
          >
            <ChevronsRight className="w-4 h-4" />
          </button>

          {/* Lặp lại (Repeat) */}
          <button 
            onClick={() => setIsLooping(!isLooping)}
            className={cn(
              "p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer",
              isLooping && "text-primary hover:text-primary/80 font-bold"
            )}
            title={t.flow.player.repeat}
          >
            <Repeat className="w-4 h-4" />
          </button>
        </div>

        {/* Hàng Timeline */}
        <div className="w-full flex items-center gap-2.5 text-[10.5px] text-muted-foreground">
          <span className="w-8 text-right tabular-nums">{formatTime(currentDisplayTime)}</span>
          <div className="flex-1 relative flex items-center group/slider">
            <input 
              type="range"
              min="0"
              max={duration || 100}
              value={currentDisplayTime}
              onChange={handleTimelineChange}
              onMouseDown={handleTimelineStartDrag}
              onMouseUp={handleTimelineChangeEnd}
              onTouchStart={handleTimelineStartDrag}
              onTouchEnd={handleTimelineChangeEnd}
              className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80"
              style={{
                background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${progressPercent}%, var(--border) ${progressPercent}%, var(--border) 100%)`
              }}
            />
          </div>
          <span className="w-8 text-left tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      {/* ── PHẢI: Âm lượng & Thao tác ── */}
      <div className="flex items-center justify-end gap-2.5 w-1/4 min-w-[200px]">
        {/* Popover Nút bật/tắt & chỉnh Video Nền */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                "p-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0",
                isVideoBackground 
                  ? "bg-primary/20 text-primary border border-primary/30 shadow-xs" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
              title="Tùy chỉnh Video Nền toàn trang (Độ mờ & Độ phủ)"
            >
              <Tv className="w-4 h-4 text-primary" />
              <span className="hidden md:inline text-[11px]">{isVideoBackground ? "Nền: Bật" : "Nền: Tắt"}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 bg-card border border-border text-foreground shadow-2xl rounded-xl space-y-3 z-[100]" side="top" align="end">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Tv className="w-3.5 h-3.5 text-primary" /> Video Nền Toàn App
              </span>
              <button
                onClick={toggleVideoBackground}
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer",
                  isVideoBackground ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-muted text-muted-foreground border-border"
                )}
              >
                {isVideoBackground ? "BẬT" : "TẮT"}
              </button>
            </div>

            {isVideoBackground ? (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                    <span>Độ phủ tối (Opacity)</span>
                    <span className="font-mono text-foreground font-bold">{videoBgOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="95"
                    value={videoBgOpacity}
                    onChange={(e) => setVideoBgOpacity(Number(e.target.value))}
                    className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                    <span>Độ mờ kính (Blur)</span>
                    <span className="font-mono text-foreground font-bold">{videoBgBlur}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={videoBgBlur}
                    onChange={(e) => setVideoBgBlur(Number(e.target.value))}
                    className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-muted-foreground text-center py-1">
                Nhấp nút công tắc phía trên để bật Video Nền chìm toàn màn hình.
              </p>
            )}
          </PopoverContent>
        </Popover>

        {/* Nút bật/tắt ZenZone */}
        <button
          onClick={onExpandZenZone}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold shrink-0"
          title={t.flow.player.expandZen}
        >
          <PanelRightOpen className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline text-[11px]">{t.nav.flow}</span>
        </button>

        <div className="w-px h-6 bg-border shrink-0" />

        {/* Cụm điều khiển Volume */}
        <div className="flex items-center gap-2 max-w-[120px] w-full">
          <button 
            onClick={handleMuteToggle}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer shrink-0"
            title={volume === 0 ? t.flow.player.play : t.flow.player.pause}
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4 text-destructive" />
            ) : volume <= 50 ? (
              <Volume1 className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4 text-primary" />
            )}
          </button>
          
          <input 
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80"
            style={{
              background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${volume}%, var(--border) ${volume}%, var(--border) 100%)`
            }}
            title={`${t.flow.player.volume}: ${volume}%`}
          />
        </div>
      </div>
    </div>
  );
}
