import React, { useState, useEffect } from "react";
import axios from "axios";
import { formatDistanceToNowStrict } from 'date-fns';
import { 
  Box, 
  Card, 
  Typography, 
  Avatar, 
  Stack, 
  Paper, 
  TextField, 
  Button, 
  Alert, 
  Snackbar, 
  IconButton, 
  Menu, 
  MenuItem,
  Chip,
  Divider,
  CircularProgress,
  Fade,
  Tooltip,
  useMediaQuery,
  useTheme,
  CssBaseline,
  ThemeProvider,
  createTheme
} from "@mui/material";
import { 
  AccessTime, 
  MoreVert, 
  ForumOutlined, 
  CalendarToday,
  SentimentSatisfiedAlt
} from "@mui/icons-material";
import BottomNav from "../BottomNav";
import { motion } from "framer-motion";

// Create a custom theme with Nunito font
const theme = createTheme({
  typography: {
    fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 700,
    },
    body1: {
      fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    button: {
      fontFamily: '"Nunito", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap');
      `,
    },
  },
});

const ForumDiscussion = () => {
  const [todaysPrompt, setTodaysPrompt] = useState(null);
  const [pastForums, setPastForums] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedComment, setSelectedComment] = useState(null);
  const [value, setValue] = useState('forum');
  const [showEmojis, setShowEmojis] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Common emojis
  const commonEmojis = ['😊', '💭', '👍', '🙌', '💪', '🧘', '🌱', '💯', '❤️', '✨'];
  
  // Responsive design
  const muiTheme = useTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));
  
  useEffect(() => {
    const fetchUserAndPrompt = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        
        // Get user data
        const userResponse = await axios.get(`${import.meta.env.VITE_NODE_API}/api/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(userResponse.data);
        
        // Get today's prompt
        const promptResponse = await axios.get(`${import.meta.env.VITE_NODE_API}/api/todays-prompt`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Check if we have a valid prompt response with an ID
        if (promptResponse.data && promptResponse.data._id) {
          setTodaysPrompt(promptResponse.data);
          
          // Get comments/discussions for this prompt
          const forumResponse = await axios.get(`${import.meta.env.VITE_NODE_API}/api/${promptResponse.data._id}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (forumResponse.data && forumResponse.data.discussions) {
            setComments(forumResponse.data.discussions);
          }
        } else if (promptResponse.data && promptResponse.data.message) {
          // Handle case where we get a message about no prompts being available
          setTodaysPrompt(null);
          console.log(promptResponse.data.message);
        } else {
          // Handle any other case where we don't have a valid prompt
          setTodaysPrompt(null);
        }
        
        // Fetch past forums with comments
        const pastForumsResponse = await axios.get(`${import.meta.env.VITE_NODE_API}/api/past-forums`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (pastForumsResponse.data && pastForumsResponse.data.length > 0) {
          // Sort forums by createdAt in descending order (newest first)
          const sortedForums = pastForumsResponse.data.sort((a, b) => 
            new Date(b.prompt.createdAt) - new Date(a.prompt.createdAt)
          );
          setPastForums(sortedForums);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        
        // Provide more specific error messages based on the error
        if (error.response) {
          setError(`Server error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
        } else if (error.request) {
          setError("Network error. Please check your connection and try again.");
        } else {
          setError("Failed to load data. Please try refreshing the page.");
        }
        
        setLoading(false);
      }
    };
  
    fetchUserAndPrompt();
  }, []);

  const handleMenuOpen = (event, commentId) => {
    setAnchorEl(event.currentTarget);
    setSelectedComment(commentId);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedComment(null);
  };
  
  const handlePostComment = async () => {
    if (!newComment.trim() || !user || !todaysPrompt) return;
    
    try {
      const token = localStorage.getItem("token");
      
      if (!todaysPrompt._id || !todaysPrompt._id.match(/^[0-9a-fA-F]{24}$/)) {
        setSnackbar({
          open: true,
          message: 'Invalid prompt ID. Cannot post comment.',
          severity: 'error'
        });
        return;
      }
      
      // Save the comment to the forum schema
      const response = await axios.post(`${import.meta.env.VITE_NODE_API}/api/comment`, {
          promptId: todaysPrompt._id,
          content: newComment,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data && response.data.newDiscussion) {
        setComments([response.data.newDiscussion, ...comments]);
        setNewComment("");
        setSnackbar({
          open: true,
          message: 'Comment posted successfully!',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error posting comment. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleDeleteComment = async () => {
    if (!selectedComment) return;
  
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${import.meta.env.VITE_NODE_API}/api/${todaysPrompt._id}/comment/${selectedComment}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      setComments(comments.filter(comment => comment._id !== selectedComment));
      setSnackbar({ open: true, message: "Comment deleted successfully", severity: "success" });
    } catch (error) {
      console.error("Error deleting comment:", error);
      setSnackbar({ open: true, message: "Failed to delete comment", severity: "error" });
    } finally {
      handleMenuClose();
    }
  };

  const getAvatarColor = (name) => {
    const colors = ["#6fba94", "#88c4a2", "#a4ceb1", "#c0d8c0", "#dcead0"];
    const nameHash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[nameHash % colors.length];
  };

  const handleCloseSnackbar = () => {
    setSnackbar({...snackbar, open: false});
  };

  const insertEmoji = (emoji) => {
    setNewComment(prev => prev + emoji);
    setShowEmojis(false);
  };

  // Function to render comments for a forum
  const renderComments = (discussionComments) => {
    return discussionComments.length > 0 ? (
      discussionComments.map((comment, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <Box 
            sx={{ 
              display: "flex", 
              alignItems: "flex-start", 
              position: "relative",
              mb: 2
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: comment.user && comment.user.avatar 
                  ? null 
                  : getAvatarColor(comment.user?.name || "User"), 
                mr: 2,
                mt: 1.5,
                color: "white"
              }}
              src={comment.user?.avatar || null}
            >
              {comment.user?.name ? comment.user.name[0].toUpperCase() : "U"}
            </Avatar>
            <Paper
              elevation={0}
              sx={{
                p: 2,
                pl: 3,
                borderRadius: 3,
                bgcolor: "#f8f8f8",
                width: "80%",
                position: "relative",
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: -8,
                  top: 15,
                  width: 0,
                  height: 0,
                  borderTop: '8px solid transparent',
                  borderBottom: '8px solid transparent',
                  borderRight: '8px solid #f8f8f8',
                }
              }}
            >
              <Typography fontWeight="bold" sx={{ fontSize: "0.95rem" }}>
                {comment.user?.name || "Anonymous User"}
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary" 
                display="flex" 
                alignItems="center" 
                gutterBottom
                sx={{ mb: 1 }}
              >
                <AccessTime sx={{ fontSize: "0.9rem", mr: 0.5, opacity: 0.6 }} />
                {formatDistanceToNowStrict(new Date(comment.createdAt), { addSuffix: true })}
              </Typography>
              <Typography variant="body1" sx={{ fontSize: "0.95rem", lineHeight: 1.5 }}>
                {comment.content}
              </Typography>
            </Paper>
    
            {/* Show delete menu only for user's own comments */}
            {user && comment.user?._id === user._id && (
              <>
                <IconButton
                  size="small"
                  sx={{ position: "absolute", right: 10, top: 5 }}
                  onClick={(event) => handleMenuOpen(event, comment._id)}
                >
                  <MoreVert fontSize="small" />
                </IconButton>
                <Menu 
                  anchorEl={anchorEl} 
                  open={Boolean(anchorEl) && selectedComment === comment._id} 
                  onClose={handleMenuClose}
                >
                  <MenuItem onClick={handleDeleteComment}>Delete</MenuItem>
                </Menu>
              </>
            )}
          </Box>
        </motion.div>
      ))
    ) : (
      <Box sx={{ py: 4, textAlign: "center" }}>
        <ForumOutlined sx={{ fontSize: 40, color: "#6fba94", opacity: 0.4, mb: 2 }} />
        <Typography color="text.secondary">
          No comments yet. Be the first to share your thoughts!
        </Typography>
      </Box>
    );
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            bgcolor: "#b4ddc8",
            fontFamily: "Nunito, sans-serif",
          }}
        >
          <CircularProgress sx={{ color: "#4e8067", mb: 2 }} />
          <Typography fontWeight="medium" color="#4e8067">
            Loading discussion...
          </Typography>
        </Box>
      </ThemeProvider>
    );
  }

  if (error) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            bgcolor: "#b4ddc8",
            p: 3,
            fontFamily: "Nunito, sans-serif",
          }}
        >
          <Alert severity="error" sx={{ width: "100%", maxWidth: "650px" }}>
            {error}
          </Alert>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "100vh",
          bgcolor: "#b4ddc8", 
          pb: 10, // Space for bottom nav
          fontFamily: "Nunito, sans-serif",
        }}
      >
        {/* Header */}
        <Box
          sx={{
            width: "100%",
            backgroundColor: "white",
            p: 2,
            mb: 3,
            boxShadow: "0px 2px 4px rgba(0,0,0,0.05)",
            display: "flex",
            justifyContent: "center"
          }}
        >
          <Typography 
            variant="h5" 
            fontWeight="bold" 
            sx={{ 
              color: "#4e8067",
              display: "flex",
              alignItems: "center",
              fontFamily: "Nunito, sans-serif",
            }}
          >
            <ForumOutlined sx={{ mr: 1 }} /> 
            Community Discussion
          </Typography>
        </Box>
        
        <Box 
          sx={{ 
            width: "100%", 
            maxWidth: isMobile ? "95%" : "750px", 
            px: 2 
          }}
        >
          {/* Today's Forum */}
          {todaysPrompt && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card 
                sx={{ 
                  p: 3, 
                  borderRadius: 4, 
                  boxShadow: 2, 
                  mb: 4,
                  border: "1px solid rgba(0,0,0,0.05)"
                }}
              >
                {/* Prompt Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Chip
                    icon={<CalendarToday fontSize="small" />}
                    label={`TODAY, ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
                    size="small"
                    sx={{ 
                      bgcolor: "#e9f5ef", 
                      color: "#4e8067", 
                      fontWeight: 500, 
                      mb: 1,
                      px: 1,
                      fontFamily: "Nunito, sans-serif",
                    }}
                  />
                  
                  <Chip
                    label={`${comments.length} ${comments.length === 1 ? 'comment' : 'comments'}`}
                    size="small"
                    sx={{ 
                      bgcolor: "#f0f0f0", 
                      fontWeight: 500, 
                      mb: 1,
                      fontFamily: "Nunito, sans-serif",
                    }}
                  />
                </Box>
                
                <Typography 
                  variant="h5" 
                  fontWeight="bold" 
                  gutterBottom
                  sx={{ 
                    color: "#2d5340",
                    mb: 2,
                    fontSize: isMobile ? "1.2rem" : "1.5rem",
                    fontFamily: "Nunito, sans-serif",
                  }}
                >
                  {todaysPrompt.question}
                </Typography>

                <Divider sx={{ my: 2, borderColor: "rgba(0,0,0,0.08)" }} />

                {/* Comments Section */}
                <Box 
                  sx={{ 
                    maxHeight: "350px",  
                    overflowY: "auto", 
                    pr: 1,
                    pb: 2,
                    // Scrollbar styling
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                      borderRadius: "10px",
                      backgroundColor: "#f1f1f1"
                    },
                    "&::-webkit-scrollbar-thumb": {
                      borderRadius: "10px",
                      backgroundColor: "#c1c1c1"
                    }
                  }}
                >
                  <Stack spacing={0.5}>
                    {renderComments(comments)}
                  </Stack>
                </Box>

                {/* Comment Input Section */}
                <Box sx={{ mt: 2, position: "relative" }}>
                  <TextField
                    fullWidth
                    multiline
                    maxRows={3}
                    variant="outlined"
                    size="medium"
                    placeholder="Share your thoughts on today's prompt..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        backgroundColor: "#f8f8f8",
                        fontFamily: "Nunito, sans-serif",
                      },
                      "& .MuiInputBase-input": {
                        fontFamily: "Nunito, sans-serif",
                      }
                    }}
                  />
                  
                  <Box sx={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    mt: 2 
                  }}>
                    <Tooltip title="Add emoji">
                      <IconButton 
                        onClick={() => setShowEmojis(!showEmojis)} 
                        size="small" 
                        sx={{ color: "#6fba94" }}
                      >
                        <SentimentSatisfiedAlt />
                      </IconButton>
                    </Tooltip>
                    
                    <Button
                      variant="contained"
                      onClick={handlePostComment}
                      disabled={!newComment.trim()}
                      sx={{
                        textTransform: "none",
                        borderRadius: 3,
                        px: 3,
                        py: 1,
                        fontWeight: "bold",
                        bgcolor: "#6fba94",
                        fontFamily: "Nunito, sans-serif",
                        "&:hover": {
                          bgcolor: "#4e8067"
                        }
                      }}
                    >
                      Post Comment
                    </Button>
                  </Box>
                  
                  {/* Emoji picker */}
                  <Fade in={showEmojis}>
                    <Paper 
                      elevation={3}
                      sx={{
                        display: showEmojis ? 'flex' : 'none',
                        position: 'absolute',
                        bottom: 60,
                        left: 0,
                        zIndex: 10,
                        p: 1,
                        borderRadius: 2,
                        flexWrap: 'wrap',
                        width: 'auto',
                        maxWidth: '280px'
                      }}
                    >
                      {commonEmojis.map(emoji => (
                        <IconButton
                          key={emoji}
                          size="small"
                          onClick={() => insertEmoji(emoji)}
                          sx={{ 
                            m: 0.5,
                            fontSize: '1.2rem'
                          }}
                        >
                          {emoji}
                        </IconButton>
                      ))}
                    </Paper>
                  </Fade>
                </Box>
              </Card>
            </motion.div>
          )}
        
          {/* Information message when no prompt is available */}
          {!todaysPrompt && pastForums.length > 0 && (
            <Alert 
              severity="info" 
              variant="outlined"
              sx={{ 
                width: "100%", 
                mb: 4,
                borderRadius: 2,
                "& .MuiAlert-message": {
                  fontFamily: "Nunito, sans-serif",
                }
              }}
            >
              No new prompt is available for today. You can view past discussions below.
            </Alert>
          )}
        
          {/* Past Forums */}
          {pastForums.map((forum, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
            >
              <Card 
                sx={{ 
                  p: 3, 
                  borderRadius: 4, 
                  boxShadow: 1, 
                  mb: 4,
                  border: "1px solid rgba(0,0,0,0.05)",
                  bgcolor: "#fcfcfc"
                }}
              >
                {/* Prompt Header */}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                  <Chip
                    icon={<CalendarToday fontSize="small" />}
                    label={new Date(forum.prompt.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    size="small"
                    sx={{ 
                      bgcolor: "#eaf0ec", 
                      color: "#6fba94", 
                      fontWeight: 500, 
                      mb: 1,
                      px: 1,
                      fontFamily: "Nunito, sans-serif",
                    }}
                  />
                  
                  <Chip
                    label={`${forum.discussions?.length || 0} ${forum.discussions?.length === 1 ? 'comment' : 'comments'}`}
                    size="small"
                    sx={{ 
                      bgcolor: "#f0f0f0", 
                      fontWeight: 500, 
                      mb: 1,
                      fontFamily: "Nunito, sans-serif",
                    }}
                  />
                </Box>
                
                <Typography 
                  variant="h5" 
                  fontWeight="bold" 
                  sx={{ 
                    color: "#2d5340",
                    mb: 2,
                    fontSize: isMobile ? "1.2rem" : "1.5rem",
                    fontFamily: "Nunito, sans-serif",
                  }}
                >
                  {forum.prompt?.question || "Past prompt"}
                </Typography>

                <Divider sx={{ my: 2, borderColor: "rgba(0,0,0,0.08)" }} />

                {/* Comments Section */}
                <Box 
                  sx={{ 
                    maxHeight: "300px",  
                    overflowY: "auto", 
                    pr: 1,
                    // Scrollbar styling
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                      borderRadius: "10px",
                      backgroundColor: "#f1f1f1"
                    },
                    "&::-webkit-scrollbar-thumb": {
                      borderRadius: "10px",
                      backgroundColor: "#c1c1c1"
                    }
                  }}
                >
                  <Stack spacing={0.5}>
                    {renderComments(forum.discussions || [])}
                  </Stack>
                </Box>
              </Card>
            </motion.div>
          ))}
        </Box>
        
        {/* Feedback Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={5000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          sx={{ mb: 7 }} // Leave space for bottom nav
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity={snackbar.severity} 
            variant="filled"
            sx={{ 
              width: '100%',
              borderRadius: 2,
              fontFamily: "Nunito, sans-serif",
            }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
        
        <BottomNav value={value} setValue={setValue} />
      </Box>
    </ThemeProvider>
  );
};

export default ForumDiscussion;