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
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import BottomNav from '../../BottomNav';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import { motion } from 'framer-motion';

// Daily inspirational quotes
const dailyQuotes = [
  { quote: "Gratitude turns what we have into enough.", author: "Anonymous" },
  { quote: "Self-love is not selfish; it is necessary.", author: "Oscar Wilde" },
  { quote: "Happiness is not something ready-made. It comes from your own actions.", author: "Dalai Lama" },
  { quote: "The best and most beautiful things in the world cannot be seen or even touched - they must be felt with the heart.", author: "Helen Keller" },
  { quote: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
  { quote: "Friendship is born at that moment when one person says to another, 'What! You too? I thought I was the only one.'", author: "C.S. Lewis" },
  { quote: "Family is not an important thing. It's everything.", author: "Michael J. Fox" },
  { quote: "To love oneself is the beginning of a lifelong romance.", author: "Oscar Wilde" },
  { quote: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
  { quote: "We must be willing to let go of the life we planned so as to have the life that is waiting for us.", author: "Joseph Campbell" },
  { quote: "The best way to find yourself is to lose yourself in the service of others.", author: "Mahatma Gandhi" },
  { quote: "Small acts, when multiplied by millions of people, can transform the world.", author: "Howard Zinn" },
  { quote: "The most beautiful things in life are felt with the heart.", author: "Antoine de Saint-Exupéry" },
  { quote: "Be the reason someone smiles today.", author: "Anonymous" },
  { quote: "Every day may not be good, but there's something good in every day.", author: "Alice Morse Earle" },
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
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showDailyQuote, setShowDailyQuote] = useState(false);
  const [todaysQuote, setTodaysQuote] = useState(null);
  const navigate = useNavigate();

  const getTodayString = () => {
    const today = new Date();
    return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  };

  const shouldShowDailyQuote = (entries) => {
    const today = getTodayString();
    const lastQuoteDay = localStorage.getItem('lastQuoteDay');
    if (lastQuoteDay === today) return false;
    const hasLoggedToday = entries.some(entry => {
      const entryDate = new Date(entry.date);
      const entryDateString = `${entryDate.getFullYear()}-${entryDate.getMonth() + 1}-${entryDate.getDate()}`;
      return entryDateString === today;
    });
    return !hasLoggedToday;
  };

  const selectDailyQuote = () => {
    const now = new Date();
    const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
    const quoteIndex = dayOfYear % dailyQuotes.length;
    return dailyQuotes[quoteIndex];
  };

  useEffect(() => {
    const fetchJournalEntries = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/all`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const entries = response.data.entries || [];
        setJournalEntries(entries);

        const filtered = filterEntriesByMonth(entries, currentDate);
        setEntriesForCurrentMonth(filtered);
        setFilteredEntries(filtered);

        if (shouldShowDailyQuote(entries)) {
          setTodaysQuote(selectDailyQuote());
          setShowDailyQuote(true);
        }
      } catch (error) {
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchJournalEntries();
    // eslint-disable-next-line
  }, [currentDate]);

  const handleCloseQuote = () => {
    setShowDailyQuote(false);
    localStorage.setItem('lastQuoteDay', getTodayString());
  };

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEntries(entriesForCurrentMonth);
    } else {
      const searched = entriesForCurrentMonth.filter(entry => {
        return (
          (entry.challenges && entry.challenges.join(' ').toLowerCase().includes(searchTerm.toLowerCase())) ||
          (entry.content && entry.content.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      });
      setFilteredEntries(searched);
    }
  }, [searchTerm, entriesForCurrentMonth]);

  const filterEntriesByMonth = (entries, date) => {
    const month = date.getMonth();
    const year = date.getFullYear();
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === month && entryDate.getFullYear() === year;
    });
  };

  const handleAddClick = () => {
    navigate('/journal-challenge');
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

  const handleUpdateClick = () => {
    setAnchorEl(null);
    navigate(`/edit-journal/${selectedEntry._id}`);
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

      const updatedMonthEntries = filterEntriesByMonth(updatedEntries, currentDate);
      setEntriesForCurrentMonth(updatedMonthEntries);

      setFilteredEntries(updatedMonthEntries);
    } catch (error) {
      // Optionally show toast
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

  const getWeekStartDate = (date) => {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };
  const weekStartDate = getWeekStartDate(new Date());
  const completedChallenges = journalEntries.filter(entry => {
    const entryDate = new Date(entry.date);
    return entry.challenges && entryDate >= weekStartDate;
  }).length;
  const totalChallenges = 7;
  const progress = (completedChallenges / totalChallenges) * 100;

  const formattedDate = currentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
  });

  // --- Updated preview renderers ---
  const renderGridItem = (entry) => (
    <motion.div
      key={entry._id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group bg-white rounded-2xl shadow-md border-2 border-[#E6F4EA] p-6 flex flex-col justify-between min-h-[180px] hover:shadow-lg hover:border-[#55AD9B]/30 transition-all duration-200 cursor-pointer relative"
      onClick={() => handleJournalClick(entry._id)}
    >
      <div className="flex flex-wrap gap-2 mb-2">
        {entry.challenges && entry.challenges.map((challenge) => (
          <span
            key={challenge}
            className="bg-[#d8f3dc] text-[#40916c] px-3 py-1 rounded-full text-md font-semibold"
          >
            {challenge}
          </span>
        ))}
      </div>
      <div className="text-gray-700 text-md whitespace-pre-line mb-2 line-clamp-3">
        {entry.content.length > 100
          ? entry.content.slice(0, 100) + '...'
          : entry.content}
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center text-sm text-gray-400">
          <CalendarTodayIcon fontSize="small" className="mr-1" />
          {new Date(entry.date).toLocaleString()}
        </div>
        <MoreHorizIcon
          onClick={(event) => {
            event.stopPropagation();
            handleMoreClick(event, entry);
          }}
          className="cursor-pointer text-gray-400 hover:text-[#55AD9B]"
        />
      </div>
    </motion.div>
  );

  const renderListItem = (entry) => (
    <motion.div
      key={entry._id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="group bg-white p-4 mb-3 rounded-xl shadow-md flex border-l-4 border-[#52b788] hover:shadow-lg transition-shadow duration-200 cursor-pointer relative"
      onClick={() => handleJournalClick(entry._id)}
    >
      <div className="w-16 h-16 bg-[#d8f3dc] rounded-lg flex items-center justify-center mr-4">
        <div className="text-center">
          <div className="font-bold text-[#40916c]">
            {new Date(entry.date).getDate()}
          </div>
          <div className="text-xs text-gray-500">
            {new Date(entry.date).toLocaleDateString('en-US', { month: 'short' })}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden">
        <h2 className="text-lg font-bold mb-1 text-gray-800">
          {entry.challenges && entry.challenges.join(', ')}
        </h2>
        <p className="text-sm text-gray-600 mb-2 line-clamp-1">
          {entry.content.length > 100
            ? entry.content.slice(0, 100) + '...'
            : entry.content}
        </p>
      </div>
      <MoreHorizIcon
        onClick={(event) => {
          event.stopPropagation();
          handleMoreClick(event, entry);
        }}
        className="cursor-pointer text-gray-400 hover:text-[#55AD9B]"
      />
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#55AD9B] flex flex-col">
      {/* Fixed navbar */}
      <nav className="bg-white py-4 shadow-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 flex items-center">
          {/* Left side */}
          <div className="w-1/4">
            <div
              className="cursor-pointer w-8 h-8 flex items-center justify-center"
              onClick={() => setChallengesAnchorEl(true)}
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
              onClose={() => setChallengesAnchorEl(null)}
              anchorOrigin={{
                vertical: 'top',
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
                      backgroundColor: '#52b788'
                    }
                  }}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-sm font-medium">
                    {completedChallenges}/{totalChallenges} Days Completed
                  </span>
                  <span className="text-sm font-medium text-[#52b788]">
                    {Math.round(progress)}%
                  </span>
                </div>
              </Box>
            </Menu>
          </div>
          {/* Center - Month display */}
          <div className="flex-1 flex justify-center items-center">
            <ChevronLeftIcon
              className="cursor-pointer mx-2 hover:text-[#40916c]"
              onClick={handlePrevMonth}
            />
            <h1 className="text-xl font-bold">{formattedDate}</h1>
            <ChevronRightIcon
              className="cursor-pointer mx-2 hover:text-[#40916c]"
              onClick={handleNextMonth}
            />
          </div>
          {/* Right side - Only Journal Challenge Button */}
          <div className="w-1/4 flex justify-end">
            <div
              className="bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] text-white rounded-full p-2 shadow-md hover:from-[#3e8e7e] hover:to-[#55AD9B] transition-colors duration-300 cursor-pointer"
              onClick={handleAddClick}
              aria-label="Journal challenge entry"
            >
              <AddIcon />
            </div>
          </div>
        </div>
      </nav>
      {/* Main content - scrollable area */}
      <div className="flex-1 overflow-y-auto pb-16">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="relative w-full sm:w-96">
              <input
                type="text"
                placeholder="Search journal entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#55AD9B]"
              />
              <SearchIcon className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            <div className="flex items-center bg-white rounded-lg border border-gray-200">
              <div
                className={`px-4 py-2 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#d8f3dc] text-[#40916c]'
                    : 'text-gray-500'
                } rounded-l-lg`}
                onClick={() => setViewMode('grid')}
              >
                <GridViewIcon fontSize="small" />
              </div>
              <div
                className={`px-4 py-2 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-[#d8f3dc] text-[#40916c]'
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#55AD9B]"></div>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-lg shadow-md">
              <CalendarTodayIcon style={{ fontSize: 48 }} className="mx-auto mb-4 text-gray-300" />
              <h3 className="text-xl font-medium mb-2">No journal entries found</h3>
              <p className="mb-4 text-gray-500">
                {searchTerm ? 'Try adjusting your search term' : 'No entries for this month. Add a new entry to get started!'}
              </p>
              <div className="flex justify-center">
                <div
                  onClick={handleAddClick}
                  className="px-4 py-2 bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] text-white rounded-lg inline-flex items-center hover:from-[#3e8e7e] hover:to-[#55AD9B] transition-colors duration-300 cursor-pointer"
                >
                  <AddIcon fontSize="small" className="mr-2" /> Journal Challenge
                </div>
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
        PaperProps={{
          style: {
            borderRadius: 16,
            minWidth: 180,
            boxShadow: '0 4px 24px 0 rgba(85,173,155,0.10)'
          }
        }}
      >
        <MenuItem onClick={handleUpdateClick}>
          <EditIcon fontSize="small" className="mr-2 text-[#55AD9B]" />
          Update
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} className="text-[#ff5252]">
          <DeleteIcon fontSize="small" className="mr-2 text-[#ff5252]" />
          Delete
        </MenuItem>
      </Menu>
      {/* Delete confirmation dialog */}
      <Dialog
        open={openDeleteModal}
        onClose={handleCloseModal}
        maxWidth="xs"
        PaperProps={{
          style: {
            borderRadius: 20,
            padding: 0,
            background: '#FFFFFF',
            border: '2px solid #E6F4EA'
          }
        }}
      >
        <DialogTitle className="text-center font-bold text-[#1b5f52] text-2xl pt-8 pb-2">
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <div className="flex flex-col items-center py-2">
            <DeleteIcon style={{ fontSize: 48, color: '#ff5252' }} className="mb-2" />
            <p className="text-[#272829] text-base text-center mb-2">
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </p>
          </div>
        </DialogContent>
        <DialogActions className="flex justify-center pb-8">
          <Button
            onClick={handleCloseModal}
            variant="outlined"
            style={{
              borderColor: '#55AD9B',
              color: '#55AD9B',
              borderRadius: 999,
              padding: '8px 28px',
              fontWeight: 600
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            variant="contained"
            style={{
              background: 'linear-gradient(90deg, #ff5252 60%, #ffb4b4 100%)',
              color: 'white',
              borderRadius: 999,
              padding: '8px 28px',
              fontWeight: 600,
              marginLeft: 12
            }}
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
              <h2 className="text-xl font-bold text-[#40916c] mb-4">Today's Inspiration</h2>
              {todaysQuote && (
                <>
                  <p className="text-lg italic mb-3 text-gray-700">"{todaysQuote.quote}"</p>
                  <p className="text-sm text-gray-500">— {todaysQuote.author}</p>
                </>
              )}
            </div>
            <button
              onClick={handleCloseQuote}
              className="mt-8 px-6 py-2 bg-gradient-to-r from-[#55AD9B] to-[#3e8e7e] text-white rounded-lg hover:from-[#3e8e7e] hover:to-[#55AD9B] transition-colors duration-300"
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