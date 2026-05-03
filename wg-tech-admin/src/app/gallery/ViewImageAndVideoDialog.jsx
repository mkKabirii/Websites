import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  IconButton,
  Avatar,
  Divider,
  Tabs,
  Tab,
  Slider,
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Image,
  Video,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from "lucide-react";
import SlickSlider from "react-slick";
import CustomButton from "../../components/customButton";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// ── Slick carousel global overrides ──────────────────────────────────────────
const customSlickStyles = `
  .slick-prev, .slick-next {
    z-index: 1;
    width: 40px;
    height: 40px;
  }
  .slick-prev:before, .slick-next:before {
    font-size: 24px;
    color: #8CE600;
  }
  .slick-prev { left: 10px; }
  .slick-next { right: 10px; }
  .slick-dots { bottom: -50px; }
  .slick-dots li button:before { font-size: 12px; color: #8CE600; }
  .slick-dots li.slick-active button:before { color: #8CE600; }
`;

// ── Helper: format seconds → m:ss ─────────────────────────────────────────
const formatTime = (secs) => {
  if (!secs || isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
};

// ── Custom YouTube-like Video Player ──────────────────────────────────────────
const VideoPlayer = ({ src, name }) => {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef(null);

  // Show controls briefly then auto-hide during playback
  const resetHideTimer = useCallback(() => {
    setControlsVisible(true);
    clearTimeout(hideTimer.current);
    if (playing) {
      hideTimer.current = setTimeout(() => setControlsVisible(false), 2500);
    }
  }, [playing]);

  useEffect(() => {
    if (!playing) setControlsVisible(true);
    return () => clearTimeout(hideTimer.current);
  }, [playing]);

  // Reset player when src changes (carousel slide change)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [src]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (playing) {
      v.pause();
    } else {
      v.play();
    }
    resetHideTimer();
  };

  const handleTimeUpdate = () => {
    setCurrentTime(videoRef.current?.currentTime || 0);
  };

  const handleLoadedMetadata = () => {
    setDuration(videoRef.current?.duration || 0);
  };

  const handleEnded = () => {
    setPlaying(false);
    setCurrentTime(0);
    if (videoRef.current) videoRef.current.currentTime = 0;
  };

  const handleSeek = (_, value) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = value;
    setCurrentTime(value);
    resetHideTimer();
  };

  const handleVolume = (_, value) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = value;
    setVolume(value);
    setMuted(value === 0);
    resetHideTimer();
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !muted;
    setMuted(!muted);
    resetHideTimer();
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!fullscreen) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
    resetHideTimer();
  };

  useEffect(() => {
    const onFsChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const progressPct = duration ? (currentTime / duration) * 100 : 0;

  return (
    <Box
      ref={containerRef}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => playing && setControlsVisible(false)}
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "16/9",
        backgroundColor: "#000",
        borderRadius: "12px",
        overflow: "hidden",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {/* Video element */}
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={handleEnded}
        onClick={togglePlay}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          display: "block",
        }}
      />

      {/* Big play/pause overlay (click on video) */}
      <AnimatePresence>
        {!playing && (
          <motion.div
            key="bigplay"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.3)",
              pointerEvents: "none",
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                backgroundColor: "rgba(140,230,0,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 20px rgba(140,230,0,0.4)",
              }}
            >
              <Play size={30} color="#000" fill="#000" />
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls bar */}
      <AnimatePresence>
        {controlsVisible && (
          <motion.div
            key="controls"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background:
                "linear-gradient(transparent, rgba(0,0,0,0.85))",
              padding: "20px 12px 10px",
            }}
          >
            {/* Seek bar */}
            <Slider
              value={currentTime}
              min={0}
              max={duration || 1}
              step={0.1}
              onChange={handleSeek}
              size="small"
              sx={{
                color: "#8CE600",
                height: 3,
                mb: 0.5,
                "& .MuiSlider-thumb": {
                  width: 12,
                  height: 12,
                  "&:hover": { boxShadow: "0 0 0 6px rgba(140,230,0,0.2)" },
                },
                "& .MuiSlider-rail": { backgroundColor: "rgba(255,255,255,0.25)" },
                "& .MuiSlider-track": { border: "none" },
              }}
            />

            {/* Bottom row: play | time | volume | fullscreen */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                color: "#fff",
              }}
            >
              {/* Play / Pause */}
              <IconButton
                onClick={togglePlay}
                size="small"
                sx={{ color: "#fff", p: 0.5 }}
              >
                {playing ? <Pause size={18} /> : <Play size={18} />}
              </IconButton>

              {/* Time display */}
              <Typography variant="caption" sx={{ fontVariantNumeric: "tabular-nums", minWidth: 80 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>

              {/* Spacer */}
              <Box sx={{ flex: 1 }} />

              {/* Volume toggle */}
              <IconButton
                onClick={toggleMute}
                size="small"
                sx={{ color: "#fff", p: 0.5 }}
              >
                {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </IconButton>

              {/* Volume slider */}
              <Slider
                value={muted ? 0 : volume}
                min={0}
                max={1}
                step={0.01}
                onChange={handleVolume}
                size="small"
                sx={{
                  width: 72,
                  color: "#8CE600",
                  height: 3,
                  "& .MuiSlider-thumb": { width: 10, height: 10 },
                  "& .MuiSlider-rail": { backgroundColor: "rgba(255,255,255,0.25)" },
                  "& .MuiSlider-track": { border: "none" },
                }}
              />

              {/* Fullscreen */}
              <IconButton
                onClick={toggleFullscreen}
                size="small"
                sx={{ color: "#fff", p: 0.5 }}
              >
                {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </IconButton>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

// ── Main Dialog ───────────────────────────────────────────────────────────────
const ViewImageAndVideoDialog = ({
  open,
  onClose,
  images = [],
  videos = [],
  title = "Media",
}) => {
  const [activeTab, setActiveTab] = useState(0);

  const handleClose = () => {
    setActiveTab(0);
    onClose();
  };

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  // Carousel settings (used for images)
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: false,
    arrows: true,
    adaptiveHeight: false,
  };

  // Video carousel — no autoplay; each slide renders its own player
  const videoCarouselSettings = {
    ...carouselSettings,
    afterChange: () => {}, // players reset via useEffect on src change
  };

  if ((!images || images.length === 0) && (!videos || videos.length === 0)) {
    return null;
  }

  return (
    <>
      <style>{customSlickStyles}</style>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: "#1A1A1A",
            borderRadius: "20px",
            border: "1px solid #333333",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          },
        }}
      >
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Header */}
              <DialogTitle sx={{ p: 0 }}>
                <Box
                  sx={{
                    background:
                      "linear-gradient(135deg,rgb(49,46,46) 0%,rgb(45,45,45) 100%)",
                    p: 2,
                    borderRadius: "20px 20px 0 0",
                    position: "relative",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "8px",
                        backgroundColor: "rgba(0,0,0,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Typography variant="h6" color="#fff">
                        {images.length + videos.length}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h6">
                        {title} ({images.length + videos.length} media files)
                      </Typography>
                      <Typography variant="body2">
                        {images.length} Images • {videos.length} Videos
                      </Typography>
                    </Box>
                  </Box>

                  <IconButton
                    onClick={handleClose}
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      color: "#fff",
                      backgroundColor: "rgba(0,0,0,0.1)",
                      "&:hover": { backgroundColor: "rgba(0,0,0,0.2)" },
                    }}
                  >
                    <X size={18} />
                  </IconButton>
                </Box>
                <Divider />
              </DialogTitle>

              {/* Content */}
              <DialogContent sx={{ p: 0 }}>
                {/* Tabs */}
                <Box sx={{ borderBottom: 1, borderColor: "divider", px: 3, pt: 2 }}>
                  <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    aria-label="media tabs"
                    sx={{
                      "& .MuiTab-root": {
                        color: "#B0B0B0",
                        textTransform: "none",
                        fontWeight: 600,
                        minHeight: 48,
                      },
                      "& .Mui-selected": { color: "#8CE600" },
                      "& .MuiTabs-indicator": { backgroundColor: "#8CE600" },
                    }}
                  >
                    <Tab
                      icon={<Image size={20} />}
                      label={`Images (${images.length})`}
                      iconPosition="start"
                      disabled={images.length === 0}
                    />
                    <Tab
                      icon={<Video size={20} />}
                      label={`Videos (${videos.length})`}
                      iconPosition="start"
                      disabled={videos.length === 0}
                    />
                  </Tabs>
                </Box>

                {/* Content area */}
                <Box sx={{ p: 3 }}>
                  {/* ── Images ── */}
                  {activeTab === 0 && images.length > 0 && (
                    <Box>
                      <SlickSlider {...carouselSettings}>
                        {images.map((image, index) => (
                          <Box key={index} sx={{ textAlign: "center" }}>
                            {/* Consistent 16:9 frame */}
                            <Box
                              sx={{
                                width: "100%",
                                aspectRatio: "16/9",
                                borderRadius: "12px",
                                overflow: "hidden",
                                border: "1px solid #333",
                                backgroundColor: "#000",
                                mx: "auto",
                              }}
                            >
                              <img
                                src={image.url}
                                alt={`Image ${index + 1}`}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                  display: "block",
                                }}
                              />
                            </Box>
                            <Typography
                              variant="body2"
                              color="#B0B0B0"
                              sx={{ mt: 1.5 }}
                            >
                              {image.name}
                            </Typography>
                          </Box>
                        ))}
                      </SlickSlider>
                    </Box>
                  )}

                  {/* ── Videos ── */}
                  {activeTab === 1 && videos.length > 0 && (
                    <Box>
                      <SlickSlider {...videoCarouselSettings}>
                        {videos.map((video, index) => (
                          <Box key={index} sx={{ textAlign: "center" }}>
                            {/* Custom YouTube-like player in 16:9 frame */}
                            <VideoPlayer src={video.url} name={video.name} />
                            <Typography
                              variant="body2"
                              color="#B0B0B0"
                              sx={{ mt: 1.5 }}
                            >
                              {video.name}
                            </Typography>
                          </Box>
                        ))}
                      </SlickSlider>
                    </Box>
                  )}

                  {/* ── Empty state ── */}
                  {((activeTab === 0 && images.length === 0) ||
                    (activeTab === 1 && videos.length === 0)) && (
                    <Box sx={{ textAlign: "center", py: 8, color: "#B0B0B0" }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>
                        No {activeTab === 0 ? "Images" : "Videos"} Available
                      </Typography>
                      <Typography variant="body2">
                        {activeTab === 0
                          ? "No images have been uploaded for this item."
                          : "No videos have been uploaded for this item."}
                      </Typography>
                    </Box>
                  )}
                </Box>
              </DialogContent>

              {/* Footer */}
              <Box sx={{ p: 3, pt: 0, textAlign: "center" }}>
                <CustomButton
                  variant="gradientbtn"
                  btnLabel="Close"
                  handlePressBtn={handleClose}
                />
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Dialog>
    </>
  );
};

export default ViewImageAndVideoDialog;
