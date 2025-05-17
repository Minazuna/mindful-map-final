import React, { useState, useEffect } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import FavoriteIcon from '@mui/icons-material/Favorite';

const ListTask = () => {
  const [tasks, setTasks] = useState([]);
  const [open, setOpen] = useState(false);
  const [newTask, setNewTask] = useState('');
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    setTasks(savedTasks);
  }, []);

  useEffect(() => {
    if (tasks.length > 0 && tasks.every(task => task.completed)) {
      setShowMessage(true);
    } else {
      setShowMessage(false);
    }
  }, [tasks]);

  const handleAddTaskClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setNewTask('');
  };

  const handleSaveTask = () => {
    if (newTask.trim() !== '') {
      const updatedTasks = [...tasks, { text: newTask, completed: false }];
      setTasks(updatedTasks);
      localStorage.setItem('tasks', JSON.stringify(updatedTasks));
      handleClose();
    }
  };

  const handleToggleComplete = (index) => {
    const updatedTasks = tasks.map((task, i) => {
      if (i === index) {
        return { ...task, completed: !task.completed };
      }
      return task;
    });
    setTasks(updatedTasks);
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
  };

  const handleClearTasks = () => {
    setTasks([]);
    localStorage.removeItem('tasks');
  };

  const completedTasksCount = tasks.filter(task => task.completed).length;

  return (
    <div className="bg-gradient-to-r from-[#67b88f] via-[#93c4ab] to-[#f8ffff] min-h-screen p-10 flex flex-col items-center">
      <div className="w-full max-w-md">
        <h1 className="text-left text-2xl font-bold text-white mb-2">Tasks</h1>
        <hr className="border-white mb-4" />
        <button
          onClick={handleAddTaskClick}
          className="flex items-center justify-center bg-transparent border border-white text-white font-bold py-2 px-4 rounded mb-4 w-full"
        >
          <AddCircleOutlineIcon className="mr-2" />
          Add Task
        </button>
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <div key={index} className="bg-white p-4 rounded-lg flex items-center w-full">
              <CheckCircleIcon
                className={`cursor-pointer ${task.completed ? 'text-green-500' : 'text-gray-400'}`}
                onClick={() => handleToggleComplete(index)}
              />
              <p className={`ml-4 font-bold ${task.completed ? 'line-through text-gray-500' : 'text-black'}`}>{task.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-transparent text-white font-bold text-center">
          Finished Tasks: {completedTasksCount}/{tasks.length}
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add a new task</h2>
            <textarea
              className="w-full p-2 border border-gray-300 rounded mb-4"
              rows="4"
              maxLength="200"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <div className="flex justify-end">
              <button onClick={handleClose} className="bg-gray-300 text-black font-bold py-2 px-4 rounded mr-2">
                Cancel
              </button>
              <button onClick={handleSaveTask} className="bg-[#6fba94] text-white font-bold py-2 px-4 rounded">
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {showMessage && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg flex items-center space-x-4">
          <p className="text-black font-bold">Good job! You finished all your tasks. <FavoriteIcon className="text-red-500" /></p>
          <button onClick={handleClearTasks} className="bg-[#6fba94] text-white font-bold py-1 px-3 rounded">
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

export default ListTask;