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
import AddEditBlogDialog from "./addEditBlog";
import ViewImageAndVideoDialog from "../ViewImageAndVideoDialog";
import { useSnackbar } from "notistack";
import {
  createResource,
  deleteResource,
  getAllBlogs,
  updateResource,
} from "../../../api/module/resource";
import { deleteConfirm } from "../../../components/customSweetAlert";
import useUserStore from "../../../zustand/useUserStore";
import { useLocation } from "react-router-dom";

const Blog = () => {
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));

  // Table headers configuration
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
  const [blogData, setBlogData] = useState([
    {
      id: 1,
      title: "Sample Blog Post",
      subTitle: "A sample subtitle",
      shortDescription: "This is a short description of the blog post",
      longDescription:
        "<p>This is the long description with rich text content</p>",
      image: [
        {
          name: "blog1.jpg",
          url: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=500&h=300&fit=crop",
        },
        {
          name: "blog2.jpg",
          url: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=500&h=300&fit=crop",
        },
      ],
      video: [
        {
          name: "blog1.mp4",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        },
        {
          name: "blog2.mp4",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        },
      ],
    },
    {
      id: 2,
      title: "Another Blog Post",
      subTitle: "Another subtitle",
      shortDescription: "Another short description",
      longDescription: "<p>Another long description</p>",
      image: [
        {
          name: "blog3.jpg",
          url: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500&h=300&fit=crop",
        },
      ],
      video: [
        {
          name: "blog3.mp4",
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
    handleGetBlog();
  }, []);
  const handleGetBlog = async () => {
    setIsLoading(true);

    try {
      const response = await getAllBlogs();
      console.log(response.data.data.faqs, "responceBlogdata");

      if (response.status === 200 || response.status === 201) {
        setBlogData(response.data.data.blogs || []);
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("FAQ Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSaveBlog = async (formData) => {
    setIsLoading(true);

    try {
      const payload = {
        title: formData.title,
        subTitle: formData.subTitle,
        shortDescription: formData.shortDescription,
        longDescription: formData.longDescription,
        image: formData.image,
        postedOn: formData.postedOn ? formData.postedOn.toISOString() : null,
        type: "blog",
      };

      const response = isEdit
        ? await updateResource(editData._id, payload)
        : await createResource(payload);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message || "FAQ saved successfully!", {
          variant: "success",
        });

        await handleGetBlog();
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

  // const handleDeleteBlog = async (id) => {
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

  //       await handleGetBlog();
  //     } else {
  //       enqueueSnackbar(response.data.message, { variant: "error" });
  //     }
  //   } catch (error) {
  //     console.log("Delete FAQ error:", error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const handleDeleteBlog = async (id) => {
    try {
      const confirmation = await deleteConfirm({
        title: "Delete Blog?",
        text: "Are you sure you want to delete this Blog?",
        confirmButtonText: "Delete",
      });

      if (!confirmation.isConfirmed) return;

      setIsLoading(true);

      const response = await deleteResource(id);
      console.log(response, "delete  Work Category");

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message, { variant: "sucess" });

        handleGetBlog();
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("Delete FAQ error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBlog = () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };

  const handleEditBlog = (blogId) => {
    const blog = blogData.find((b) => b._id === blogId);
    if (blog) {
      setEditData(blog);
      setIsEdit(true);
      setDialogOpen(true);
    }
  };

  // const handleSaveBlog = (formData) => {
  //   if (isEdit && editData) {
  //     // Update existing blog
  //     setBlogData((prev) =>
  //       prev.map((blog) =>
  //         blog.id === editData.id ? { ...formData, id: editData.id } : blog
  //       )
  //     );
  //   } else {
  //     // Add new blog
  //     const newBlog = {
  //       ...formData,
  //       id: Math.max(...blogData.map((b) => b.id)) + 1,
  //     };
  //     setBlogData((prev) => [...prev, newBlog]);
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
  const filteredBlogData = blogData.filter((blog) => {
    const matchesSearch =
      blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.subTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blog.shortDescription.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate =
      !dateRange.hasRange ||
      (dateRange.startDate &&
        dateRange.endDate &&
        new Date(blog.createdAt || new Date()) >= dateRange.startDate &&
        new Date(blog.createdAt || new Date()) <= dateRange.endDate);

    return matchesSearch && matchesDate;
  });

  // Transform data for table display
  const tableData = filteredBlogData.map((blog) => ({
    ...blog,
    postedOn: blog.postedOn
      ? new Date(blog.postedOn).toLocaleDateString()
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
            placeholder="Search blogs by title, subtitle, or description..."
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
              onClick={handleAddBlog}
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
              Add New Blog
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
          handleEditService={handleEditBlog}
          handleViewImages={handleViewImages}
          isLoading={isLoading}
          showPagination={true}
          handleDeleteService={handleDeleteBlog}
          showEdit={perms.isEdit ? true : false}
          showDelete={perms.isDelete ? true : false}
        />
      </Paper>

      <AddEditBlogDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveBlog}
        editData={editData}
        isEdit={isEdit}
      />

      <ViewImageAndVideoDialog
        open={viewImageDialogOpen}
        onClose={() => setViewImageDialogOpen(false)}
        images={selectedImages}
        // videos={selectedVideos}
        title="Blog Media"
      />
    </Box>
  );
};

export default Blog;
