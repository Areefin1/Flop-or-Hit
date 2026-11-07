import { useEffect, useState } from 'react';
import './App.css';
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from './components/Login/Auth';
import HomeFeed from "./components/HomeFeed/HomeFeed";
import CreatePost from './components/CreatePost/CreatePost';
import Sidebar from './components/Sidebar/Sidebar';
import EditPost from './components/Edit/EditPost';
import PostDetails from './components/PostDetails/PostDetails';
import { supabase } from './client';
import Topbar from './components/Topbar/Topbar';
import SignUp from './components/Login/SignUp';
import UserProfile from './components/UserProfile/UserProfile';
import EditProfile from './components/EditProfile/EditProfile';

function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("latest");
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setIsAuthenticated(!!data.session);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
        setAuthLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (authLoading) {
    return <p>Checking authentication...</p>;
  }
  return (
    <>
      <div className='app-container' style={{ display: 'flex'}}>
        {isAuthenticated && <Sidebar />}
        <div className='main-content' style={{ marginLeft: isAuthenticated ? '270px' : '0', flex: 1 }}>
          {isAuthenticated ? (
            <Topbar
              onSearchChange={setSearchTerm}
              onSortChange={setSortOption}
            />
          ) : (
            <header className="auth-brand">
              <h1>Flop or Hit</h1>
              <p>Predict whether an unreleased movie would flop or hit!</p>
            </header>
          )}
        <Routes>
          <Route path="/signup" element={isAuthenticated ? <Navigate to="/home" /> : <SignUp />}/>
          <Route path='/login' element={isAuthenticated ? <Navigate to="/home" /> : <Auth />} />
          <Route path='/home' element={isAuthenticated ? <HomeFeed searchTerm={searchTerm} sortOption={sortOption} /> : <Navigate to="/login" />} />
          <Route path='/create' element={isAuthenticated ? <CreatePost /> : <Navigate to="/login" />} />
          <Route path='/edit' element={isAuthenticated ? <EditPost /> : <Navigate to="/login" />} />
          <Route path='/post/:postId' element={isAuthenticated ? <PostDetails /> : <Navigate to="/login" />} />
          <Route path='*' element={<Navigate to="/login" />} />
          <Route path='/profile' element={isAuthenticated ? <UserProfile /> : <Navigate to="/login"/>} />
          <Route path='/profile/edit' element={isAuthenticated ? <EditProfile /> : <Navigate to="/login"/>} />
          <Route path='/users/:userId' element={isAuthenticated ? <UserProfile /> : <Navigate to="/login" />} />
        </Routes>
        </div>
      </div>
    </>
  )
}

export default App;
