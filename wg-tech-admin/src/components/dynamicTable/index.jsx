import {
  Avatar,
  Box,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
  Typography,
  MenuItem,
} from "@mui/material";
import React, { useState } from "react";
import { IconButton } from "@mui/material";
import { Edit, Trash, Eye } from "lucide-react";
import { motion } from "framer-motion";
import moment from "moment";
import CustomSelect from "../customSelect";
import CustomButton from "../customButton";
import CustomSwitch from "../switch";
import TableSkeleton from "../skeleton";
const tableStyle = {
  "&.MuiTableContainer-root": {
    backgroundColor: "#0D0D0D",
    borderRadius: "12px",
    boxShadow: "0 6px 24px rgba(0,0,0,0.3)",
    overflow: "auto",
  },
  "& .MuiTableHead-root": {
    background: "linear-gradient(135deg, #8CE600 0%, #8CE600 100%)",
  },
  "& .MuiTableCell-root": {
    borderBottom: "1px solid #333333",
    padding: "14px 18px",
    textAlign: "left",
  },
  "& .MuiTablePagination-toolbar": {
    minHeight: "60px",
    backgroundColor: "#0D0D0D",
    borderTop: "1px solid #333333",
    color: "#FFFFFF",
  },
};

export default function PaginatedTable({
  tableWidth,
  tableHeader,
  tableData,
  displayRows,
  isLoading,
  showPagination = true,
  handleEditService,
  handleEditProposal,
  handleViewService,
  handleDeleteService,
  handleChangeStatus,
  statusOptions,
  handleViewImages,
  handleViewProposal,
  handleToggleStatus,
  showEdit = true,
  showDelete = true,
  // Server-side pagination props
  totalPages = null,
  currentPage = null,
  total = null,
  onPageChange = null,
  onRowsPerPageChange = null,
  rowsPerPage = 10,
}) {
  // Client-side pagination state (fallback if server-side not provided)
  const [clientPage, setClientPage] = useState(0);
  const [clientRowsPerPage, setClientRowsPerPage] = useState(10);

  // Determine if using server-side pagination
  const isServerSidePagination =
    totalPages !== null && currentPage !== null && total !== null;

  // Use server-side or client-side values
  const page = isServerSidePagination ? currentPage - 1 : clientPage; // API uses 1-based, MUI uses 0-based
  const rowsPerPageValue = isServerSidePagination
    ? rowsPerPage
    : clientRowsPerPage;
  const totalCount = isServerSidePagination ? total : tableData?.length || 0;

  const handleChangePage = (event, newPage) => {
    if (isServerSidePagination && onPageChange) {
      onPageChange(newPage + 1, rowsPerPageValue); // Convert to 1-based for API
    } else {
      setClientPage(newPage);
    }
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    if (isServerSidePagination && onRowsPerPageChange) {
      onRowsPerPageChange(1, newRowsPerPage); // Reset to page 1
    } else {
      setClientRowsPerPage(newRowsPerPage);
      setClientPage(0);
    }
  };

  const renderCell = (row, val, index) => {
    switch (val) {
      case "id":
        return (
          <TableCell>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 36,
                height: 36,
                borderRadius: "50%",
                backgroundColor: "#2A2A2A",
                color: "#8CE600",
                fontWeight: "600",
              }}
            >
              {index + 1}
            </Box>
          </TableCell>
        );

      // Line 198 ke baad (default case se pehle) ye cases add karo:

      case "userInfo":
        return (
          <TableCell>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                src={row.userInfo.image}
                alt={row.userInfo.name}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "2px solid #8CE600",
                }}
              />
              <Box sx={{ textAlign: "left" }}>
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#FFFFFF",
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  {row.userInfo.name}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#B0B0B0",
                    fontWeight: 400,
                  }}
                >
                  {row.userInfo.email}
                </Typography>
              </Box>
            </Box>
          </TableCell>
        );

      // Projects specific cases
      case "name":
        return (
          <TableCell>
            <Typography
              sx={{
                fontSize: "14px",
                color: "#FFFFFF",
                fontWeight: 600,
              }}
            >
              {row[val]}
            </Typography>
          </TableCell>
        );

      case "type":
        return (
          <TableCell>
            <Chip
              label={row[val]}
              sx={{
                backgroundColor: "#2A2A2A",
                color: "#8CE600",
                fontWeight: 500,
                fontSize: "12px",
                textTransform: "uppercase",
              }}
            />
          </TableCell>
        );
      case "role_Team":
        return <TableCell>{row?.role?.role}</TableCell>;

      case "deadline":
        return (
          <TableCell>
            <Typography
              sx={{
                fontSize: "13px",
                color: "#B0B0B0",
                fontWeight: 500,
              }}
            >
              {row[val]}
            </Typography>
          </TableCell>
        );

      // Events specific cases
      case "title":
        return (
          <TableCell>
            <Typography
              sx={{
                fontSize: "14px",
                color: "#FFFFFF",
                fontWeight: 600,
              }}
            >
              {row[val]}
            </Typography>
          </TableCell>
        );

      case "location":
        return (
          <TableCell>
            <Typography
              sx={{
                fontSize: "13px",
                color: "#B0B0B0",
                fontWeight: 500,
              }}
            >
              {row[val]}
            </Typography>
          </TableCell>
        );

      // Services specific cases
      case "service":
        return (
          <TableCell>
            <Typography
              sx={{
                fontSize: "14px",
                color: "#FFFFFF",
                fontWeight: 600,
              }}
            >
              {row[val]}
            </Typography>
          </TableCell>
        );

      case "bookings":
        return (
          <TableCell>
            <Chip
              label={row[val]}
              sx={{
                backgroundColor: "#8CE600",
                color: "#000",
                fontWeight: 600,
                fontSize: "12px",
              }}
            />
          </TableCell>
        );

      case "rating":
        return (
          <TableCell>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              {[...Array(5)].map((_, starIndex) => (
                <Box
                  key={starIndex}
                  sx={{
                    width: 20,
                    height: 20,
                    color: starIndex < row.rating ? "#FFD700" : "#666666",
                    fontSize: "18px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  ★
                </Box>
              ))}
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#FFFFFF",
                  fontWeight: 600,
                  ml: 1,
                }}
              >
                ({row.rating}/5)
              </Typography>
            </Box>
          </TableCell>
        );

      case "serviceId":
        return (
          <TableCell>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              {/* Service Image */}
              <Box
                component={"img"}
                src={row.image}
                alt={row.title}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "8px",
                  border: "2px solid #8CE600",
                }}
              ></Box>

              <Box sx={{ textAlign: "left" }}>
                <Typography fontSize={12}>{row?.serviceId?.title}</Typography>
              </Box>
            </Box>
          </TableCell>
        );

      case "review":
        return (
          <TableCell>
            <Box maxWidth={"300px"}>
              <Tooltip title={row.review} arrow placement="top">
                <Typography
                  sx={{
                    fontSize: "13px",
                    color: "#FFFFFF",
                    fontWeight: 500,
                    textAlign: "left",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {row.review}
                </Typography>
              </Tooltip>
            </Box>
          </TableCell>
        );

      case "description":
        return (
          <TableCell>
            <Box maxWidth={"300px"}>
              <Tooltip title={row.description} arrow placement="top">
                <Typography
                  sx={{
                    fontSize: "13px",
                    color: "#FFFFFF",
                    fontWeight: 500,
                    textAlign: "left",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {row.description}
                </Typography>
              </Tooltip>
            </Box>
          </TableCell>
        );

      case "status":
        const getStatusColor = (status) => {
          switch (status) {
            case "Pending":
              return { bg: "#FFA500", color: "#000" };
            case "Approved":
              return { bg: "#8CE600", color: "#000" };
            case "Rejected":
              return { bg: "#FF5050", color: "#FFF" };
            case "Active":
              return { bg: "#8CE600", color: "#000" };
            default:
              return { bg: "#FF5050", color: "#FFF" };
          }
        };

        const statusColors = getStatusColor(row[val]);

        return (
          <TableCell>
            <Chip
              label={row[val]}
              sx={{
                backgroundColor: statusColors.bg,
                color: statusColors.color,
                fontWeight: 600,
                fontSize: "12px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            />
          </TableCell>
        );

      case "selectStatus":
        return (
          <TableCell>
            <Box sx={{ maxWidth: "150px" }}>
              <CustomSelect
                value={row.status}
                onChange={(e) => handleChangeStatus(e.target.value, row.id)}
                sx={{
                  backgroundColor: "#2A2A2A",
                  color: "#fff",
                  borderRadius: "10px",
                  width: "150px",
                }}
                height={"10px"}
              >
                {statusOptions.map((item, index) => (
                  <MenuItem
                    className="text-white"
                    key={index}
                    value={item.value}
                  >
                    {item.label}
                  </MenuItem>
                ))}
              </CustomSelect>
            </Box>
          </TableCell>
        );

      case "image":
        return (
          <TableCell>
            <Avatar
              src={row.image}
              alt={row.title || "Service Image"}
              sx={{
                width: 40,
                height: 40,
                borderRadius: "8px",
                border: "2px solid #333333",
              }}
            />
          </TableCell>
        );

      // Applied Forms specific cases
      case "applicantInfo":
        return (
          <TableCell>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                src={row.employPicture}
                alt={`${row.firstName} ${row.lastName}`}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  border: "2px solid #8CE600",
                }}
              />
              <Box sx={{ textAlign: "left" }}>
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#FFFFFF",
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  {row.firstName} {row.lastName}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#B0B0B0",
                    fontWeight: 400,
                  }}
                >
                  {row.idType}: {row.idNumber}
                </Typography>
                  <Typography
                    sx={{
                      fontSize: "12px",
                      color: "#B0B0B0",
                      fontWeight: 400,
                    }}
                  >
                    {row.email || "N/A"}
                  </Typography>
              </Box>
            </Box>
          </TableCell>
        );

      case "contactInfo":
        return (
          <TableCell>
            <Box sx={{ textAlign: "left" }}>
              <Typography
                sx={{
                  fontSize: "13px",
                  color: "#FFFFFF",
                  fontWeight: 500,
                  mb: 0.5,
                }}
              >
                {row.contact}
              </Typography>
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#B0B0B0",
                  fontWeight: 400,
                }}
              >
                {row.secondaryContact}
              </Typography>
            </Box>
          </TableCell>
        );

      case "education":
        return (
          <TableCell>
            <Box sx={{ textAlign: "left" }}>
              <Typography
                sx={{
                  fontSize: "13px",
                  color: "#FFFFFF",
                  fontWeight: 500,
                  mb: 0.5,
                }}
              >
                {row.higherSchool.name}
              </Typography>
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#B0B0B0",
                  fontWeight: 400,
                }}
              >
                {row.higherSchool.city}
              </Typography>
            </Box>
          </TableCell>
        );

      case "skills":
        return (
          <TableCell>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {row.skills.map((skill, index) => (
                <Box
                  key={index}
                  sx={{
                    backgroundColor: "#2A2A2A",
                    color: "#8CE600",
                    px: 1,
                    py: 0.5,
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 500,
                  }}
                >
                  {skill.skill}
                </Box>
              ))}
              {/* {row.skills.length > 2 && (
                <Box
                  sx={{
                    backgroundColor: "#333333",
                    color: "#B0B0B0",
                    px: 1,
                    py: 0.5,
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 500,
                  }}
                >
                  +{row.skills.length - 2}
                </Box>
              )} */}
            </Box>
          </TableCell>
        );

      // Proposals specific cases
      case "clientInfo":
        return (
          <TableCell>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  backgroundColor: "#2A2A2A",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #8CE600",
                }}
              >
                <Typography
                  sx={{
                    color: "#8CE600",
                    fontWeight: 600,
                    fontSize: "16px",
                  }}
                >
                  {row.fullname?.charAt(0) || "C"}
                </Typography>
              </Box>
              <Box sx={{ textAlign: "left" }}>
                <Typography
                  sx={{
                    fontSize: "14px",
                    color: "#FFFFFF",
                    fontWeight: 600,
                    mb: 0.5,
                  }}
                >
                  {row.fullname}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#B0B0B0",
                    fontWeight: 400,
                  }}
                >
                  {row.email}
                </Typography>
              </Box>
            </Box>
          </TableCell>
        );

      case "services":
        return (
          <TableCell>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {row.services?.slice(0, 2).map((service, index) => (
                <Box
                  key={index}
                  sx={{
                    backgroundColor: "#2A2A2A",
                    color: "#8CE600",
                    px: 1,
                    py: 0.5,
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 500,
                  }}
                >
                  {service}
                </Box>
              ))}
              {row.services?.length > 2 && (
                <Box
                  sx={{
                    backgroundColor: "#333333",
                    color: "#B0B0B0",
                    px: 1,
                    py: 0.5,
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: 500,
                  }}
                >
                  +{row.services.length - 2}
                </Box>
              )}
            </Box>
          </TableCell>
        );

      case "budget":
        return (
          <TableCell>
            <Typography
              sx={{
                fontSize: "14px",
                color: "#8CE600",
                fontWeight: 600,
              }}
            >
              {row.budget}
            </Typography>
          </TableCell>
        );

      case "message":
        return (
          <TableCell>
            <Box maxWidth={"300px"}>
              <Tooltip title={row.messages} arrow placement="top">
                <Typography
                  sx={{
                    fontSize: "13px",
                    color: "#FFFFFF",
                    fontWeight: 500,
                    textAlign: "left",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {row.messages}
                </Typography>
              </Tooltip>
            </Box>
          </TableCell>
        );
      case "opportunity":
        return (
          <TableCell>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {Array.isArray(row.opportunity) && row.opportunity.length > 0 ? (
                <>
                  {row.opportunity.slice(0, 2).map((opp, idx) => (
                    <Chip
                      key={opp._id || idx}
                      label={opp.title || "Opportunity"}
                      sx={{
                        backgroundColor: "#2A2A2A",
                        color: "#8CE600",
                        fontWeight: 500,
                        fontSize: "11px",
                        maxWidth: "150px",
                        "& .MuiChip-label": {
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        },
                      }}
                    />
                  ))}
                  {row.opportunity.length > 2 && (
                    <Chip
                      label={`+${row.opportunity.length - 2} more`}
                      sx={{
                        backgroundColor: "#333333",
                        color: "#B0B0B0",
                        fontWeight: 500,
                        fontSize: "11px",
                      }}
                    />
                  )}
                </>
              ) : (
                <Typography
                  sx={{
                    fontSize: "13px",
                    color: "#B0B0B0",
                    fontWeight: 400,
                  }}
                >
                  No opportunities
                </Typography>
              )}
            </Box>
          </TableCell>
        );

      case "view":
        return (
          <TableCell>
            <Box sx={{ display: "flex", justifyContent: "flex-start" }}>
              {handleViewService && (
                <CustomButton
                  variant="gradientbtn"
                  btnLabel="View"
                  handlePressBtn={() => handleViewService(row._id || row.id)}
                />
              )}
            </Box>
          </TableCell>
        );
      case "images":
        return (
          <TableCell>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CustomButton
                variant="gradientbtn"
                btnLabel={`View Media`}
                handlePressBtn={() =>
                  handleViewImages &&
                  handleViewImages(row.image || [], row.video || [])
                }
                sx={{
                  fontSize: "12px",
                  px: 2,
                  py: 0.5,
                  minWidth: "auto",
                }}
              />
            </Box>
          </TableCell>
        );

      case "viewProposal":
        return (
          <TableCell>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* View Proposal Button - Only show if handleViewProposal is provided */}
              {handleViewProposal && (
                <motion.div
                  whileHover={{
                    scale: 1.2,
                    boxShadow: "0px 0px 12px rgba(140, 230, 0, 0.7)",
                    backgroundColor: "#3A3A3A",
                    borderRadius: "50%",
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconButton
                    sx={{
                      color: "#8CE600",
                      backgroundColor: "#2A2A2A",
                      borderRadius: "50%",
                      width: 36,
                      height: 36,
                      "&:hover": {
                        backgroundColor: "#3A3A3A",
                      },
                    }}
                    onClick={() => handleViewProposal(row.id)}
                  >
                    <Eye size={18} />
                  </IconButton>
                </motion.div>
              )}
              {handleToggleStatus && (
                <CustomSwitch
                  checked={row.isActive === true ? true : false}
                  onChange={(e) => handleToggleStatus(e.target.checked, row.id)}
                  showLabel={false}
                />
              )}
            </Box>
          </TableCell>
        );

      case "actions":
        return (
          <TableCell>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-start" }}>
              {/* Edit Button */}
              {showEdit && (
                <motion.div
                  whileHover={{
                    scale: 1.2,
                    boxShadow: "0px 0px 12px rgba(140, 230, 0, 0.7)",
                    backgroundColor: "#3A3A3A",
                    borderRadius: "50%",
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconButton
                    sx={{
                      color: "#8CE600",
                      backgroundColor: "#2A2A2A",
                      borderRadius: "50%",
                      width: 36,
                      height: 36,
                      "&:hover": {
                        backgroundColor: "#3A3A3A",
                      },
                    }}
                    onClick={() => {
                      if (handleEditService && row._id) {
                        handleEditService(row._id);
                      } else if (handleEditProposal) {
                        handleEditProposal(row);
                      }
                    }}
                  >
                    <Edit size={18} />
                  </IconButton>
                </motion.div>
              )}

              {/* Delete Button */}
              {showDelete && (
                <motion.div
                  whileHover={{
                    scale: 1.2,
                    boxShadow: "0px 0px 12px rgba(255, 50, 50, 0.7)",
                    backgroundColor: "#3A3A3A",
                    borderRadius: "50%",
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IconButton
                    sx={{
                      color: "#FF5050",
                      backgroundColor: "#2A2A2A",
                      borderRadius: "50%",
                      width: 36,
                      height: 36,
                      "&:hover": {
                        backgroundColor: "#3A3A3A",
                      },
                    }}
                    onClick={() => handleDeleteService(row._id)}
                  >
                    <Trash size={18} />
                  </IconButton>
                </motion.div>
              )}
            </Box>
          </TableCell>
        );

      case "eventDate":
        const eventDate = row[val];
        let formattedDate = "-";
        if (eventDate) {
          try {
            formattedDate = moment(eventDate).format("DD/MM/YYYY");
          } catch (error) {
            formattedDate = String(eventDate);
          }
        }
        return (
          <TableCell>
            <Typography
              sx={{
                fontSize: "13px",
                color: "#B0B0B0",
                fontWeight: 500,
              }}
            >
              {formattedDate}
            </Typography>
          </TableCell>
        );

      default:
        const cellValue = row[val];
        // Handle different data types
        if (cellValue === null || cellValue === undefined) {
          return (
            <TableCell>
              <Typography
                fontSize="13px"
                sx={{ color: "#B0B0B0", fontWeight: 400, fontStyle: "italic" }}
              >
                -
              </Typography>
            </TableCell>
          );
        }

        // If it's an object or array, convert to string
        if (typeof cellValue === "object") {
          if (Array.isArray(cellValue)) {
            return (
              <TableCell>
                <Typography
                  fontSize="13px"
                  sx={{ color: "#FFFFFF", fontWeight: 500 }}
                >
                  {cellValue.length} item(s)
                </Typography>
              </TableCell>
            );
          }
          // For objects, try to get a string representation
          return (
            <TableCell>
              <Typography
                fontSize="13px"
                sx={{ color: "#FFFFFF", fontWeight: 500 }}
              >
                {JSON.stringify(cellValue)}
              </Typography>
            </TableCell>
          );
        }

        return (
          <TableCell>
            <Typography
              fontSize="13px"
              sx={{ color: "#FFFFFF", fontWeight: 500 }}
            >
              {String(cellValue)}
            </Typography>
          </TableCell>
        );
    }
  };

  if (isLoading) {
    return (
      <TableSkeleton
        headerCells={tableHeader}
        displayCells={displayRows}
        rowsCount={rowsPerPage}
        tableWidth={tableWidth}
      />
    );
  }

  return (
    <TableContainer sx={tableStyle}>
      <Table sx={{ minWidth: 800, width: tableWidth || "100%" }}>
        <TableHead>
          <TableRow>
            {tableHeader?.map((header) => (
              <TableCell key={header.id} align={header.align || "center"}>
                <Typography
                  fontWeight={700}
                  fontSize="13px"
                  sx={{
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    color: "#fff",
                  }}
                >
                  {header.title}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {/* Server-side pagination: show data as-is, client-side: slice data */}
          {(isServerSidePagination
            ? tableData
            : rowsPerPageValue > 0
            ? tableData?.slice(
                clientPage * rowsPerPageValue,
                clientPage * rowsPerPageValue + rowsPerPageValue
              )
            : tableData
          )?.map((row, index) => {
            // Calculate display index for ID column
            const displayIndex = isServerSidePagination
              ? page * rowsPerPageValue + index
              : index;

            return (
              <TableRow
                key={row._id || row.id || `row-${page}-${index}`}
                hover
                sx={{
                  backgroundColor: index % 2 === 0 ? "#1A1A1A" : "#2A2A2A",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    backgroundColor: "#333333",
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                  },
                }}
              >
                {displayRows.map((val) => renderCell(row, val, displayIndex))}
              </TableRow>
            );
          })}

          {tableData?.length === 0 && (
            <TableRow>
              <TableCell colSpan={displayRows.length} align="center">
                <Box sx={{ py: 6, textAlign: "center" }}>
                  <Typography
                    fontSize="16px"
                    fontWeight="600"
                    color="#B0B0B0"
                    mb={1}
                  >
                    No data found
                  </Typography>
                  <Typography fontSize="14px" color="#666666">
                    No data available at the moment
                  </Typography>
                </Box>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {showPagination && (
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPageValue}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Rows per page"
          sx={{
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              { fontWeight: "500", color: "#FFFFFF" },
            "& .MuiTablePagination-select, & .MuiTablePagination-selectIcon": {
              color: "#FFFFFF",
            },
            "& .MuiIconButton-root": { color: "#FFFFFF" },
          }}
        />
      )}
    </TableContainer>
  );
}
