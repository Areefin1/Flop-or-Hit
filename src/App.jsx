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

function App() {

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("latest");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {

        if(data.session)
        {
          setIsAuthenticated(true);
        }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {

        if(session)
        {
            setIsAuthenticated(true);
        }
        else
        {
          setIsAuthenticated(false);
        }
    });

    return () => {
        listener.subscription.unsubscribe();
    };

  }, []);

  return (
    <>
      <div className='app-container' style={{ display: 'flex'}}>
        {isAuthenticated && <Sidebar />}
        <div style={{ marginLeft: isAuthenticated ? '200px' : '0', flex: 1 }}>
          {isAuthenticated && <Topbar onSearchChange={setSearchTerm} onSortChange={setSortOption} />}
        <Routes>
          <Route path='/login' element={isAuthenticated ? <Navigate to="/home" /> : <Auth />} />
          <Route path='/home' element={isAuthenticated ? <HomeFeed searchTerm={searchTerm} sortOption={sortOption} /> : <Navigate to="/login" />} />
          <Route path='/create' element={isAuthenticated ? <CreatePost /> : <Navigate to="/login" />} />
          <Route path='/edit' element={isAuthenticated ? <EditPost /> : <Navigate to="/login" />} />
          <Route path='/post/:postId' element={isAuthenticated ? <PostDetails /> : <Navigate to="/login" />} />
          <Route path='*' element={<Navigate to="/login" />} />
        </Routes>
        </div>
      </div>
    </>
  )
}

export default App;
