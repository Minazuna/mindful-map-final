import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Avatar, Typography, TextField, IconButton, Button, Checkbox, Collapse } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import axios from "axios";
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
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

const UsersTable = () => {
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]); 
  const [selectedUsers, setSelectedUsers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [moodLogs, setMoodLogs] = useState({});
  const [loadingMoodLogs, setLoadingMoodLogs] = useState({});

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
    const filtered = users.filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
  setFilteredUsers(filtered);
  }, [searchTerm, users]);

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

  const fetchMoodLogs = async (userId) => {
    setLoadingMoodLogs(prev => ({ ...prev, [userId]: true }));
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/user/${userId}/moodlogs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMoodLogs(prev => ({ ...prev, [userId]: response.data }));
    } catch (error) {
      console.error("Error fetching mood logs:", error);
      toast.error("Failed to load mood logs");
    } finally {
      setLoadingMoodLogs(prev => ({ ...prev, [userId]: false }));
    }
  };

  const handleExpandClick = async (event, id) => {
    event.stopPropagation();
    
    if (expandedRowId === id) {
      setExpandedRowId(null);
    } else {
      setExpandedRowId(id);
      if (!moodLogs[id]) {
        fetchMoodLogs(id);
      }
    }
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
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Users Report", margin, lineY + 20);
      
      let currentY = lineY + 30;
    
    // Process each user and their mood logs
    filteredUsers.forEach((user, index) => {
      if (currentY > doc.internal.pageSize.getHeight() - 30) {
        doc.addPage();
        currentY = 20;
      }
      
      doc.autoTable({
        head: [["Name", "Email", "Status", "Created At"]],
        body: [[
          user.name || "N/A",
          user.email,
          user.status,
          new Date(user.createdAt).toLocaleDateString(),
        ]],
        startY: currentY,
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
      
      currentY = doc.autoTable.previous.finalY + 5;
      
      const userMoodLogs = moodLogs[user.id] || [];
      
      if (userMoodLogs.length === 0) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text("No mood logs found for this user.", margin + 10, currentY);
        currentY += 10;
      } else {
        const moodLogData = userMoodLogs.map(log => [
          new Date(log.date).toLocaleDateString(),
          log.mood,
          Array.isArray(log.activities) ? log.activities.join(', ') : log.activities,
          Array.isArray(log.social) ? log.social.join(', ') : log.social,
          Array.isArray(log.health) ? log.health.join(', ') : log.health,
          log.sleepQuality
        ]);
        
        // Add mood logs table
        doc.autoTable({
          head: [["Date", "Mood", "Activities", "Social", "Health", "Sleep Quality"]],
          body: moodLogData,
          startY: currentY,
          margin: { left: margin + 5, right: margin },
          styles: {
            fontSize: 8,
            cellPadding: 2,
            overflow: 'linebreak'
          },
          headStyles: {
            fillColor: null,
            textColor: [76, 175, 80],
            fontSize: 8,
            fontStyle: 'bold',
          },
          columnStyles: {
            0: { cellWidth: 20 },  // Date
            1: { cellWidth: 20 },  // Mood
            2: { cellWidth: 35 },  // Activities
            3: { cellWidth: 35 },  // Social
            4: { cellWidth: 35 },  // Health
            5: { cellWidth: 20 }   // Sleep Quality
          }
        });
        
        currentY = doc.autoTable.previous.finalY + 15;
      }
    });
      
      doc.save("users_report.pdf");
    }).catch(error => {
      console.error('Error loading images:', error);
    });
  };
  

  // Custom row rendering to add collapsible panel
  function CustomRow(props) {
    const { row } = props;
    const isExpanded = expandedRowId === row.id;
    const userMoodLogs = moodLogs[row.id] || [];
    const isLoading = loadingMoodLogs[row.id] || false;

    return (
      <React.Fragment>
        <TableRow {...props}>
          {props.children}
        </TableRow>
        <TableRow>
          <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Box sx={{ margin: 2, marginBottom: 4 }}>
                <Typography variant="h6" gutterBottom component="div" sx={{ fontWeight: 'bold', color: '#1565C0' }}>
                  Mood Logs
                </Typography>
                {isLoading ? (
                  <Typography variant="body2" color="text.secondary">Loading mood logs...</Typography>
                ) : userMoodLogs.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">No mood logs found for this user.</Typography>
                ) : (
                  <TableContainer component={Paper} sx={{ maxHeight: 300, overflowY: 'auto' }}>
                    <Table size="small" aria-label="mood logs">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#E3F2FD' }}>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1565C0' }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1565C0' }}>Mood</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1565C0' }}>Activities</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1565C0' }}>Social</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1565C0' }}>Health</TableCell>
                          <TableCell sx={{ fontWeight: 'bold', color: '#1565C0' }}>Sleep Quality</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {userMoodLogs.map((log, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                            <TableCell>{log.mood}</TableCell>
                            <TableCell>{Array.isArray(log.activities) ? log.activities.join(', ') : log.activities}</TableCell>
                            <TableCell>{Array.isArray(log.social) ? log.social.join(', ') : log.social}</TableCell>
                            <TableCell>{Array.isArray(log.health) ? log.health.join(', ') : log.health}</TableCell>
                            <TableCell>{log.sleepQuality}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      </React.Fragment>
    );
  }

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
                  width: 280,
                  bgcolor: "#F5F5F5",
                  borderRadius: 1,
                }}
              />

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
                  <TableCell width="80px" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Select</TableCell>
                  <TableCell width="80px" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Details</TableCell>
                  <TableCell width="80px" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Avatar</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Account Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Created At</TableCell>
                  <TableCell width="100px" sx={{ fontWeight: 'bold', color: '#4CAF50' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography>Loading users...</Typography>
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <Typography>No users found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(user => (
                    <React.Fragment key={user.id}>
                      <TableRow 
                        hover 
                        sx={{
                          borderBottom: expandedRowId === user.id ? '0' : '1px solid #E0E0E0',
                          '&:hover': { bgcolor: '#FAFAFA' }
                        }}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedUsers.includes(user.id)}
                            onChange={() => handleSelectUser(user.id)}
                            sx={{ color: '#4CAF50' }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            onClick={(event) => handleExpandClick(event, user.id)}
                            aria-label="expand row"
                          >
                            {expandedRowId === user.id ? 
                              <KeyboardArrowUpIcon /> : 
                              <KeyboardArrowDownIcon />
                            }
                          </IconButton>
                        </TableCell>
                        <TableCell>
                          <Avatar src={user.avatar} alt="User Avatar" />
                        </TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Typography
                            sx={{
                              bgcolor: user.status === "Active" ? '#E8F5E9' : '#FFEBEE',
                              color: user.status === "Active" ? '#4CAF50' : '#F44336',
                              px: 2,
                              py: 0.5,
                              borderRadius: 1,
                              display: 'inline-block'
                            }}
                          >
                            {user.status}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : "No Date Available"}
                        </TableCell>
                        <TableCell>
                          {user.isDeactivated || user.pendingDeactivation || user.status === 'Active' ? (
                            <IconButton disabled>
                              <DeleteIcon sx={{ color: "#9E9E9E" }} />
                            </IconButton>
                          ) : (
                            <IconButton onClick={() => handleAction(user.id, "softDelete", user.deactivatedAt)}>
                              <DeleteIcon sx={{ color: "#F44336" }} />
                            </IconButton>
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                          <Collapse in={expandedRowId === user.id} timeout="auto" unmountOnExit>
                            <Box sx={{ margin: 2, marginBottom: 4 }}>
                              {loadingMoodLogs[user.id] ? (
                                <Typography variant="body2" color="text.secondary">Loading mood logs...</Typography>
                              ) : moodLogs[user.id]?.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">No mood logs found for this user.</Typography>
                              ) : (
                                <TableContainer component={Paper} sx={{ maxHeight: 300, overflowY: 'auto', boxShadow: 'none' }}>
                                  <Table size="small" aria-label="mood logs">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#6ab394' }}>Date</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#6ab394' }}>Mood</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#6ab394' }}>Activities</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#6ab394' }}>Social</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#6ab394' }}>Health</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', color: '#6ab394' }}>Sleep Quality</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {moodLogs[user.id]?.map((log, index) => (
                                        <TableRow key={index} hover>
                                          <TableCell>{new Date(log.date).toLocaleDateString()}</TableCell>
                                          <TableCell>{log.mood}</TableCell>
                                          <TableCell>{Array.isArray(log.activities) ? log.activities.join(', ') : log.activities}</TableCell>
                                          <TableCell>{Array.isArray(log.social) ? log.social.join(', ') : log.social}</TableCell>
                                          <TableCell>{Array.isArray(log.health) ? log.health.join(', ') : log.health}</TableCell>
                                          <TableCell>{log.sleepQuality}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              )}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
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