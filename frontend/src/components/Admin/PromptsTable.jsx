import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import { Box, Typography, TextField, IconButton, Button, Modal, Paper } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import DeleteIcon from "@mui/icons-material/Delete";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import Navbar from "./Navbar";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PromptsTable = () => {
  const theme = useTheme();
  const [prompts, setPrompts] = useState([]);
  const [filteredPrompts, setFilteredPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState("");

  const fetchPrompts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/admin/prompts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrompts(response.data);
      setFilteredPrompts(response.data);
    } catch (error) {
      console.error("Error fetching prompts:", error);
    }
  };
  
  useEffect(() => {
    fetchPrompts();
  }, []);

  useEffect(() => {
    const filtered = prompts.filter((prompt) =>
      prompt.question.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPrompts(filtered);
  }, [searchTerm, prompts]);

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(`${import.meta.env.VITE_NODE_API}/api/admin/${id}`, { // FIXED TEMPLATE LITERAL
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setPrompts(prompts.filter((prompt) => prompt._id !== id)); // FIXED `_id` instead of `id`
    } catch (error) {
      console.error("Error deleting prompt:", error);
    }
  }; 

  const handleAddPrompt = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${import.meta.env.VITE_NODE_API}/api/admin/add-prompt`, { question: newPrompt }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPrompts([...prompts, response.data]);
      setModalOpen(false);
      setNewPrompt(""); 
      
      fetchPrompts(); // Refresh
    } catch (error) {
      if (error.response && error.response.data.code === 11000) {
        toast.error("This prompt already exists!");
      } else {
        console.error("Error adding prompt:", error);
      }
    }
  };

  const columns = [
    { 
      field: "question", 
      headerName: "Question", 
      flex: 3, 
      renderCell: (params) => (
        <Typography
          sx={{
            color: params.row.isUsed ? "#BDBDBD" : "#000",
            fontStyle: params.row.isUsed ? "italic" : "normal",
            fontFamily: 'Nunito', // Added fontFamily
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: "isUsed",
      headerName: "Status",
      flex: 1,
      renderCell: (params) => (
        <Typography
          sx={{
            bgcolor: params.value ? "#E8F5E9" : "#FFEBEE",
            color: params.value ? "#4CAF50" : "#F44336",
            px: 2,
            py: 0.5,
            borderRadius: 1,
            fontFamily: 'Nunito', // Added fontFamily
          }}
        >
          {params.value ? "Used" : "Not Used"}
        </Typography>
      ),
    },
    {
      field: "createdBy",
      headerName: "Created By",
      flex: 1,
      renderCell: (params) => (
        <Typography sx={{ fontFamily: 'Nunito' }}> {/* Added fontFamily */}
          {params.value ? params.value.name : "Unknown"}
        </Typography>
      ),
    },
    {
      field: "createdAt",
      headerName: "Selected At",
      flex: 1,
      renderCell: (params) => (
        <Typography sx={{ color: "#757575", fontFamily: 'Nunito' }}> {/* Added fontFamily */}
          {new Date(params.value).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 100,
      renderCell: (params) => (
        <Box>
          <IconButton 
            onClick={() => handleDelete(params.row._id)} 
            disabled={params.row.isUsed}
          >
            <DeleteIcon sx={{ color: params.row.isUsed ? "#BDBDBD" : "#F44336" }} />
          </IconButton>
        </Box>
      ),
    },
  ];  

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "#F8FAF9" }}>
      <Box sx={{ width: 240, flexShrink: 0 }}>
        <Navbar />
      </Box>

      <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", py: 3, bgcolor: "#F8FAF9" }}>
        <Box sx={{ width: "100%", maxWidth: "1100px", bgcolor: "white", p: 4, borderRadius: 2, boxShadow: 3, margin: "0 auto" }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333", fontFamily: 'Nunito' }}>
              Forum Prompts
            </Typography>
            <Box display="flex" gap={2} alignItems="center">
              <TextField
                placeholder="Search..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ width: 280, bgcolor: "#F5F5F5", borderRadius: 1, fontFamily: 'Nunito' }}
                InputProps={{
                  style: { fontFamily: 'Nunito' }, // Added fontFamily
                }}
              />
              <Button variant="contained" color="primary" onClick={() => setModalOpen(true)} sx={{ fontFamily: 'Nunito' }}>
                Add New
              </Button>
            </Box>
          </Box>

          <DataGrid
            rows={filteredPrompts}
            columns={columns}
            getRowId={(row) => row._id}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            autoHeight
            disableSelectionOnClick
            sx={{ 
              border: "none", 
              "& .MuiDataGrid-columnHeaders": { bgcolor: "#E3F2FD", fontWeight: "bold", color: "#1565C0", fontFamily: 'Nunito' }, // Added fontFamily
              "& .MuiDataGrid-footerContainer": { fontFamily: 'Nunito' }, // Added fontFamily
            }}
          />

          {selectedPrompt && (
            <Box mt={3} p={2} bgcolor="#FFF3E0" borderRadius={2}>
              <Typography variant="h6" sx={{ fontFamily: 'Nunito' }}>Prompt of the Day:</Typography>
              <Typography variant="body1" sx={{ fontFamily: 'Nunito' }}>{selectedPrompt.question}</Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Paper sx={{ width: 400, p: 4, mx: "auto", mt: 10 }}>
          <Typography variant="h6" sx={{ fontFamily: 'Nunito' }}>Add New Prompt</Typography>
          <TextField 
            fullWidth 
            value={newPrompt} 
            onChange={(e) => setNewPrompt(e.target.value)} 
            placeholder="Enter prompt question" 
            sx={{ my: 2, fontFamily: 'Nunito' }}
            InputProps={{
              style: { fontFamily: 'Nunito' }, // Added fontFamily
            }}
          />
          <Button variant="contained" fullWidth onClick={handleAddPrompt} sx={{ fontFamily: 'Nunito' }}>
            Submit
          </Button>
        </Paper>
      </Modal>
    </Box>
  );
};

export default PromptsTable;