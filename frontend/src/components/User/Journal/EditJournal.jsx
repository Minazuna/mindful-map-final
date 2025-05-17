import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BottomNav from '../../BottomNav';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';

const EditJournal = () => {
  const [entry, setEntry] = useState('');
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    const fetchJournalEntry = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/journal/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setEntry(response.data.content);
        setImages(response.data.images);
      } catch (error) {
        console.error('Error fetching journal entry:', error);
        toast.error('Failed to load journal entry.');
      }
    };

    fetchJournalEntry();
  }, [id]);

  const handleSave = async () => {
    try {
      const formData = new FormData();
      formData.append('content', entry);
      images.forEach((image) => {
        if (typeof image === 'string') {
          formData.append('existingImages', image);
        } else {
          formData.append('images', image);
        }
      });

      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_NODE_API}/api/journal/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success('Journal entry updated successfully.');
      navigate('/journal-logs');
    } catch (error) {
      console.error('Error updating journal entry:', error);
      toast.error('Failed to update journal entry.');
    }
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files);
    setImages((prevImages) => [...prevImages, ...files]);
  };

  const handleImageClick = (image) => {
    if (typeof image === 'string') {
      setSelectedImage(image);
    } else {
      setSelectedImage(URL.createObjectURL(image));
    }
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
          <h1 className="text-xl font-bold">{currentDate}</h1>
          <div></div> {/* Placeholder for alignment */}
        </div>
      </nav>
      <div className="relative flex-grow flex items-center justify-center p-4">
        <div className="relative w-full max-w-2xl"> {/* Adjusted width */}
          <button
            onClick={handleSave}
            className="absolute top-[-3rem] right-0 bg-[#64aa86] text-white font-bold py-2 px-10 rounded-full"
          >
            Save
          </button>
          <div className="bg-white p-6 rounded-lg shadow-md h-[30rem]"> {/* Increased height */}
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
                src={typeof image === 'string' ? image : URL.createObjectURL(image)}
                alt={`upload-${index}`}
                className="w-20 h-20 object-cover rounded-lg cursor-pointer"
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

export default EditJournal;