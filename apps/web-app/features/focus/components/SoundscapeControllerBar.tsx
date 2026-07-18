"use client";

import { useFocusStore } from "@/features/focus/store/focus.store";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";
import { 
  Play, Pause, SkipForward, SkipBack, ChevronsRight, ChevronsLeft,
  Volume2, Volume1, VolumeX, Repeat, Shuffle, PanelRightOpen, Music
} from "lucide-react";
import { useEffect, useState } from "react";

interface SoundscapeControllerBarProps {
  onExpandZenZone: () => void;
}

export function SoundscapeControllerBar({ onExpandZenZone }: SoundscapeControllerBarProps) {
  const { t } = useTranslation();
  const {
    isPlaying, volume, currentTime, duration, isLooping, isShuffle,
    activeVideoTitle, activeVideoAuthor, activeVideoId, playerControls,
    setVolume, setIsLooping, setIsShuffle, playNextSoundscape, playPrevSoundscape
  } = useFocusStore();

  const [prevVolume, setPrevVolume] = useState(volume);
  const [sliderValue, setSliderValue] = useState(currentTime);
  const [isDragging, setIsDragging] = useState(false);

  // Sync timeline slider value with actual playback time (unless user is dragging it)
  useEffect(() => {
    if (!isDragging) {
      setSliderValue(currentTime);
    }
  }, [currentTime, isDragging]);

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

  return (
    <div className="h-20 bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-8px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.5)] px-4 flex items-center justify-between gap-4 select-none shrink-0 transition-all duration-300 relative z-[40]">
      {/* ── TRÁI: Info bài hát ── */}
      <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted border border-border flex items-center justify-center shrink-0 shadow-inner group relative">
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
          <span className="text-sm font-semibold text-foreground truncate hover:text-primary transition-colors cursor-default" title={activeVideoTitle}>
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
            className="w-8 h-8 rounded-full bg-foreground hover:scale-105 transition-transform flex items-center justify-center text-background cursor-pointer shadow-md"
            title={isPlaying ? t.flow.player.pause : t.flow.player.play}
          >
            {isPlaying ? (
              <Pause className="w-4.5 h-4.5 fill-background text-background ml-[0.5px]" />
            ) : (
              <Play className="w-4.5 h-4.5 fill-background text-background ml-[2px]" />
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
          <span className="w-8 text-right tabular-nums">{formatTime(sliderValue)}</span>
          <div className="flex-1 relative flex items-center group/slider">
            <input 
              type="range"
              min="0"
              max={duration || 100}
              value={sliderValue}
              onChange={handleTimelineChange}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={handleTimelineChangeEnd}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={handleTimelineChangeEnd}
              className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary hover:accent-primary/80"
              style={{
                background: `linear-gradient(to right, var(--primary) 0%, var(--primary) ${duration ? (sliderValue / duration) * 100 : 0}%, var(--border) ${duration ? (sliderValue / duration) * 100 : 0}%, var(--border) 100%)`
              }}
            />
          </div>
          <span className="w-8 text-left tabular-nums">{formatTime(duration)}</span>
        </div>
      </div>

      {/* ── PHẢI: Âm lượng & Thao tác ── */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[180px]">
        {/* Nút bật/tắt ZenZone */}
        <button
          onClick={onExpandZenZone}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          title={t.flow.player.expandZen}
        >
          <PanelRightOpen className="w-4 h-4 text-primary" />
          <span className="hidden sm:inline">{t.nav.flow}</span>
        </button>

        <div className="w-px h-6 bg-border" />

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
