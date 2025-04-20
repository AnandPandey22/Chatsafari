import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { User } from '../types';
import { toast } from 'react-hot-toast';
import { UserCircle, Calendar } from 'lucide-react';
import Footer from '../components/Footer';
import { Helmet } from 'react-helmet-async';

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
      <Helmet>
        <title>ChatSafari - Free Online Chat Rooms | Talk to Strangers</title>
        <meta name="description" content="Join ChatSafari's free online chat rooms. Talk to strangers, chat with strangers, and enjoy video chat worldwide. No registration required." />
        <meta name="keywords" content="chat rooms, online chat, video chat, talk to strangers, free chat, chat with strangers, meet new friends" />
        <link rel="canonical" href="https://chatsafari.com/" />
        <meta property="og:title" content="ChatSafari - Free Online Chat Rooms | Talk to Strangers" />
        <meta property="og:description" content="Join ChatSafari's free online chat rooms. Talk to strangers, chat with strangers, and enjoy video chat worldwide. No registration required." />
        <meta property="og:url" content="https://chatsafari.com/" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="ChatSafari - Free Online Chat Rooms" />
        <meta name="twitter:description" content="Join ChatSafari's free online chat rooms. Meet new friends worldwide." />

        <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<script>
  (adsbygoogle = window.adsbygoogle || []).push({
    google_ad_client: "ca-pub-9696449443766781", // Your AdSense publisher ID
    enable_page_level_ads: true
  });
</script>
        
      </Helmet>

      {/* Fixed Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm fixed top-0 left-0 right-0 z-10" role="banner">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left section - Brand */}
            <div className="flex items-center">
              <span className="text-2xl font-bold text-violet-600" style={{ fontFamily: 'Pacifico, cursive' }}>
                ChatSafari
              </span>
            </div>

            {/* Right section - Blogs Button */}
            <Link
              to="/blogs"
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-medium rounded-lg text-white bg-violet-700 hover:bg-violet-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 transition duration-150 ease-in-out shadow-md"
            >
              Blogs
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content - Adjusted for fixed header */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 py-16 mt-16" role="main">
        <div className="w-full max-w-6xl flex flex-col gap-8">
          
          {/* Main Content Area */}
          <section className="flex flex-col lg:flex-row gap-8" aria-label="Login and Introduction">
            {/* Login Form */}
            <div className="lg:w-[500px] w-full">
              <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-lg bg-opacity-90">
                <div className="text-center mb-8">
                  <span className="text-5xl font-bold text-violet-600 mb-2" style={{ fontFamily: 'Pacifico, cursive' }}>
                    ChatSafari
                  </span>
                  <p className="text-gray-600">Connect with people around the world</p>
                </div>

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
            </div>


            {/* Right side - Content */}
            <div className="w-full lg:flex-1">
              <div className="bg-white rounded-2xl shadow-xl p-8 backdrop-blur-lg bg-opacity-90">
                <h1 className="text-3xl font-bold text-violet-600 mb-6">
                  Talk to Strangers, Free Chat Rooms, Make Friends Online!
                </h1>
                
                <div className="space-y-4">
                  <p className="text-gray-600 text-lg leading-relaxed">
                    Free chat rooms, chat online with girls No Registration. Experience the best Online Chatting platform to find friends and Chat with strangers all over the world.
                  </p>

                  <p className="text-gray-600 text-lg leading-relaxed">
                    Chatsafari.com is an Online Free Chat Rooms. Enjoy video chat with strangers worldwide. Here you can chat with hot girls, meet new friends from all over the world. 
                    Chatsafari.com have Free Online Chat Rooms where you can Chat with Strangers.
                  </p>
                </div>
              </div>
            </div>
          </section>


          {/* Additional Content - Below Login Form */}
          <section className="max-w-4xl mx-auto text-center py-12" aria-label="About ChatSafari">
            <p className="text-gray-600 text-lg leading-relaxed">
              Chatsafari.com is a free chat room and Video chat website where you can have live chat with single girls and boys, 
              you can Chat with random strangers from USA, Canada, United Kingdom, Australia and people from all over the world, 
              at the same time in multiple chatrooms and discussion groups, any time you can start a private conversation 
              to meet girls and boys living nearby in your area.
            </p>
          </section>

          {/* Talk to Strangers Section */}
          <section className="bg-white rounded-xl shadow-md p-8" aria-label="Chat Features">
            <h2 className="text-3xl font-bold text-violet-600 mb-8 text-center">
              Talk to Strangers Free On Chatsafari
            </h2>
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="bg-gray-50 rounded-lg p-6 hover:bg-violet-50 transition-colors">
                <p className="text-gray-600 text-lg leading-relaxed">
                  Talk to strangers, Free Chat Rooms, online chat, Random Chat, 1-on-1 live chat with Strangers, Video Chat with girls,Voice Chat, text chat, Ghost Chat etc. these are some services that are fully served by Chatsafari to all its Users so that they all can interact with anyone around the world to Uplift their mind and take a break from their hectic schedule and relax their body and mind. Chatsafari.com also have some different features that users can use to Impress girl and uplift their mood.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 hover:bg-violet-50 transition-colors">
                <p className="text-gray-600 text-lg leading-relaxed">
                  Free Chat Rooms like India Chat Room, USA chat room, Lesbian chat room, Gay Chat room, Teen Chat rooms, Dating Chat Rooms, Girls Chat Room, Ghost Chat Rooms are Available on Chatsafari.com which helps different types of people to interact with their lovable person. Sometimes people get bored talking to their friends and here chatsafari helps them to find a good stranger from a different part of world who does not know about him so that they both can share each others feelings without Judging them. All the features and Chat Rooms are Completely Free, Users don't have to pay anything.
                </p>
              </div>

              
              <div className="bg-gray-50 rounded-lg p-6 hover:bg-violet-50 transition-colors">
                <p className="text-gray-600 text-lg leading-relaxed">
                  Talking to strangers online on chatsafari helps people to Uplift their mood because they can share their feelings with real people and have a good conversation with them. Talk to Random cute girls on Chatsafari and start Improving your conversation pull with them so that they get Impressed by you. You can also flirt with girls on chatsafari and they are very polite to all users.
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 hover:bg-violet-50 transition-colors">
                <p className="text-gray-600 text-lg leading-relaxed">
                  Anand Pandey is the Founder of Chatsafari and he launched Chatsafari.com on 14th March 2025. After so many days and too many updates the Chatsafari is Successfully launched. Chatsafari was the First Dream of Anand Pandey which he wanted to accomplish, now since Chatsafari has been launched he wants people to see his work and try Chatsafari for once and give some feedback about the services of chatsafari and if they find some bug they should contact Us so that we can resolve it immediately.
                  </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-6 hover:bg-violet-50 transition-colors">
                <p className="text-gray-600 text-lg leading-relaxed">
                  If you are an introvert and want to improve your conversation skill with girls then Chatsafari.com is One and Only the Best Chatting Platform which can connect you to different girls from so many countries so that you can interact with them and Improve your English Speaking and Conversation Skill. Only Real usera are available on chatsafari from different countries and we do not have Bots who send spamy and fishy messages to users. This is what make Chatsafari.com different from Other Online Chatting Platform.
                  </p>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="bg-white rounded-xl shadow-md p-8" aria-label="Why Choose Us">
            <h3 className="text-3xl font-bold text-violet-600 mb-8 text-center">
              Why Choose ChatSafari?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-violet-600">Real-time Communication</h4>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Experience seamless real-time messaging with instant delivery indicators, typing status, and read receipts. 
                  Share images and connect with users worldwide through our modern, responsive interface.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium text-violet-600">Security & Privacy</h4>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Enjoy secure end-to-end encrypted messaging, customizable profiles with avatars, and user presence indicators. 
                  Your privacy and security are our top priorities. Your Privacy is our Responsibility.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium text-violet-600">Free Chat Rooms</h4>
                <p className="text-gray-600 text-lg leading-relaxed">
                 Free Chat Rooms, online chatting and including all features are completely Free on Chatsafari. 
                 It means Users do not have to pay anything to Talk to strangers like Other chatting websites.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      <Footer />

    </div>
  );
};

export default Login;
