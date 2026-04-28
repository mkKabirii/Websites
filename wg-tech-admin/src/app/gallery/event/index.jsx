import { Box, Button, Paper } from "@mui/material";
import { Plus, Search } from "lucide-react";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import {
  createEvents,
  deleteEvents,
  getAllArchiveEvents,
  updateEvents,
} from "../../../api/module/event";
import { deleteConfirm } from "../../../components/customSweetAlert";
import DateRangeFilter from "../../../components/dateRangeFilter";
import PaginatedTable from "../../../components/dynamicTable";
import TextInput from "../../../components/textInput";
import ViewImageAndVideoDialog from "../ViewImageAndVideoDialog";
import AddEditEventDialog from "./addEditEvent";
import useUserStore from "../../../zustand/useUserStore";
import { useLocation } from "react-router-dom";

const Event = () => {
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));

  // Table headers configuration
  const tableHeaders = [
    { id: "id", title: "ID", align: "center" },
    { id: "title", title: "Title", align: "center" },
    { id: "subTitle", title: "Sub Title", align: "center" },
    { id: "shortDescription", title: "Short Description", align: "center" },
    { id: "location", title: "Location", align: "center" },
    // { id: "date", title: "Date", align: "center" },
    { id: "images", title: "Media", align: "center" },
    { id: "actions", title: "Actions", align: "center" },
  ];

  const displayRows = [
    "id",
    "title",
    "subTitle",
    "shortDescription",
    "location",
    // "date",
    "images",
    "actions",
  ];

  // Sample data
  const [eventData, setEventData] = useState([
    {
      id: 1,
      title: "Sample Event",
      subTitle: "A sample subtitle",
      shortDescription: "This is a short description of the event",
      longDescription:
        "<p>This is the long description with rich text content</p>",
      location: "New York, USA",
      date: "2024-12-25",
      image: [
        {
          name: "event1.jpg",
          url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=500&h=300&fit=crop",
        },
        {
          name: "event2.jpg",
          url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=500&h=300&fit=crop",
        },
      ],
      video: [
        {
          name: "event1.mp4",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        },
        {
          name: "event2.mp4",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        },
      ],
    },
    {
      id: 2,
      title: "Another Event",
      subTitle: "Another subtitle",
      shortDescription: "Another short description",
      longDescription: "<p>Another long description</p>",
      location: "London, UK",
      date: "2024-12-31",
      image: [
        {
          name: "event3.jpg",
          url: "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500&h=300&fit=crop",
        },
      ],
      video: [
        {
          name: "event3.mp4",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        },
      ],
    },
  ]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [isEdit, setIsEdit] = useState(false);
  const [viewImageDialogOpen, setViewImageDialogOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideos, setSelectedVideos] = useState([]);

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
    hasRange: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleAddEvent = () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };

  const handleEditEvent = (eventId) => {
    const event = eventData.find((e) => e._id === eventId);
    if (event) {
      setEditData(event);
      setIsEdit(true);
      setDialogOpen(true);
    }
  };
  useEffect(() => {
    handleGetArchiveEvents();
  }, []);
  const handleGetArchiveEvents = async () => {
    setIsLoading(true);

    try {
      const response = await getAllArchiveEvents();
      console.log(response.data.data.faqs, "responceBlogdata");

      if (response.status === 200 || response.status === 201) {
        setEventData(response.data.data.events || []);
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("FAQ Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSaveEvent = async (formData) => {
    setIsLoading(true);

    try {
      const payload = {
        title: formData.title,
        subTitle: formData.subTitle,
        shortDescription: formData.shortDescription,
        longDescription: formData.longDescription,
        image: formData.image,
        video: formData.video,
        location: formData.location,
        eventDate: formData.eventDate,
        type: "archive_event",
      };

      const response = isEdit
        ? await updateEvents(editData._id, payload)
        : await createEvents(payload);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message || "FAQ saved successfully!", {
          variant: "success",
        });

        await handleGetArchiveEvents();
        setDialogOpen(false);
      } else {
        enqueueSnackbar(response.data.message || "Failed to save FAQ", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Save FAQ Error:", error);
      enqueueSnackbar("Something went wrong", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteArchiveEvents = async (id) => {
    try {
      const confirmation = await deleteConfirm({
        title: "Delete ArchiveEvents?",
        text: "Are you sure you want to delete this ArchiveEvents?",
        confirmButtonText: "Delete",
      });

      if (!confirmation.isConfirmed) return;

      setIsLoading(true);

      const response = await deleteEvents(id);
      console.log(response, "delete  Work Category");

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message, { variant: "sucess" });

        handleGetArchiveEvents();
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("Delete FAQ error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  // const handleSaveEvent = (formData) => {
  //   if (isEdit && editData) {
  //     // Update existing event
  //     setEventData((prev) =>
  //       prev.map((event) =>
  //         event.id === editData.id ? { ...formData, id: editData.id } : event
  //       )
  //     );
  //   } else {
  //     // Add new event
  //     const newEvent = {
  //       ...formData,
  //       id: Math.max(...eventData.map((e) => e.id)) + 1,
  //     };
  //     setEventData((prev) => [...prev, newEvent]);
  //   }
  // };

  const handleViewImages = (images, videos = []) => {
    setSelectedImages(images || []);
    setSelectedVideos(videos || []);
    setViewImageDialogOpen(true);
  };

  // Filter functions
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  // Filter data based on search and date range
  const filteredEventData = eventData.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.subTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.location.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate =
      !dateRange.hasRange ||
      (dateRange.startDate &&
        dateRange.endDate &&
        new Date(event.date || new Date()) >= dateRange.startDate &&
        new Date(event.date || new Date()) <= dateRange.endDate);

    return matchesSearch && matchesDate;
  });

  // Transform data for table display
  const tableData = filteredEventData.map((event) => ({
    ...event,
  }));

  return (
    <Box sx={{ p: 3 }}>
      {/* Search and Filter Section */}
      <Box
        sx={{
          mb: 3,
          display: "flex",
          gap: 2,
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {/* Search Input */}
        <Box sx={{ flex: 1, minWidth: "300px" }}>
          <TextInput
            placeholder="Search here..."
            value={searchTerm}
            onChange={handleSearchChange}
            InputEndIcon={<Search size={20} color="#8CE600" />}
            inputBgColor="#2A2A2A"
            sx={{ width: "100%" }}
          />
        </Box>

        {/* Date Range Filter */}
        <Box sx={{ minWidth: "280px" }}>
          <DateRangeFilter
            onDateRangeChange={handleDateRangeChange}
            placeholder="Filter by date range"
          />
        </Box>

        {/* Add Button */}
        {perms.isCreate && (
          <Box>
            <Button
              variant="contained"
              startIcon={<Plus size={20} />}
              onClick={handleAddEvent}
              sx={{
                backgroundColor: "#8CE600",
                color: "#000",
                fontWeight: 600,
                px: 3,
                py: 1.5,
                borderRadius: "12px",
                textTransform: "none",
                fontSize: "16px",
                "&:hover": {
                  backgroundColor: "#7BCC00",
                  transform: "translateY(-2px)",
                  boxShadow: "0 8px 25px rgba(140, 230, 0, 0.3)",
                },
                transition: "all 0.3s ease",
              }}
            >
              Add New Event
            </Button>
          </Box>
        )}
      </Box>

      {/* Table Container */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: "#1A1A1A",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid #333333",
        }}
      >
        <PaginatedTable
          tableWidth="100%"
          tableHeader={tableHeaders}
          tableData={tableData}
          displayRows={displayRows}
          handleEditService={handleEditEvent}
          handleViewImages={handleViewImages}
          isLoading={isLoading}
          showPagination={true}
          handleDeleteService={handleDeleteArchiveEvents}
          showEdit={perms.isEdit ? true : false}
          showDelete={perms.isDelete ? true : false}
        />
      </Paper>

      <AddEditEventDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveEvent}
        editData={editData}
        isEdit={isEdit}
      />

      <ViewImageAndVideoDialog
        open={viewImageDialogOpen}
        onClose={() => setViewImageDialogOpen(false)}
        images={selectedImages}
        videos={selectedVideos}
        title="Event Media"
      />
    </Box>
  );
};

export default Event;
