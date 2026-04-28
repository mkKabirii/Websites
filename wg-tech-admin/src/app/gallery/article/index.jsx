import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Tooltip,
  IconButton,
} from "@mui/material";
import { Plus, Eye, FileText, Search } from "lucide-react";
import TextInput from "../../../components/textInput";
import DateRangeFilter from "../../../components/dateRangeFilter";
import PaginatedTable from "../../../components/dynamicTable";
import AddEditArticleDialog from "./addEditArticle";
import ViewImageAndVideoDialog from "../ViewImageAndVideoDialog";
import { useSnackbar } from "notistack";
import {
  createResource,
  deleteResource,
  getAllArticles,
  updateResource,
} from "../../../api/module/resource";
import { deleteConfirm } from "../../../components/customSweetAlert";
import useUserStore from "../../../zustand/useUserStore";
import { useLocation } from "react-router-dom";

const Article = () => {
  // Table headers configuration
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));

  const tableHeaders = [
    { id: "id", title: "ID", align: "center" },
    { id: "title", title: "Title", align: "center" },
    { id: "subTitle", title: "Sub Title", align: "center" },
    { id: "shortDescription", title: "Short Description", align: "center" },
    { id: "postedOn", title: "Posted On", align: "center" },
    // { id: "images", title: "Media", align: "center" },
    { id: "image", title: "Image", align: "center" },
    { id: "actions", title: "Actions", align: "center" },
  ];

  const displayRows = [
    "id",
    "title",
    "subTitle",
    "shortDescription",
    "postedOn",
    "image",
    "actions",
  ];

  // Sample data
  const [articleData, setArticleData] = useState([
    {
      id: 1,
      title: "Sample Article",
      subTitle: "A sample subtitle",
      shortDescription: "This is a short description of the article",
      longDescription:
        "<p>This is the long description with rich text content</p>",
      image: [
        {
          name: "article1.jpg",
          url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&h=300&fit=crop",
        },
        {
          name: "article2.jpg",
          url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=500&h=300&fit=crop",
        },
      ],
      video: [
        {
          name: "article1.mp4",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        },
        {
          name: "article2.mp4",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        },
      ],
    },
    {
      id: 2,
      title: "Another Article",
      subTitle: "Another subtitle",
      shortDescription: "Another short description",
      longDescription: "<p>Another long description</p>",
      image: [
        {
          name: "article3.jpg",
          url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&h=300&fit=crop",
        },
      ],
      video: [
        {
          name: "article3.mp4",
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

  useEffect(() => {
    handleGetArticle();
  }, []);
  const handleGetArticle = async () => {
    setIsLoading(true);

    try {
      const response = await getAllArticles();
      console.log(response.data.data.articles, "responceArticledata");

      if (response.status === 200 || response.status === 201) {
        setArticleData(response.data.data.articles || []);
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("FAQ Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSaveArticle = async (formData) => {
    setIsLoading(true);

    try {
      const payload = {
        title: formData.title,
        subTitle: formData.subTitle,
        shortDescription: formData.shortDescription,
        longDescription: formData.longDescription,
        image: formData.image,
        postedOn: formData.postedOn ? formData.postedOn.toISOString() : null,
        type: "article",
      };

      const response = isEdit
        ? await updateResource(editData._id, payload)
        : await createResource(payload);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(
          response.data.message || "Articles saved successfully!",
          {
            variant: "success",
          },
        );

        await handleGetArticle();
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

  // const handleDeleteArticles = async (id) => {
  //   try {
  //     const result = await deleteConfirm({
  //       title: "Delete FAQ?",
  //       text: "Are you sure you want to delete this FAQ?",
  //       confirmButtonText: "Delete",
  //     });

  //     if (!result.isConfirmed) return;

  //     setIsLoading(true);

  //     const response = await deleteResource(id);

  //     if (response.status === 200 || response.status === 201) {
  //       await Swal.fire({
  //         title: "Deleted!",
  //         text: response.data.message,
  //         icon: "success",
  //       });

  //       await handleGetArticle();
  //     } else {
  //       enqueueSnackbar(response.data.message, { variant: "error" });
  //     }
  //   } catch (error) {
  //     console.log("Delete FAQ error:", error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const handleDeleteArticles = async (id) => {
    try {
      const confirmation = await deleteConfirm({
        title: "Delete Article?",
        text: "Are you sure you want to delete this Article?",
        confirmButtonText: "Delete",
      });

      if (!confirmation.isConfirmed) return;

      setIsLoading(true);

      const response = await deleteResource(id);
      console.log(response, "delete  Work Category");

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message, { variant: "sucess" });

        handleGetArticle();
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("Delete FAQ error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddArticle = () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };

  const handleEditArticle = (articleId) => {
    const article = articleData.find((a) => a._id === articleId);
    if (article) {
      setEditData(article);
      setIsEdit(true);
      setDialogOpen(true);
    }
  };

  // const handleSaveArticle = (formData) => {
  //   if (isEdit && editData) {
  //     // Update existing article
  //     setArticleData((prev) =>
  //       prev.map((article) =>
  //         article.id === editData.id ? { ...formData, id: editData.id } : article
  //       )
  //     );
  //   } else {
  //     // Add new article
  //     const newArticle = {
  //       ...formData,
  //       id: Math.max(...articleData.map((a) => a.id)) + 1,
  //     };
  //     setArticleData((prev) => [...prev, newArticle]);
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
  const filteredArticleData = articleData.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.subTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate =
      !dateRange.hasRange ||
      (dateRange.startDate &&
        dateRange.endDate &&
        new Date(article.createdAt || new Date()) >= dateRange.startDate &&
        new Date(article.createdAt || new Date()) <= dateRange.endDate);

    return matchesSearch && matchesDate;
  });

  // Transform data for table display
  const tableData = filteredArticleData.map((article) => ({
    ...article,
    postedOn: article.postedOn
      ? new Date(article.postedOn).toLocaleDateString()
      : "-",
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
            placeholder="Search articles by title, subtitle, or description..."
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
              onClick={handleAddArticle}
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
              Add New Article
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
          tableData={tableData || []}
          displayRows={displayRows}
          handleEditService={handleEditArticle}
          handleViewImages={handleViewImages}
          isLoading={isLoading}
          handleDeleteService={handleDeleteArticles}
          showPagination={true}
          showEdit={perms.isEdit ? true : false}
          showDelete={perms.isDelete ? true : false}
        />
      </Paper>

      <AddEditArticleDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveArticle}
        editData={editData}
        isEdit={isEdit}
      />

      <ViewImageAndVideoDialog
        open={viewImageDialogOpen}
        onClose={() => setViewImageDialogOpen(false)}
        images={selectedImages}
        videos={selectedVideos}
        title="Article Media"
      />
    </Box>
  );
};

export default Article;
