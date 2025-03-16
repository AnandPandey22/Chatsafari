import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../Store/useStore';
import { User } from '../types';
import { toast } from 'react-hot-toast';
import { UserCircle, Calendar, Heart } from 'lucide-react';
import Footer from '../components/Footer';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [age, setAge] = useState('');
  const navigate = useNavigate();
  const { setCurrentUser, connect, activeUsers } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if username already exists
    const usernameExists = activeUsers.some(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );

    if (usernameExists) {
      toast.error('Username already taken. Please choose another one.');
      return;
    }

    if (username.trim()) {
      const user: User = {
        id: crypto.randomUUID(),
        username: username.trim(),
        gender,
        age: parseInt(age) || 18,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        isOnline: true
      };

      try {
        // First set the current user
        setCurrentUser(user);
        
        // Then establish socket connection
        connect();
        
        // Wait a brief moment for the socket connection to establish
        await new Promise(resolve => setTimeout(resolve, 500));
        
        toast.success('Welcome to ChatSafari!');
        navigate('/dashboard');
      } catch (error) {
        console.error('Login error:', error);
        toast.error('Failed to connect. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Fixed Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left section - Brand */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-violet-600" style={{ fontFamily: 'Pacifico, cursive' }}>
                ChatSafari
              </h1>
            </div>

            {/* Right section - Donate Button */}
            <Link
              to="/donate"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition duration-150 ease-in-out"
            >
              <Heart className="h-4 w-4 mr-2" />
              Donate Us
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - Adjusted for fixed header */}
      <div className="flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 py-16 mt-16">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-8">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col lg:flex-row gap-8">
            {/* Login Form */}
            <div className="lg:w-[500px] w-full">
              <div className="text-center mb-8">
                <h1 className="text-5xl font-bold text-violet-600 mb-2" style={{ fontFamily: 'Pacifico, cursive' }}>
                  ChatSafari
                </h1>
                <p className="text-gray-600">Connect with people around the world</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-lg bg-opacity-90">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserCircle className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="username"
                        name="username"
                        type="text"
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition duration-150 ease-in-out"
                        placeholder="Choose a username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <select
                        id="gender"
                        name="gender"
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition duration-150 ease-in-out appearance-none bg-white"
                        value={gender}
                        onChange={(e) => setGender(e.target.value as 'male' | 'female')}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="age"
                        name="age"
                        type="number"
                        required
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition duration-150 ease-in-out"
                        placeholder="Your age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition duration-150 ease-in-out transform hover:scale-[1.02]"
                  >
                    Join Chat
                  </button>
                </form>
              </div>

              <div className="mt-8 text-center text-sm text-gray-600">
                <p>By joining, you agree to our Terms of Service and Privacy Policy</p>
              </div>

              {/* Bottom Ad Space - Visible on mobile and tablet */}
              <div className="mt-8 lg:hidden">
                <div className="bg-white rounded-xl shadow-md p-4 h-24 flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                  <span>Advertisement</span>
                </div>
              </div>
            </div>

            {/* Right side - Ad Space */}
            <div className="hidden lg:block flex-1">
              <div className="bg-white rounded-xl shadow-md p-4 h-[600px] flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-200">
                <span>Advertisement</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
