import {
  Box,
  CircularProgress,
  Divider,
  Paper,
  Typography,
} from "@mui/material";
import { RefreshCw, Save } from "lucide-react";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { fetchSettings, updateSettings } from "../../api/module/settings";
import CustomButton from "../../components/customButton";
import TextInput from "../../components/textInput";

const fallbackStats = [
  { label: "Happy Clients", value: 2654, suffix: "+" },
  { label: "Projects Completed", value: 1520, suffix: "+" },
  { label: "Awards Won", value: 120, suffix: "+" },
  { label: "Positive Reviews", value: 50, suffix: "+" },
];

const normalizeStats = (stats) => {
  const source = Array.isArray(stats) && stats.length ? stats : fallbackStats;
  return source.map((stat, index) => ({
    label: stat?.label || fallbackStats[index]?.label || "",
    value: Number.isFinite(Number(stat?.value)) ? Number(stat.value) : 0,
    suffix: typeof stat?.suffix === "string" ? stat.suffix : "+",
  }));
};

const HomeStats = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [stats, setStats] = useState(fallbackStats);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsFetching(true);
    try {
      const response = await fetchSettings();
      if (response.status === 200 || response.status === 201) {
        const data = response.data?.data || response.data;
        setStats(normalizeStats(data?.homeStats));
      }
    } catch (error) {
      console.error("Fetch Home Stats Error:", error);
      enqueueSnackbar("Failed to fetch home stats", { variant: "error" });
    } finally {
      setIsFetching(false);
    }
  };

  const handleStatChange = (index, field, value) => {
    setStats((prev) =>
      prev.map((stat, idx) =>
        idx === index ? { ...stat, [field]: value } : stat,
      ),
    );
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const payload = {
        homeStats: normalizeStats(stats),
      };

      const response = await updateSettings(payload);
      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar("Home stats updated successfully!", {
          variant: "success",
        });
      } else {
        enqueueSnackbar(response.data?.message || "Failed to update", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Update Home Stats Error:", error);
      enqueueSnackbar("Something went wrong", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <Box
        sx={{
          p: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "400px",
        }}
      >
        <CircularProgress sx={{ color: "#8CE600" }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            color: "#FFFFFF",
            fontWeight: 700,
            mb: 1,
            background: "#8CE600",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Home Stats
        </Typography>
        <Typography variant="body1" sx={{ color: "#B0B0B0" }}>
          Update the achievement numbers shown on the home page.
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          backgroundColor: "#1A1A1A",
          borderRadius: "20px",
          border: "1px solid #333333",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 4 }}>
          {stats.map((stat, index) => (
            <Box key={`${stat.label}-${index}`} sx={{ mb: 4 }}>
              <Typography
                variant="subtitle1"
                sx={{ color: "#8CE600", fontWeight: 600, mb: 2 }}
              >
                Stat #{index + 1}
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 120px" },
                  gap: 2,
                }}
              >
                <TextInput
                  label="Label"
                  value={stat.label}
                  onChange={(e) =>
                    handleStatChange(index, "label", e.target.value)
                  }
                />
                <TextInput
                  label="Value"
                  type="number"
                  value={stat.value}
                  onChange={(e) =>
                    handleStatChange(index, "value", e.target.value)
                  }
                />
                <TextInput
                  label="Suffix"
                  value={stat.suffix}
                  onChange={(e) =>
                    handleStatChange(index, "suffix", e.target.value)
                  }
                />
              </Box>
              {index < stats.length - 1 && (
                <Divider sx={{ borderColor: "#333333", mt: 4 }} />
              )}
            </Box>
          ))}

          <Box
            sx={{
              display: "flex",
              gap: 2,
              justifyContent: "flex-end",
              mt: 4,
              pt: 3,
              borderTop: "1px solid #333333",
            }}
          >
            <CustomButton
              variant="gradientbtn"
              btnLabel="Reset"
              handlePressBtn={fetchData}
              startIcon={<RefreshCw size={18} />}
            />
            <CustomButton
              variant="gradientbtn"
              btnLabel={isLoading ? "Saving..." : "Save Changes"}
              handlePressBtn={handleSave}
              startIcon={!isLoading ? <Save size={18} /> : null}
              disabled={isLoading}
            />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default HomeStats;

