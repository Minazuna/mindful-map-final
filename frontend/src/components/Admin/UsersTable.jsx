import React, { useEffect, useState } from "react";
import { Box, Avatar, Typography, TextField, IconButton, Button, Checkbox, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import DeleteIcon from '@mui/icons-material/Delete';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Navbar from './Navbar';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

const UsersTable = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]); 
  const [selectedUsers, setSelectedUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");

   const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("API Response:", response.data); 
      setUsers(response.data);
      setFilteredUsers(response.data); 
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) => {
      const matchesSearch = (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
                           (user.section && user.section.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesSection = sectionFilter === "" || 
                            (sectionFilter === "Not Assigned" && (!user.section || user.section === "Not Assigned")) ||
                            (user.section && user.section === sectionFilter);
      
      return matchesSearch && matchesSection;
    });
    
    setFilteredUsers(filtered);
  }, [searchTerm, sectionFilter, users]);

  const getUniqueSections = () => {
    const sections = users.map(user => user.section || "Not Assigned");
    return ["", ...new Set(sections)].sort();
  };

  const handleSelectUser = (id) => {
    setSelectedUsers((prevSelected) => 
      prevSelected.includes(id) ? prevSelected.filter((userId) => userId !== id) : [...prevSelected, id]
    );
  };

  const handleBulkDelete = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${import.meta.env.VITE_NODE_API}/api/admin/bulk-delete`, { ids: selectedUsers }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          selectedUsers.includes(user.id) ? { ...user, isDeactivated: true } : user
        )
      );
      setSelectedUsers([]); 
    } catch (error) {
      console.error("Error during bulk delete:", error);
    }
  };

  const handleAction = async (userId, action, deactivatedAt) => {
    try {
      const token = localStorage.getItem("token");

      const user = users.find(u => u.id === userId);
      if (user && (user.isDeactivated || user.pendingDeactivation)) {
        toast.warning("This user is already pending deactivation or deactivated.");
        return; // Exit the function early
      }

      if (action === "softDelete") {
        const response = await axios.post(
          `${import.meta.env.VITE_NODE_API}/api/admin/soft-delete`, 
          { userId },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setUsers(users.map(user =>
          user.id === userId ? { 
            ...user, 
            isDeactivated: true, 
            pendingDeactivation: true,
            deactivatedAt: response.data.deactivatedAt,
            deactivateAt: response.data.deactivateAt
          } : user
        ));
  
        toast.success("User deactivation initiated. Will be completed in 24 hours.");
      }
    } catch (error) {
      console.error(`Error during ${action}:`, error);
      toast.error(error.response?.data?.message || `Error during ${action}. Please try again.`);
    }
  };

  const handleViewLogs = (userId) => {
    navigate(`/admin/student-logs/${userId}`);
  };

  const handleDownloadStudentLogs = async (user) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/user/${user.id}/moodlogs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.length > 0) {
        generateStudentLogsPDF(user, response.data);
      } else {
        toast.info("No mood logs found for this student.");
      }
    } catch (error) {
      console.error("Error downloading student logs:", error);
      toast.error("Failed to download student logs");
    }
  };

  const generateStudentLogsPDF = (user, logs) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    
    // Professional Header with Date and Time
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('MINDFUL MAP', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Mood Logs Report', pageWidth / 2, 35, { align: 'center' });
    
    // Date and Time
    const now = new Date();
    const dateTime = `Generated: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(dateTime, pageWidth - margin, 15, { align: 'right' });
    
    // Line separator
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 0, 0);
    doc.line(margin, 45, pageWidth - margin, 45);
    
    // Professional Student Information Layout
    const leftColX = margin;
    const rightColX = pageWidth / 2 + 10;
    const startY = 60;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Information', leftColX, startY);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Name: ${user.name}`, leftColX, startY + 15);
    doc.text(`Email: ${user.email}`, leftColX, startY + 25);
    
    doc.text(`Section: ${user.section || 'Not Assigned'}`, rightColX, startY + 15);
    doc.text(`Total Logs: ${logs.length}`, rightColX, startY + 25);

    if (logs.length === 0) {
      doc.setFontSize(12);
      doc.text('No mood logs found for this student.', margin, startY + 50);
    } else {
      // Table data with date and time
      const tableData = logs.map(log => {
        const logDate = new Date(log.date);
        const dateTimeStr = `${logDate.toLocaleDateString()} ${logDate.toLocaleTimeString()}`;
        return [
          dateTimeStr,
          log.category || 'N/A',
          log.category === 'sleep' ? `${log.hrs} hours` : log.activity || 'N/A',
          log.beforeValence || 'N/A',
          log.beforeEmotion || 'N/A',
          log.beforeIntensity || 'N/A',
          log.afterValence || 'N/A',
          log.afterEmotion || 'N/A',
          log.afterIntensity || 'N/A'
        ];
      });

      doc.autoTable({
        head: [['Date & Time', 'Category', 'Activity', 'Before Valence', 'Before Emotion', 'Before Intensity', 'After Valence', 'After Emotion', 'After Intensity']],
        body: tableData,
        startY: startY + 40,
        margin: { left: 10, right: 10 },
        styles: { 
          fontSize: 7,
          cellPadding: 2
        },
        headStyles: { 
          fillColor: [76, 175, 80],
          textColor: 255,
          fontSize: 8,
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 20 },
          2: { cellWidth: 28 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 18 },
          6: { cellWidth: 20 },
          7: { cellWidth: 20 },
          8: { cellWidth: 18 }
        }
      });
    }

    // Save the PDF
    doc.save(`${user.name.replace(/\s+/g, '_')}_mood_logs.pdf`);
    toast.success('Student logs downloaded successfully!');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const logoWidth = 25; 
    const logoHeight = 25;
    const margin = 15;
    const lineY = 42;  // Adjusted line position
    
    const tupLogo = new Image();
    const rightLogo = new Image();
    tupLogo.src = '/images/tup.png';
    rightLogo.src = '/images/logo.png';
    
    Promise.all([
      new Promise((resolve, reject) => {
        tupLogo.onload = resolve;
        tupLogo.onerror = reject;
      }),
      new Promise((resolve, reject) => {
        rightLogo.onload = resolve;
        rightLogo.onerror = reject;
      })
    ]).then(() => {
      doc.addImage(tupLogo, 'PNG', margin, 10, logoWidth, logoHeight);
      
      const rightLogoX = pageWidth - margin - logoWidth;
      doc.addImage(rightLogo, 'PNG', rightLogoX, 10, logoWidth, logoHeight);
      
      const textStart = margin + logoWidth + 10;
      const textWidth = rightLogoX - textStart;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const universityName = "TECHNOLOGICAL UNIVERSITY OF THE PHILIPPINES-TAGUIG";
      const universityX = textStart + (textWidth - doc.getTextWidth(universityName)) / 2 - 5;
      doc.text(universityName, universityX, 20);
      
      doc.setFontSize(11);
      const program = "BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY";
      const programX = textStart + (textWidth - doc.getTextWidth(program)) / 2 - 5;
      doc.text(program, programX, 27);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const address = "Km. 14 East Service Road, Western Bicutan, Taguig City 1630, Metro Manila, Philippines";
      const addressX = textStart + (textWidth - doc.getTextWidth(address)) / 2 - 5;
      doc.text(address, addressX, 34);
      
      // Horizontal line
      doc.setLineWidth(0.6);
      doc.setDrawColor(100, 179, 138);  
      doc.line(35, lineY, pageWidth - 35, lineY);
      
      // Date and Time
      const now = new Date();
      const dateTime = `Generated: ${now.toLocaleDateString()} at ${now.toLocaleTimeString()}`;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(dateTime, pageWidth - margin, lineY - 5, { align: 'right' });
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Users Report", margin, lineY + 20);
      
      // Create users table data
      const usersData = filteredUsers.map(user => [
        user.name || "N/A",
        user.email,
        user.section || "Not Assigned",
        user.status,
        new Date(user.createdAt).toLocaleDateString(),
      ]);

      doc.autoTable({
        head: [["Name", "Email", "Section", "Status", "Created At"]],
        body: usersData,
        startY: lineY + 30,
        margin: { left: margin, right: margin },
        styles: {
          fontSize: 9,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [100, 179, 138],
          textColor: 255,
          fontSize: 10,
          fontStyle: 'bold',
        },
      });
      
      doc.save("users_report.pdf");
    }).catch(error => {
      console.error('Error loading images:', error);
    });
  };
  



  const columns = [
    {
      field: "checkbox",
      headerName: "Select",
      width: 80,
      renderCell: (params) => (
        <Checkbox
          checked={selectedUsers.includes(params.row.id)}
          onChange={() => handleSelectUser(params.row.id)}
          sx={{ color: '#4CAF50' }}
        />
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "expand",
      headerName: "Details",
      width: 80,
      renderCell: (params) => (
        <IconButton 
          onClick={(event) => handleExpandClick(event, params.row.id)}
          aria-label="expand row"
        >
          {expandedRowId === params.row.id ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "avatar",
      headerName: "Avatar",
      width: 100,
      renderCell: (params) => (
        <Avatar src={params.value} alt="User Avatar" />
      ),
      sortable: false,
      filterable: false,
    },
    {
      field: "name", 
      headerName: "Name",
      flex: 1,
    },
    {
      field: "email",
      headerName: "Email", 
      flex: 1,
    },
    {
      field: "section",
      headerName: "Section",
      flex: 1,
      renderCell: (params) => (
        <Typography
          sx={{
            bgcolor: params.value === "Not Assigned" ? '#FFF3E0' : '#E3F2FD',
            color: params.value === "Not Assigned" ? '#FF9800' : '#1976D2',
            px: 2,
            py: 0.5,
            borderRadius: 1,
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => (
        <Typography
          sx={{
            bgcolor: params.value === "Active" ? '#E8F5E9' : '#FFEBEE',
            color: params.value === "Active" ? '#4CAF50' : '#F44336',
            px: 2,
            py: 0.5,
            borderRadius: 1,
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "createdAt",
      headerName: "Created At",
      flex: 1,
      renderCell: (params) => {
        if (!params.value) return "No Date Available";
        try {
          return new Date(params.value).toISOString().slice(0, 10);
        } catch (error) {
          return "Invalid Date";
        }
      }
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      renderCell: (params) => {
        const { id, isDeactivated, pendingDeactivation, deactivatedAt } = params.row;
        return (
          isDeactivated || pendingDeactivation ? (
            <IconButton disabled>
              <DeleteIcon sx={{ color: "#9E9E9E" }} />
            </IconButton>
          ) : (
            <IconButton onClick={() => handleAction(id, "softDelete", deactivatedAt)}>
              <DeleteIcon sx={{ color: "#F44336" }} />
            </IconButton>
          )
        );
      },
    }
   ];
   
   return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F8FAF9" }}>
      {/* Sidebar */}
      <Box sx={{ width: 240, flexShrink: 0 }}>
        <Navbar />
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          justifyContent: "center", 
          alignItems: "center",       
          minHeight: "100vh", 
          py: 3,
          bgcolor: "#F8FAF9",
        }}
      >
        {/* Table Container */}
        <Box
          sx={{
            width: "100%", 
            maxWidth: "1100px", 
            bgcolor: "white",
            p: 4,
            borderRadius: 2,
            boxShadow: 3,
            margin: "0 auto", 
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
              Users
            </Typography>

            {/* Controls */}
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                placeholder="Search..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  width: 200,
                  bgcolor: "#F5F5F5",
                  borderRadius: 1,
                }}
              />

              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Section</InputLabel>
                <Select
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  label="Section"
                  sx={{
                    bgcolor: "#F5F5F5",
                    borderRadius: 1,
                  }}
                >
                  <MenuItem value="">All Sections</MenuItem>
                  {getUniqueSections().slice(1).map((section) => (
                    <MenuItem key={section} value={section}>
                      {section}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={handleBulkDelete}
                disabled={selectedUsers.length === 0}
                sx={{
                  bgcolor: selectedUsers.length > 0 ? "#F44336" : "#D32F2F",
                  fontSize: "0.875rem",
                  px: 3,
                }}
              >
                BULK DELETE
              </Button>

              <IconButton onClick={exportPDF} sx={{ color: "#1976D2" }}>
                <FileDownloadIcon />
              </IconButton>
            </Box>
          </Box>

          {/* Custom Table Implementation */}
          <TableContainer component={Paper} sx={{ boxShadow: 'none' }}>
            <Table aria-label="collapsible table">
              <TableHead>
                <TableRow>
                  <TableCell width="80px" sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '0.875rem' }}>Select</TableCell>
                  <TableCell width="80px" sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '0.875rem' }}>Avatar</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '0.875rem' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '0.875rem' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '0.875rem' }}>Section</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '0.875rem' }}>Account Status</TableCell>
                  <TableCell width="120px" sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '0.875rem' }}>Created At</TableCell>
                  <TableCell width="180px" sx={{ fontWeight: 'bold', color: '#4CAF50', fontSize: '0.875rem' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ fontSize: '0.875rem' }}>
                      <Typography sx={{ fontSize: '0.875rem' }}>Loading users...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ fontSize: '0.875rem' }}>
                      <Typography sx={{ fontSize: '0.875rem' }}>No users found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(user => (
                    <TableRow 
                      key={user.id}
                      hover 
                      sx={{ '&:hover': { bgcolor: '#FAFAFA' } }}
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => handleSelectUser(user.id)}
                          sx={{ color: '#4CAF50' }}
                        />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        <Avatar src={user.avatar} alt="User Avatar" />
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>{user.name}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>{user.email}</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        <Typography
                          sx={{
                            bgcolor: user.section === "Not Assigned" ? '#FFF3E0' : '#E3F2FD',
                            color: user.section === "Not Assigned" ? '#FF9800' : '#1976D2',
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            display: 'inline-block',
                            fontSize: '0.875rem'
                          }}
                        >
                          {user.section || 'Not Assigned'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        <Typography
                          sx={{
                            bgcolor: user.status === "Active" ? '#E8F5E9' : '#FFEBEE',
                            color: user.status === "Active" ? '#4CAF50' : '#F44336',
                            px: 2,
                            py: 0.5,
                            borderRadius: 1,
                            display: 'inline-block',
                            fontSize: '0.875rem'
                          }}
                        >
                          {user.status}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : "No Date Available"}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <IconButton 
                            onClick={() => handleViewLogs(user.id)}
                            size="small"
                            sx={{ color: "#1976D2" }}
                            title="View Logs"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton 
                            onClick={() => handleDownloadStudentLogs(user)}
                            size="small"
                            sx={{ color: "#4CAF50" }}
                            title="Download Logs"
                          >
                            <DownloadIcon />
                          </IconButton>
                          {user.isDeactivated || user.pendingDeactivation ? (
                            <IconButton disabled size="small">
                              <DeleteIcon sx={{ color: "#9E9E9E" }} />
                            </IconButton>
                          ) : (
                            <IconButton 
                              onClick={() => handleAction(user.id, "softDelete", user.deactivatedAt)}
                              size="small"
                            >
                              <DeleteIcon sx={{ color: "#F44336" }} />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
   );
};

export default UsersTable;