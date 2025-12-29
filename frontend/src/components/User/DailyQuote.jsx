import React, { useEffect, useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';

const fallbackQuotes = [
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "You are capable of amazing things.", author: "Unknown" },
  { text: "Success is not final, failure is not fatal: It is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Don’t watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "Difficult roads often lead to beautiful destinations.", author: "Zig Ziglar" },
  { text: "The best way to get started is to quit talking and begin doing.", author: "Walt Disney" },
  { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
  { text: "It always seems impossible until it’s done.", author: "Nelson Mandela" },
  { text: "You don’t have to be perfect to be amazing.", author: "Unknown" },
  { text: "Act as if what you do makes a difference. It does.", author: "William James" },
  { text: "Keep your face always toward the sunshine—and shadows will fall behind you.", author: "Walt Whitman" },
  { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar" },
  { text: "With the new day comes new strength and new thoughts.", author: "Eleanor Roosevelt" },
  { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
  { text: "The harder you work for something, the greater you’ll feel when you achieve it.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Little by little, one travels far.", author: "J.R.R. Tolkien" },
];

// List of wallpaper image filenames in /public/images/quote/
const quoteImages = [
  '/images/quote/quote1.png',
  '/images/quote/quote2.png',
  '/images/quote/quote3.png',
  '/images/quote/quote4.png',
  '/images/quote/quote5.png',
  '/images/quote/quote6.png',
  '/images/quote/quote7.png',
  '/images/quote/quote8.png',
  '/images/quote/quote9.png',
  '/images/quote/quote10.png',
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

async function getRandomQuote() {
  try {
    const res = await fetch('https://zenquotes.io/api/random');
    const data = await res.json();
    return {
      text: data[0].q,
      author: data[0].a,
    };
  } catch (e) {
    const idx = Math.floor(Math.random() * fallbackQuotes.length);
    return fallbackQuotes[idx];
  }
}

export default function DailyQuote() {
  const [imageIndex, setImageIndex] = useState(Math.floor(Math.random() * quoteImages.length));
  const [quote, setQuote] = useState({ text: '', author: '' });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState({ firstName: '' });
  const quoteRef = useRef();
  const navigate = useNavigate();

  // Fetch user name from backend (same as Profile.jsx)
  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser({
          firstName: response.data.firstName || response.data.name || 'Friend'
        });
      } catch {
        setUser({ firstName: 'Friend' });
      }
    }
    fetchUser();
  }, []);

  const fetchQuote = async () => {
    setLoading(true);
    const q = await getRandomQuote();
    setQuote(q);
    setLoading(false);
  };

  useEffect(() => {
    setImageIndex(Math.floor(Math.random() * quoteImages.length));
    fetchQuote();
    // eslint-disable-next-line
  }, []);

  const handleDownload = async () => {
    if (!quoteRef.current) return;
    const canvas = await html2canvas(quoteRef.current, { useCORS: true });
    const link = document.createElement('a');
    link.download = 'daily-quote.png';
    link.href = canvas.toDataURL();
    link.click();
  };

  const handleNextQuote = () => {
    setImageIndex(Math.floor(Math.random() * quoteImages.length));
    fetchQuote();
  };

  const handleNext = () => {
    navigate('/choose-category');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-gradient-to-br from-[#f9f9f9] via-[#a8d5bb] to-[#f9f9f9] px-2 py-8">
      {/* Greeting */}
      <div className="mb-8 mt-4 text-center">
        <span className="text-4xl font-bold text-[#229e88] font-nunito drop-shadow-sm">
          {getGreeting()},{" "}
          {user?.firstName || 'Friend'}
        </span>
      </div>

      {/* Quote Card */}
      <div
        ref={quoteRef}
        className="relative w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl mb-10 border-2 border-[#b4ddc8]"
        style={{
          height: 400,
          backgroundImage: `url(${quoteImages[imageIndex]})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-[rgba(30,40,60,0.22)] rounded-3xl" />
        <div className="relative flex flex-col justify-center items-center h-full px-8 py-10 z-10">
          <div className="text-6xl text-white opacity-70 mb-2 font-bold self-start drop-shadow-lg">“</div>
          <div className="text-2xl md:text-3xl text-white font-semibold mb-4 text-center drop-shadow-lg" style={{ lineHeight: '1.5' }}>
            {loading ? <span>Loading...</span> : quote.text}
          </div>
          <div className="text-lg text-white opacity-90 font-medium self-end mt-2 drop-shadow-md">
            — {loading ? '' : quote.author}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-row justify-center gap-4 mb-8">
        <button
          onClick={handleDownload}
          className="bg-[#55AD9B] hover:bg-[#229e88] text-white font-bold py-3 px-8 rounded-full shadow-md flex items-center gap-2 transition"
        >
          <DownloadIcon className="!text-white" />
          Save
        </button>
        <button
          onClick={handleNextQuote}
          className="bg-[#55AD9B] hover:bg-[#229e88] text-white font-bold py-3 px-8 rounded-full shadow-md flex items-center gap-2 transition"
        >
          <AutorenewIcon className="!text-white" />
          New Quote
        </button>
      </div>

      {/* Next Button */}
      <button
        onClick={handleNext}
        className="mt-2 bg-[#f9f9f9] hover:bg-[#f0f0f0] text-[#55AD9B] font-bold py-3 px-10 rounded-full shadow-lg flex items-center gap-2 text-lg transition"
      >
        Next
        <ArrowForwardIosIcon className="!text-[#55AD9B]" />
      </button>
    </div>
  );
}