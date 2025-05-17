import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BottomNav from '../../BottomNav';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

const prompts = [
  "What are you grateful for today?",
  "Describe a moment today when you felt truly at peace.",
  "What is one thing you can do to improve your mental health?",
  "Write about a time when you overcame a challenge.",
  "What makes you feel the most inspired?",
  "What are three things you love about yourself?",
  "Describe a happy memory from your past.",
  "What are your goals for the next month?",
  "How do you handle stress?",
  "What is one thing you can do to make tomorrow better?",
  "Write a love letter to yourself."
];

const JournalPrompt = () => {
  const [prompt, setPrompt] = useState('');
  const [entry, setEntry] = useState('');
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * prompts.length);
    setPrompt(prompts[randomIndex]);
  }, []);

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append('prompt', prompt);
      formData.append('content', entry);
      images.forEach((image) => {
        formData.append('images', image);
      });

      const token = localStorage.getItem('token');
      const response = await axios.post(`${import.meta.env.VITE_NODE_API}/api/journal`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('Journal entry saved:', response.data);
      toast.success('Journal logged for the day!');
      setTimeout(() => {
        navigate('/journal-logs');
      }, 2000);
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error('Failed to log journal entry.');
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    setImages((prevImages) => [...prevImages, ...files]);
  };

  const handleImageClick = (image) => {
    setSelectedImage(URL.createObjectURL(image));
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
  };

  const handleBackClick = () => {
    navigate('/journal-logs');
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-[#eef0ee] min-h-screen flex flex-col justify-between">
      <nav className="bg-white py-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center px-4">
          <ArrowBackIcon className="cursor-pointer" onClick={handleBackClick} />
          <h1 className="text-xl font-bold mx-auto">{currentDate}</h1>
          <div></div> {/* Placeholder for alignment */}
        </div>
      </nav>
      <div className="flex-grow flex flex-col items-center justify-center p-4">
        <div className="relative w-full max-w-4xl">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold mx-auto">{prompt}</h2>
            <button
              onClick={handleSave}
              className="bg-[#64aa86] text-white font-bold py-2 px-6 rounded-full"
            >
              Save
            </button>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md h-96"> {/* Increased height */}
            <textarea
              className="w-full h-full p-4 border-none outline-none resize-none"
              placeholder="Journal entry..."
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
            />
          </div>
          <input
            type="file"
            id="image-upload"
            multiple
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          <label htmlFor="image-upload">
            <ImageIcon
              className="absolute bottom-4 right-4 text-[#64aa86] cursor-pointer"
              style={{ fontSize: 40 }}
            />
          </label>
          <div className="absolute bottom-4 left-4 flex space-x-2">
            {images.map((image, index) => (
              <img
                key={index}
                src={URL.createObjectURL(image)}
                alt={`upload-${index}`}
                className="w-44 h-32 object-cover cursor-pointer rounded-lg"
                onClick={() => handleImageClick(image)}
              />
            ))}
          </div>
        </div>
      </div>
      <BottomNav value="journal" setValue={() => {}} />
      <Modal open={!!selectedImage} onClose={handleCloseModal}>
        <Box className="flex items-center justify-center h-screen relative">
          <img src={selectedImage} alt="Selected" className="max-w-full max-h-full" />
          <CloseIcon
            className="absolute top-4 right-4 text-white cursor-pointer"
            style={{ fontSize: 40 }}
            onClick={handleCloseModal}
          />
        </Box>
      </Modal>
    </div>
  );
};

export default JournalPrompt;