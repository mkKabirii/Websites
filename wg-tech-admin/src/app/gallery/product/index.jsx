import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Tooltip,
  IconButton,
} from "@mui/material";
import { Plus, Eye, FileText, Search, ExternalLink } from "lucide-react";
import TextInput from "../../../components/textInput";
import DateRangeFilter from "../../../components/dateRangeFilter";
import PaginatedTable from "../../../components/dynamicTable";
import AddEditProductDialog from "./addEditProduct";
import ViewImageAndVideoDialog from "../ViewImageAndVideoDialog";
import { useSnackbar } from "notistack";
import {
  createResource,
  deleteResource,
  getAllProducts,
  updateResource,
} from "../../../api/module/resource";
import { deleteConfirm } from "../../../components/customSweetAlert";
import useUserStore from "../../../zustand/useUserStore";
import { useLocation } from "react-router-dom";

const Product = () => {
  const { enqueueSnackbar } = useSnackbar();
  const location = useLocation();
  const perms = useUserStore((s) => s.getRoutePermissions(location.pathname));

  // Table headers configuration
  const tableHeaders = [
    { id: "id", title: "ID", align: "center" },
    { id: "heading", title: "Heading", align: "center" },
    { id: "shortDescription", title: "Short Description", align: "center" },
    { id: "postedOn", title: "Posted On", align: "center" },
    // { id: "productLink", title: "Product Link", align: "center" },
    // { id: "images", title: "Media", align: "center" },
    { id: "image", title: "Image", align: "center" },
    { id: "actions", title: "Actions", align: "center" },
  ];

  const displayRows = [
    "id",
    "title",
    "shortDescription",
    "postedOn",
    // "productLink",
    // "images",
    "image",
    "actions",
  ];

  // Sample data
  const [productData, setProductData] = useState([
    {
      id: 1,
      heading: "Sample Product",
      shortDescription: "This is a short description of the product",
      productLink: "https://example.com/product1",
      image: [
        {
          name: "product1.jpg",
          url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=300&fit=crop",
        },
        {
          name: "product2.jpg",
          url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=300&fit=crop",
        },
      ],
      video: [
        {
          name: "product1.mp4",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        },
        {
          name: "product2.mp4",
          url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        },
      ],
    },
    {
      id: 2,
      heading: "Another Product",
      shortDescription: "Another short description",
      productLink: "https://example.com/product2",
      image: [
        {
          name: "product3.jpg",
          url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=300&fit=crop",
        },
      ],
      video: [
        {
          name: "product3.mp4",
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
  const [isLoading, setIsLoading] = useState(false);

  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    handleGetProduct();
  }, []);
  const handleGetProduct = async () => {
    setIsLoading(true);

    try {
      const response = await getAllProducts();

      if (response.status === 200 || response.status === 201) {
        setProductData(response.data.data.products || []);
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("FAQ Fetch Error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const handleSaveProduct = async (formData) => {
    setIsLoading(true);

    try {
      const payload = {
        title: formData.heading,
        subTitle: formData.subTitle,
        productLink: formData.productLink,
        shortDescription: formData.shortDescription,
        longDescription: formData.shortDescription,
        productImages: formData.productImages,
        postedOn: formData.postedOn ? formData.postedOn.toISOString() : null,
        type: "product",
      };

      const response = isEdit
        ? await updateResource(editData._id, payload)
        : await createResource(payload);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(
          response.data.message || "Product saved successfully!",
          {
            variant: "success",
          },
        );

        await handleGetProduct();
        setDialogOpen(false);
      } else {
        enqueueSnackbar(response.data.message || "Failed to save product", {
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Save Product Error:", error);
      enqueueSnackbar("Something went wrong", { variant: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  // const handleDeleteProduct = async (id) => {
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

  //       await handleGetProduct();
  //     } else {
  //       enqueueSnackbar(response.data.message, { variant: "error" });
  //     }
  //   } catch (error) {
  //     console.log("Delete FAQ error:", error);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };
  const handleDeleteProduct = async (id) => {
    try {
      const confirmation = await deleteConfirm({
        title: "Delete Product?",
        text: "Are you sure you want to delete this Product?",
        confirmButtonText: "Delete",
      });

      if (!confirmation.isConfirmed) return;

      setIsLoading(true);

      const response = await deleteResource(id);

      if (response.status === 200 || response.status === 201) {
        enqueueSnackbar(response.data.message, { variant: "sucess" });

        handleGetProduct();
      } else {
        enqueueSnackbar(response.data.message, { variant: "error" });
      }
    } catch (error) {
      console.log("Delete FAQ error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = () => {
    setEditData(null);
    setIsEdit(false);
    setDialogOpen(true);
  };

  const handleEditProduct = (productId) => {
    const product = productData.find((p) => p._id === productId);

    if (product) {
      setEditData(product);
      setIsEdit(true);
      setDialogOpen(true);
    }
  };

  // const handleSaveProduct = (formData) => {
  //   if (isEdit && editData) {
  //     // Update existing product
  //     setProductData((prev) =>
  //       prev.map((product) =>
  //         product.id === editData.id ? { ...formData, id: editData.id } : product
  //       )
  //     );
  //   } else {
  //     // Add new product
  //     const newProduct = {
  //       ...formData,
  //       id: Math.max(...productData.map((p) => p.id)) + 1,
  //     };
  //     setProductData((prev) => [...prev, newProduct]);
  //   }
  // };

  const handleViewImages = (images, videos = []) => {
    setSelectedImages(images || []);
    setSelectedVideos(videos || []);
    setViewImageDialogOpen(true);
  };

  const handleOpenProductLink = (link) => {
    window.open(link, "_blank");
  };

  // Filter functions
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter data based on search
  const filteredProductData = productData.filter((product) => {
    const matchesSearch =
      product.heading?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.shortDescription
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      product.productLink?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  // Transform data for table display
  const tableData = filteredProductData.map((product) => ({
    ...product,
    postedOn: product.postedOn
      ? new Date(product.postedOn).toLocaleDateString()
      : "-",
    productLink: (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography
          variant="body2"
          sx={{
            color: "#8CE600",
            textDecoration: "underline",
            cursor: "pointer",
            maxWidth: "200px",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          onClick={() => handleOpenProductLink(product.productLink)}
        >
          {product.productLink}
        </Typography>
        <IconButton
          size="small"
          onClick={() => handleOpenProductLink(product.productLink)}
          sx={{ color: "#8CE600" }}
        >
          <ExternalLink size={16} />
        </IconButton>
      </Box>
    ),
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

        {/* Add Button */}
        {perms.isCreate && (
          <Box>
            <Button
              variant="contained"
              startIcon={<Plus size={20} />}
              onClick={handleAddProduct}
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
              Add New Product
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
          handleEditService={handleEditProduct}
          handleViewImages={handleViewImages}
          isLoading={isLoading}
          showPagination={true}
          handleDeleteService={handleDeleteProduct}
          showEdit={perms.isEdit ? true : false}
          showDelete={perms.isDelete ? true : false}
        />
      </Paper>

      <AddEditProductDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSaveProduct}
        editData={editData}
        isEdit={isEdit}
      />

      <ViewImageAndVideoDialog
        open={viewImageDialogOpen}
        onClose={() => setViewImageDialogOpen(false)}
        images={selectedImages}
        videos={selectedVideos}
        title="Product Media"
      />
    </Box>
  );
};

export default Product;
