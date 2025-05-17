import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SearchIcon from '@mui/icons-material/Search';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import GridViewIcon from '@mui/icons-material/GridView';
import ViewListIcon from '@mui/icons-material/ViewList';
import CloseIcon from '@mui/icons-material/Close';
import BottomNav from '../../BottomNav';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { motion } from 'framer-motion';

// Daily inspirational quotes
const dailyQuotes = [
  {
    quote: "Gratitude turns what we have into enough.",
    author: "Anonymous"
  },
  {
    quote: "Self-love is not selfish; it is necessary.",
    author: "Oscar Wilde"
  },
  {
    quote: "Happiness is not something ready-made. It comes from your own actions.",
    author: "Dalai Lama"
  },
  {
    quote: "The best and most beautiful things in the world cannot be seen or even touched - they must be felt with the heart.",
    author: "Helen Keller"
  },
  {
    quote: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
    author: "Nelson Mandela"
  },
  {
    quote: "Friendship is born at that moment when one person says to another, 'What! You too? I thought I was the only one.'",
    author: "C.S. Lewis"
  },
  {
    quote: "Family is not an important thing. It's everything.",
    author: "Michael J. Fox"
  },
  {
    quote: "To love oneself is the beginning of a lifelong romance.",
    author: "Oscar Wilde"
  },
  {
    quote: "The purpose of our lives is to be happy.",
    author: "Dalai Lama"
  },
  {
    quote: "We must be willing to let go of the life we planned so as to have the life that is waiting for us.",
    author: "Joseph Campbell"
  },
  {
    quote: "The best way to find yourself is to lose yourself in the service of others.",
    author: "Mahatma Gandhi"
  },
  {
    quote: "Small acts, when multiplied by millions of people, can transform the world.",
    author: "Howard Zinn"
  },
  {
    quote: "The most beautiful things in life are felt with the heart.",
    author: "Antoine de Saint-Exupéry"
  },
  {
    quote: "Be the reason someone smiles today.",
    author: "Anonymous"
  },
  {
    quote: "Every day may not be good, but there's something good in every day.",
    author: "Alice Morse Earle"
  },
];

const JournalLogs = () => {
  const [journalEntries, setJournalEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [entriesForCurrentMonth, setEntriesForCurrentMonth] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [challengesAnchorEl, setChallengesAnchorEl] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDailyQuote, setShowDailyQuote] = useState(false);
  const [todaysQuote, setTodaysQuote] = useState(null);
  const navigate = useNavigate();

  // Function to get today's date as a string for storage
  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  // Function to determine if a daily quote should be shown
  const shouldShowDailyQuote = (entries) => {
    const today = getTodayString();
    const lastQuoteDay = localStorage.getItem('lastQuoteDay');
    
    // Check if we've shown a quote today already
    if (lastQuoteDay === today) {
      return false;
    }
    
    // Check if there's an entry for today already
    const hasLoggedToday = entries.some(entry => {
      const entryDate = new Date(entry.date);
      const entryDateString = `${entryDate.getFullYear()}-${entryDate.getMonth() + 1}-${entryDate.getDate()}`;
      return entryDateString === today;
    });
    
    return !hasLoggedToday;
  };

  // Select a quote based on the day of the year
  const selectDailyQuote = () => {
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const quoteIndex = dayOfYear % dailyQuotes.length;
    return dailyQuotes[quoteIndex];
  };

  // Fetch journal entries
  useEffect(() => {
    const fetchJournalEntries = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/journals`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        const entries = response.data;
        setJournalEntries(entries);
        
        const filtered = filterEntriesByMonth(entries, currentDate);
        setEntriesForCurrentMonth(filtered);
        setFilteredEntries(filtered);
        
        // Check if we should show the daily quote modal
        if (shouldShowDailyQuote(entries)) {
          setTodaysQuote(selectDailyQuote());
          setShowDailyQuote(true);
        }
      } catch (error) {
        console.error('Error fetching journal entries:', error);
        toast.error('Failed to load journal entries.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchJournalEntries();
  }, [currentDate]);

  // Handle closing the daily quote modal
  const handleCloseQuote = () => {
    setShowDailyQuote(false);
    localStorage.setItem('lastQuoteDay', getTodayString());
  };

  // Handle search within the current month entries
  useEffect(() => {
    if (searchTerm.trim() === '') {
      // If search is cleared, show all entries for current month
      setFilteredEntries(entriesForCurrentMonth);
    } else {
      // Filter from the current month entries only
      const searched = entriesForCurrentMonth.filter(entry => {
        return (
          (entry.challenge?.title && entry.challenge.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (entry.challenge?.description && entry.challenge.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (entry.challengeData && Object.values(entry.challengeData).some(text => 
            text.toLowerCase().includes(searchTerm.toLowerCase())
          ))
        );
      });
      setFilteredEntries(searched);
    }
  }, [searchTerm, entriesForCurrentMonth]);

  // Filter entries by month and return the filtered array
  const filterEntriesByMonth = (entries, date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === month && entryDate.getFullYear() === year;
    });
  };

  const handleAddClick = () => {
    const today = new Date().toISOString().split('T')[0];
    const hasLoggedToday = journalEntries.some(entry => entry.date.split('T')[0] === today);

    if (hasLoggedToday) {
      toast.error('You already logged a journal entry for today.');
    } else {
      navigate('/journal-entry');
    }
  };

  const handleJournalClick = (id) => {
    navigate(`/view-journal/${id}`);
  };

  const handleMoreClick = (event, entry) => {
    setSelectedEntry(entry);
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleDeleteClick = () => {
    setAnchorEl(null);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_NODE_API}/api/journal/${selectedEntry._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const updatedEntries = journalEntries.filter(entry => entry._id !== selectedEntry._id);
      setJournalEntries(updatedEntries);
      
      // Update both filtered collections
      const updatedMonthEntries = filterEntriesByMonth(updatedEntries, currentDate);
      setEntriesForCurrentMonth(updatedMonthEntries);
      
      if (searchTerm.trim() === '') {
        setFilteredEntries(updatedMonthEntries);
      } else {
        setFilteredEntries(updatedMonthEntries.filter(entry => {
          return (
            (entry.challenge?.title && entry.challenge.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (entry.challenge?.description && entry.challenge.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (entry.challengeData && Object.values(entry.challengeData).some(text => 
              text.toLowerCase().includes(searchTerm.toLowerCase())
            ))
          );
        }));
      }
      
      toast.success('Journal entry deleted successfully.');
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      toast.error('Failed to delete journal entry.');
    } finally {
      setOpenDeleteModal(false);
      setSelectedEntry(null);
    }
  };

  const handleCloseModal = () => {
    setOpenDeleteModal(false);
    setSelectedEntry(null);
  };

  const handlePrevMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const handleChallengesClick = (event) => {
    setChallengesAnchorEl(event.currentTarget);
  };

  const handleChallengesClose = () => {
    setChallengesAnchorEl(null);
  };

  const getWeekStartDate = (date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(date.setDate(diff));
  };

  const weekStartDate = getWeekStartDate(new Date());
  const completedChallenges = journalEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entry.challenge && entryDate >= weekStartDate;
  }).length;
  const totalChallenges = 7; // Assuming there are 7 daily challenges in a week
  const progress = (completedChallenges / totalChallenges) * 100;

  const formattedDate = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  const renderGridItem = (entry) => (
    <div
      key={entry._id}
      className="bg-white p-5 rounded-lg shadow-lg h-64 w-full relative overflow-hidden hover:shadow-xl transition-shadow duration-300"
    >
      <div className="absolute top-4 right-4">
        <MoreHorizIcon 
          onClick={(event) => handleMoreClick(event, entry)} 
          className="cursor-pointer text-[#6fba94] hover:text-[#4e8067]" 
        />
      </div>
      <div className="text-[#6fba94] font-bold flex items-center">
        <CalendarTodayIcon fontSize="small" className="mr-2" />
        {new Date(entry.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>
      <div 
        className="mt-3 cursor-pointer h-[calc(100%-80px)] overflow-hidden"
        onClick={() => handleJournalClick(entry._id)}
      >
        <h2 className="text-xl font-bold mb-2 text-gray-800">
          {entry.challenge?.title || 'No Challenge'}
        </h2>
        <p className="text-gray-600 mb-2 line-clamp-2">
          {entry.challenge?.description || 'No Description'}
        </p>
        <div className="space-y-1 mt-2 max-h-[4.5rem] overflow-hidden relative">
          {entry.challengeData && Object.values(entry.challengeData).slice(0, 4).map((text, index) => (
            <p key={index} className="text-gray-700 line-clamp-1">
              <span className="font-medium mr-1">{index + 1}.</span> {text}
            </p>
          ))}
          {entry.challengeData && Object.values(entry.challengeData).length > 4 && (
            <p className="text-gray-500 text-sm">...</p>
          )}
        </div>
      </div>
      <div className="absolute bottom-4 right-4 flex space-x-2">
        {entry.images && entry.images.length > 0 && (
          <div className="flex -space-x-2">
            {entry.images.slice(0, 2).map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`upload-${index}`}
                className="w-12 h-12 object-cover rounded-full border-2 border-white shadow-sm"
              />
            ))}
            {entry.images.length > 2 && (
              <div className="w-12 h-12 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center text-gray-500 font-bold">
                +{entry.images.length - 2}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderListItem = (entry) => (
    <div
      key={entry._id}
      className="bg-white p-4 mb-3 rounded-lg shadow-md flex border-l-4 border-[#6fba94] hover:shadow-lg transition-shadow duration-300"
    >
      <div className="w-16 h-16 bg-[#e9f5ef] rounded-lg flex items-center justify-center mr-4">
        <div className="text-center">
          <div className="font-bold text-[#6fba94]">
            {new Date(entry.date).getDate()}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
          </div>
        </div>
      </div>
      
      <div 
        className="flex-1 cursor-pointer overflow-hidden"
        onClick={() => handleJournalClick(entry._id)}
      >
        <h2 className="text-lg font-bold mb-1 text-gray-800">{entry.challenge?.title || 'No Challenge'}</h2>
        <p className="text-sm text-gray-600 mb-2 line-clamp-1">{entry.challenge?.description || 'No Description'}</p>
        {entry.challengeData && Object.values(entry.challengeData).length > 0 && (
          <div className="text-xs text-gray-500 line-clamp-1">
            {Object.values(entry.challengeData)[0]}...
          </div>
        )}
      </div>
      
      <div className="ml-3 flex items-start space-x-3">
        {entry.images && entry.images.length > 0 && (
          <img
            src={entry.images[0]}
            alt="upload"
            className="w-12 h-12 object-cover rounded-md"
          />
        )}
        <MoreHorizIcon 
          onClick={(event) => handleMoreClick(event, entry)} 
          className="cursor-pointer text-gray-500 hover:text-gray-700" 
        />
      </div>
    </div>
  );

  return (
    <div className="bg-[#b4ddc8] min-h-screen flex flex-col">
      {/* Fixed navbar */}
      <nav className="bg-white py-4 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4 flex items-center">
          {/* Left side */}
          <div className="w-1/4">
            {/* Changed from MilitaryTechIcon to challenge.gif image */}
            <div 
              className="cursor-pointer w-8 h-8 flex items-center justify-center"
              onClick={handleChallengesClick}
            >
              <img 
                src="/images/goal.gif" 
                alt="Challenge" 
                className="w-20 h-20 object-contain"
              />
            </div>
            <Menu
              anchorEl={challengesAnchorEl}
              open={Boolean(challengesAnchorEl)}
              onClose={handleChallengesClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
            >
              <Box sx={{ width: 280, padding: '16px' }}>
                <h3 className="font-bold mb-2">Weekly Challenge Progress</h3>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ 
                    height: 10, 
                    borderRadius: 5, 
                    backgroundColor: '#e0e0e0', 
                    '& .MuiLinearProgress-bar': { 
                      backgroundColor: '#6fba94' 
                    } 
                  }} 
                />
                <div className="flex justify-between mt-2">
                  <span className="text-sm font-medium">
                    {completedChallenges}/{totalChallenges} Days Completed
                  </span>
                  <span className="text-sm font-medium text-[#6fba94]">
                    {Math.round(progress)}%
                  </span>
                </div>
              </Box>
            </Menu>
          </div>
          
          {/* Center - Month display */}
          <div className="flex-1 flex justify-center items-center">
            <ChevronLeftIcon 
              className="cursor-pointer mx-2 hover:text-[#6fba94]" 
              onClick={handlePrevMonth} 
            />
            <h1 className="text-xl font-bold">{formattedDate}</h1>
            <ChevronRightIcon 
              className="cursor-pointer mx-2 hover:text-[#6fba94]" 
              onClick={handleNextMonth} 
            />
          </div>
          
          {/* Right side */}
          <div className="w-1/4 flex justify-end">
            <div 
              className="bg-[#6fba94] text-white rounded-full p-2 shadow-md hover:bg-[#5ca57f] transition-colors duration-300 cursor-pointer"
              onClick={handleAddClick}
              aria-label="Add journal entry"
            >
              <AddIcon />
            </div>
          </div>
        </div>
      </nav>

      {/* Main content - scrollable area */}
      <div className="flex-1 overflow-y-auto pb-16"> {/* Add padding to bottom to prevent overlap with nav */}
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="relative w-full sm:w-96">
              <input
                type="text"
                placeholder="Search journal entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#6fba94]"
              />
              <SearchIcon className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            
            <div className="flex items-center bg-white rounded-lg border border-gray-200">
              <div
                className={`px-4 py-2 cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-[#e9f5ef] text-[#6fba94]'
                    : 'text-gray-500'
                } rounded-l-lg`}
                onClick={() => setViewMode('grid')}
              >
                <GridViewIcon fontSize="small" />
              </div>
              <div
                className={`px-4 py-2 cursor-pointer ${
                  viewMode === 'list' 
                    ? 'bg-[#e9f5ef] text-[#6fba94]'
                    : 'text-gray-500'
                } rounded-r-lg`}
                onClick={() => setViewMode('list')}
              >
                <ViewListIcon fontSize="small" />
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6fba94]"></div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
              <CalendarTodayIcon style={{ fontSize: 48 }} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium mb-2">No journal entries found</h3>
              <p className="mb-4 text-gray-500">
                {searchTerm ? 'Try adjusting your search term' : 'No entries for this month. Add a new entry to get started!'}
              </p>
              <div 
                onClick={handleAddClick}
                className="px-4 py-2 bg-[#6fba94] text-white rounded-lg inline-flex items-center hover:bg-[#5ca57f] transition-colors duration-300 cursor-pointer"
              >
                <AddIcon fontSize="small" className="mr-2" /> Create New Entry
              </div>
            </div>
          ) : (
            <div>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {filteredEntries.map(renderGridItem)}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEntries.map(renderListItem)}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Fixed bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <BottomNav value="journal" setValue={() => {}} />
      </div>
      
      {/* Journal entry operations menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={handleDeleteClick} className="text-red-500">Delete</MenuItem>
      </Menu>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={openDeleteModal}
        onClose={handleCloseModal}
        PaperProps={{
          style: {
            borderRadius: '12px',
            padding: '8px'
          }
        }}
      >
        <DialogTitle id="alert-dialog-title" className="text-xl font-bold">
          {"Confirm Deletion"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this journal entry? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions className="pb-4 px-6">
          <Button 
            onClick={handleCloseModal} 
            variant="outlined"
            style={{ borderColor: '#6fba94', color: '#6fba94' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            variant="contained"
            style={{ backgroundColor: '#ff5252', color: 'white' }}
            autoFocus
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Daily Quote Modal */}
      <Dialog
        open={showDailyQuote}
        onClose={handleCloseQuote}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          style: {
            borderRadius: '16px',
            padding: '0',
            overflow: 'hidden'
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative p-6 bg-white"
        >
          {/* Close button */}
          <div 
            className="absolute top-4 right-4 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors"
            onClick={handleCloseQuote}
          >
            <CloseIcon />
          </div>
          
          {/* Quote content */}
          <div className="flex flex-col items-center pt-2 pb-6 px-4">
            <div className="w-32 h-32 mb-6">
              <img 
                src="/images/type.gif" 
                alt="Daily Quote" 
                className="w-full h-full object-contain" 
              />
            </div>
            
            <div className="text-center">
              <h2 className="text-xl font-bold text-[#64aa86] mb-4">Today's Inspiration</h2>
              {todaysQuote && (
                <>
                  <p className="text-lg italic mb-3 text-gray-700">"{todaysQuote.quote}"</p>
                  <p className="text-sm text-gray-500">— {todaysQuote.author}</p>
                </>
              )}
            </div>
            
            <button
              onClick={handleCloseQuote}
              className="mt-8 px-6 py-2 bg-[#64aa86] text-white rounded-lg hover:bg-[#4e8067] transition-colors duration-300"
            >
              Start My Day
            </button>
          </div>
        </motion.div>
      </Dialog>
    </div>
  );
};

export default JournalLogs;